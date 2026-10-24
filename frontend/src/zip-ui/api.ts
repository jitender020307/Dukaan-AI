import { supabase } from '../lib/supabase';
import type { AssistantParseResult, CustomerRecord, DashboardData, InventoryProduct, KhataTransaction, Order, SystemStatusData } from './types';

type Row = Record<string, any>;
const requireClient = () => { if (!supabase) throw new Error('Supabase is not configured. Set the VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.'); return supabase; };
async function storeId() {
  const client = requireClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Your session has expired. Sign in again.');
  const { data, error } = await client.from('profiles').select('store_id').eq('id', user.id).single();
  if (error) throw error;
  if (!data?.store_id) throw new Error('This account does not have a store assigned.');
  return data.store_id as string;
}
function mapProduct(p: Row): InventoryProduct {
  const stock = Number(p.stock) || 0; const min = Number(p.min_stock) || 0;
  return { id:p.id,name:p.name,nameHi:p.name_hi||'',barcode:p.barcode||'',category:p.category||'General',stock,unit:p.unit||'piece',minThreshold:min,costPrice:Number(p.cost_price)||0,sellingPrice:Number(p.selling_price)||0,mrp:Number(p.mrp)||0,distributor:p.distributor||'',distributorPhone:p.distributor_phone||'',status:stock<=0?'out_of_stock':stock<=min?'low_stock':'in_stock' };
}
function mapOrder(s: Row, lines: Row[]): Order {
  const items=lines.filter(x=>x.sale_id===s.id).map(x=>({productId:x.product_id,productName:x.product_name,quantity:Number(x.quantity),pricePerUnit:Number(x.price_per_unit),total:Number(x.line_total)}));
  return {id:s.id,invoiceNo:s.invoice_no,customerName:s.customer_name||'Walk-in customer',status:'completed',paymentMethod:s.payment_method,items,subtotal:Number(s.total_amount),discount:0,tax:0,totalAmount:Number(s.total_amount),createdAt:s.created_at};
}
function mapCustomer(c: Row, all: Row[]): CustomerRecord {
  const transactions:KhataTransaction[]=all.filter(e=>e.customer_id===c.id).map(e=>({id:e.id,date:e.created_at,type:e.entry_type,amount:Number(e.amount),description:e.description||''}));
  const balanceDue=transactions.reduce((n,t)=>n+(t.type==='udhaar'?t.amount:-t.amount),0);
  return {id:c.id,name:c.name,phone:c.phone||'',address:c.address||'',balanceDue,creditLimit:Number(c.credit_limit)||0,status:balanceDue<=0?'settled':balanceDue>=Number(c.credit_limit||0)*0.8?'warning':'active',lastPaymentDate:transactions.find(t=>t.type==='jama')?.date||'',transactions};
}
async function fetchOrders():Promise<Order[]> {
  const client=requireClient();
  const salesRes=await client.from('sales').select('*').order('created_at',{ascending:false}).limit(200);
  if(salesRes.error)throw salesRes.error;
  const sales=salesRes.data||[];
  if(!sales.length)return [];
  const itemsRes=await client.from('sale_items').select('*').in('sale_id',sales.map(s=>s.id));
  if(itemsRes.error)throw itemsRes.error;
  const lines=itemsRes.data||[];
  return sales.map(s=>mapOrder(s,lines));
}
async function fetchCustomers():Promise<CustomerRecord[]> {
  const client=requireClient();
  const [customersRes,entriesRes]=await Promise.all([client.from('customers').select('*').order('name'),client.from('khata_entries').select('*').order('created_at',{ascending:false})]);
  if(customersRes.error)throw customersRes.error;if(entriesRes.error)throw entriesRes.error;
  return (customersRes.data||[]).map(c=>mapCustomer(c,entriesRes.data||[]));
}
async function createSale(data:{customerName:string;customerPhone?:string;items:{productId:string;quantity:number}[];paymentMethod:'cash'|'upi'|'khata'}):Promise<Order>{
  const client=requireClient();
  const productsRes=await client.from('products').select('*').in('id',data.items.map(i=>i.productId));
  if(productsRes.error)throw productsRes.error;
  let customerId:string|null=null;
  if(data.paymentMethod==='khata'){
    const customers=await fetchCustomers();
    const match=customers.find(c=>data.customerPhone?c.phone.trim()===data.customerPhone.trim():c.name.trim().toLowerCase()===data.customerName.trim().toLowerCase());
    if(!match)throw new Error('Khata sales must use an existing customer. Add the customer in Khata and enter their name or phone number.');
    customerId=match.id;
  }
  const {data:sale,error}=await client.rpc('complete_sale',{p_items:data.items.map(i=>({product_id:i.productId,quantity:i.quantity})),p_payment_method:data.paymentMethod,p_customer_id:customerId,p_customer_name:data.customerName||'Walk-in customer'});
  if(error)throw error;
  const lines=data.items.map(i=>{const p=(productsRes.data||[]).find(x=>x.id===i.productId);return {sale_id:sale.id,product_id:i.productId,product_name:p?.name||'Product',quantity:i.quantity,price_per_unit:Number(p?.selling_price)||0,line_total:(Number(p?.selling_price)||0)*i.quantity};});
  return mapOrder(sale,lines);
}

export const api={
  getInventory:async(params?:{search?:string;category?:string;status?:string}):Promise<InventoryProduct[]>=>{
    const client=requireClient();let q=client.from('products').select('*').order('name');
    if(params?.search)q=q.or(`name.ilike.%${params.search.replace(/[,%()]/g,' ')}%,barcode.ilike.%${params.search.replace(/[,%()]/g,' ')}%`);
    if(params?.category&&params.category!=='All')q=q.eq('category',params.category);
    const {data,error}=await q;if(error)throw error;
    return (data||[]).map(mapProduct).filter(p=>!params?.status||params.status==='all'||p.status===params.status);
  },
  createProduct:async(data:Omit<InventoryProduct,'id'|'status'>):Promise<InventoryProduct>=>{
    const {data:row,error}=await requireClient().rpc('create_product',{p_product:{name:data.name,name_hi:data.nameHi,barcode:data.barcode||null,category:data.category,stock:data.stock,unit:data.unit,min_stock:data.minThreshold,cost_price:data.costPrice,selling_price:data.sellingPrice,mrp:data.mrp,distributor:data.distributor,distributor_phone:data.distributorPhone}});
    if(error)throw error;return mapProduct(row);
  },
  updateProduct:async(id:string,data:Partial<InventoryProduct>):Promise<InventoryProduct>=>{
    const update:Row={};for(const [source,target] of Object.entries({name:'name',nameHi:'name_hi',barcode:'barcode',category:'category',unit:'unit',minThreshold:'min_stock',costPrice:'cost_price',sellingPrice:'selling_price',mrp:'mrp',distributor:'distributor',distributorPhone:'distributor_phone'})){if(data[source as keyof InventoryProduct]!==undefined)update[target]=data[source as keyof InventoryProduct];}
    update.updated_at=new Date().toISOString();
    const {data:row,error}=await requireClient().from('products').update(update).eq('id',id).select('*').single();if(error)throw error;return mapProduct(row);
  },
  updateStock:async(id:string,payload:{delta?:number;newStock?:number}):Promise<InventoryProduct>=>{
    const client=requireClient();let delta=payload.delta;
    if(delta===undefined&&payload.newStock!==undefined){const {data,error}=await client.from('products').select('stock').eq('id',id).single();if(error)throw error;delta=Number(payload.newStock)-Number(data.stock);}
    if(!delta)throw new Error('Enter a stock change greater than zero.');
    const {data,error}=await client.rpc('adjust_stock',{p_product_id:id,p_delta:delta,p_reason:'Manual stock adjustment'});if(error)throw error;return mapProduct(data);
  },
  deleteProduct:async(_id:string):Promise<{success:boolean}>=>{throw new Error('Product deletion is unavailable so past sales and inventory history remain intact.');},
  getOrders:async(status?:string):Promise<Order[]>=>{const all=await fetchOrders();return !status||status==='all'?all:all.filter(o=>o.status===status);},
  getOrder:async(id:string):Promise<Order>=>{const all=await fetchOrders();const item=all.find(o=>o.id===id);if(!item)throw new Error('Sale not found.');return item;},
  createOrder:createSale,
  updateOrderStatus:async(_id:string,_status:'approved'|'rejected',_reason?:string):Promise<{success:boolean;order:Order;updatedInventory:InventoryProduct[]}>=>{throw new Error('Completed sales are recorded immediately; this store backend does not have an order approval workflow.');},
  getKhata:fetchCustomers,
  addKhataTransaction:async(customerId:string,data:{type:'udhaar'|'jama';amount:number;description:string})=>{
    const {error}=await requireClient().rpc('add_khata_entry',{p_customer_id:customerId,p_entry_type:data.type,p_amount:data.amount,p_description:data.description});if(error)throw error;return {success:true,customer:(await fetchCustomers()).find(c=>c.id===customerId)!};
  },
  createKhataCustomer:async(data:{name:string;phone:string;address:string;creditLimit:number})=>{
    const client=requireClient();const store_id=await storeId();const {data:row,error}=await client.from('customers').insert({store_id,name:data.name,phone:data.phone,address:data.address,credit_limit:data.creditLimit}).select('*').single();if(error)throw error;return mapCustomer(row,[]);
  },
  parseCustomerOrder:async(message:string):Promise<AssistantParseResult>=>{
    const products=await api.getInventory();const normalized=message.toLowerCase().replace(/[^\p{L}\p{N}\s.-]/gu,' ').replace(/\s+/g,' ').trim();
    const parsedItems=[] as AssistantParseResult['parsedItems'];const matched=new Set<string>();
    for(const p of [...products].sort((a,b)=>b.name.length-a.name.length)){
      const name=p.name.toLowerCase().replace(/[^\p{L}\p{N}\s.-]/gu,' ').replace(/\s+/g,' ').trim();
      const alias=name.replace(/\s*\([^)]*\)/g,'').trim();
      const match=[name,alias].find(n=>n.length>2&&normalized.includes(n));if(!match||matched.has(p.id))continue;
      const before=normalized.slice(Math.max(0,normalized.indexOf(match)-18),normalized.indexOf(match));const quantityMatch=before.match(/(\d+(?:\.\d+)?)\s*(?:x|pc|pcs|packet|packets|kg|l|litre|liter)?\s*$/i);const quantity=quantityMatch?Number(quantityMatch[1]):1;
      matched.add(p.id);parsedItems.push({productId:p.id,productName:p.name,quantity,pricePerUnit:p.sellingPrice,total:quantity*p.sellingPrice,unit:p.unit,stockAvailable:p.stock});
    }
    const clarificationsNeeded:string[]=[];if(parsedItems.length===0)clarificationsNeeded.push('No product names matched. Use a product name from Inventory or scan its barcode on the Sales screen.');
    for(const item of parsedItems)if(item.quantity>item.stockAvailable)clarificationsNeeded.push(`${item.productName}: requested ${item.quantity}, available ${item.stockAvailable}.`);
    const subtotal=parsedItems.reduce((n,i)=>n+i.total,0);
    return {customerMessage:message,parsedItems,clarificationsNeeded,confirmedSummary:{itemsCount:parsedItems.reduce((n,i)=>n+i.quantity,0),subtotal,deliveryFee:0,total:subtotal,canPlaceOrder:parsedItems.length>0&&clarificationsNeeded.length===0}};
  },
  getDashboard:async():Promise<DashboardData>=>{
    const client=requireClient();const [sales,inventory,entries,adjustments]=await Promise.all([fetchOrders(),api.getInventory(),client.from('khata_entries').select('*').order('created_at',{ascending:false}).limit(20),client.from('inventory_adjustments').select('*').order('created_at',{ascending:false}).limit(20)]);
    if(entries.error)throw entries.error;if(adjustments.error)throw adjustments.error;
    const today=new Date().toDateString();const todaySales=sales.filter(s=>new Date(s.createdAt).toDateString()===today).reduce((n,s)=>n+s.totalAmount,0);
    const recentActivity=[...sales.slice(0,8).map(s=>({id:s.id,timestamp:s.createdAt,description:`Sale ${s.invoiceNo} · ${s.customerName} · ₹${s.totalAmount.toLocaleString('en-IN')}`,type:'order' as const})),...(adjustments.data||[]).slice(0,8).map(a=>({id:a.id,timestamp:a.created_at,description:`Stock ${Number(a.delta)>0?'increased':'reduced'} by ${Math.abs(Number(a.delta))} · ${a.reason}`,type:'inventory' as const})),...(entries.data||[]).slice(0,8).map(e=>({id:e.id,timestamp:e.created_at,description:`Khata ${e.entry_type==='udhaar'?'credit':'payment'} · ₹${Number(e.amount).toLocaleString('en-IN')}`,type:'khata' as const}))].sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime()).slice(0,12);
    const lowStockProducts=inventory.filter(p=>p.status==='low_stock'||p.status==='out_of_stock');
    return {todaySales,todayBillsCount:sales.filter(s=>new Date(s.createdAt).toDateString()===today).length,recentOrders:sales.slice(0,8),pendingOrdersCount:0,lowStockCount:lowStockProducts.length,totalProducts:inventory.length,pendingOrders:[],lowStockProducts,recentActivity};
  },
  getSystemStatus:async():Promise<SystemStatusData>=>{
    const client=requireClient();const counts=await Promise.all([client.from('products').select('id',{count:'exact',head:true}),client.from('sales').select('id',{count:'exact',head:true}),client.from('customers').select('id',{count:'exact',head:true})]);for(const result of counts)if(result.error)throw result.error;
    const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Session expired. Sign in again.');
    return {status:'Connected',service:'DukaanAI Store App',uptimeSeconds:0,uptimeHuman:'Current authenticated session',database:'Supabase Postgres',activeEndpoints:['products','sales','sale_items','customers','khata_entries','inventory_adjustments','create_product','adjust_stock','complete_sale','add_khata_entry'],itemsCount:counts[0].count||0,ordersCount:counts[1].count||0,customersCount:counts[2].count||0,lastSync:new Date().toISOString()};
  }
};
