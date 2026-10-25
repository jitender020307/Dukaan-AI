import { supabase } from '../lib/supabase';
import { parseProductMessage } from './parseProductMessage';
export { parseProductMessage };
import type { AssistantParseResult, ChatProductDraft, ChatProductResult, CustomerRecord, DashboardData, InventoryProduct, KhataTransaction, Order, SystemStatusData, RestockRecommendation } from './types';

type Row = Record<string, any>;
const requireClient = () => { if (!supabase) throw new Error('Supabase is not configured. Set the VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.'); return supabase; };

/** Utility: check if any of the supplied words appear in the given text (case‑insensitive). */
function anyWord(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some(w => lower.includes(w));
}

/** Strip common question words and return a cleaned query for product matching. */
export function cleanQuery(text: string): string {
  const stopWords = /\b(stock|kitna|kitne|baki|left|available|ka|hai|kya|how|many|the|are|of|se)\b/g;
  return text.toLowerCase().replace(stopWords, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

/** Find matching products by name or id after cleaning the query. */
export function matchProducts(products: InventoryProduct[], query: string): InventoryProduct[] {
  const cleaned = cleanQuery(query);
  if (!cleaned) return [];
  return products.filter(p => p.name.toLowerCase().includes(cleaned) || p.id.toLowerCase().includes(cleaned));
}

/** Route recognized shop questions directly to the chatbot instead of the order parser. */
export function isChatbotQuery(message: string): boolean {
  const text = message.trim().toLowerCase();
  if (!text) return false;

  // Explicit customer order requests stay with the existing order parser.
  if (/\b(?:add|buy|purchase|place an order|order)\b/.test(text) &&
      !/\b(?:sales?|revenue|transactions?|orders? today|orders? this week|orders? this month)\b/.test(text)) {
    return false;
  }

  return anyWord(text, [
    'stock', 'inventory', 'low stock', 'kam stock', 'out of stock', 'restock',
    'available', 'kitna', 'kitne', 'bache', 'khatam',
    'sales', 'sale', 'revenue', 'bikri', 'kamai', 'transaction',
    'best selling', 'best-selling', 'sabse zyada', 'top product', 'popular product',
    'what can you do', 'help',
  ]);
}
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
  return { id:p.id,name:p.name,nameHi:p.name_hi||'',barcode:p.barcode||'',category:p.category||'General',stock,unit:p.unit||'piece',minThreshold:min,leadDays:Number(p.lead_days)||1,costPrice:Number(p.cost_price)||0,sellingPrice:Number(p.selling_price)||0,mrp:Number(p.mrp)||0,distributor:p.distributor||'',distributorPhone:p.distributor_phone||'',status:stock<=0?'out_of_stock':stock<=min?'low_stock':'in_stock' };
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

/** Compute report boundaries in Asia/Kolkata, independent of the browser's timezone. */
export function getSalesPeriodBounds(
  period: 'today' | 'week' | 'month',
  now: Date = new Date(),
): { start: Date; end: Date } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  });
  const parts = formatter.formatToParts(now);
  const y = Number(parts.find(p => p.type === 'year')!.value);
  const m = Number(parts.find(p => p.type === 'month')!.value) - 1;
  const d = Number(parts.find(p => p.type === 'day')!.value);
  const weekday = parts.find(p => p.type === 'weekday')!.value;
  const inKolkata = (year: number, month: number, day: number) =>
    new Date(Date.UTC(year, month, day) - 5.5 * 3600 * 1000);

  let start: Date;
  if (period === 'today') {
    start = inKolkata(y, m, d);
  } else if (period === 'week') {
    const weekdayIndex: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
    const day = weekdayIndex[weekday];
    const diff = day === 0 ? 6 : day - 1;
    start = inKolkata(y, m, d - diff);
  } else {
    start = inKolkata(y, m, 1);
  }
  return { start, end: now };
}

export const api={
  /** Whether a message is a chatbot query rather than a customer order. */
  isChatbotQuery,

  /** Resolve the authenticated user's store ID for store-scoped queries. */
  async storeId():Promise<string>{ return await storeId(); },

  /** Inventory products scoped to the authenticated user's store. */
  getInventory:async(params?:{search?:string;category?:string;status?:string}):Promise<InventoryProduct[]>=>{
    const client=requireClient();let q=client.from('products').select('*').order('name');
    if(params?.search)q=q.or(`name.ilike.%${params.search.replace(/[,%()]/g,' ')}%,barcode.ilike.%${params.search.replace(/[,%()]/g,' ')}%`);
    if(params?.category&&params.category!=='All')q=q.eq('category',params.category);
    const {data,error}=await q;if(error)throw error;
    return (data||[]).map(mapProduct).filter(p=>!params?.status||params.status==='all'||p.status===params.status);
  },

  /** Store‑scoped sales report (today / week / month). */
  async getSalesReport(period: 'today' | 'week' | 'month'):Promise<{
    period:string;
    revenue:number;
    transactions:number;
    unitsSold:number;
    grossProfitEstimate:number;
    topProducts:any[];
  }> {
    const client=requireClient();
    const store_id = await this.storeId();

    const { start, end } = getSalesPeriodBounds(period);
    const startStr = start.toISOString();
    const endStr = end.toISOString();

    // Pull sales for this store in the window
    const {data:sales,error:salesError} = await client
      .from('sales')
      .select('id,total_amount,created_at')
      .eq('store_id', store_id)
      .gte('created_at', startStr)
      .lte('created_at', endStr);
    if (salesError) throw salesError;
    const saleIds = (sales||[]).map(s=>s.id);

    // Pull line items for those sales
    let items: any[] = [];
    if (saleIds.length > 0) {
      const {data:itemsRes,error:itemsError} = await client
        .from('sale_items')
        .select('sale_id,product_id,quantity,price_per_unit')
        .eq('store_id', store_id)
        .in('sale_id', saleIds);
      if (itemsError) throw itemsError;
      items = itemsRes || [];
    }

    // Pull product cost_price for profit calculation
    const {data:products,error:prodError} = await client
      .from('products')
      .select('id,name,cost_price')
      .eq('store_id', store_id);
    if (prodError) throw prodError;
    const costMap = new Map(products?.map(p=>[p.id,p.cost_price]));

    // Aggregate
    const revenue = (sales||[]).reduce((sum,s)=>sum+Number(s.total_amount),0);
    const transactions = (sales||[]).length;
    const unitsSold = items.reduce((sum,i)=>sum+Number(i.quantity),0);
    const grossProfitEstimate = items.reduce((sum,i)=> {
      const cost = Number(costMap.get(i.product_id)||0);
      return sum + Number(i.quantity)*(Number(i.price_per_unit)-cost);
    },0);

    // Top products by units sold
    const productQty = new Map<string,number>();
    items.forEach(i => {
      productQty.set(i.product_id,(productQty.get(i.product_id)||0)+Number(i.quantity));
    });
    const topProducts = Array.from(productQty.entries())
      .map(([id,units])=>{
        const prod = (products||[]).find(p=>p.id===id);
        const revenue = items.filter(it=>it.product_id===id)
                             .reduce((s,it)=>s+Number(it.quantity)*Number(it.price_per_unit),0);
        return {name:prod?.name||'Product',units_sold:units,revenue};
      })
      .sort((a,b)=>b.units_sold-a.units_sold)
      .slice(0,5);

    return {period, revenue, transactions, unitsSold, grossProfitEstimate, topProducts};
  },

  /** Chatbot – answer natural‑language shop questions. */
  async getChatResponse(message: string): Promise<{intent:string;data?:any;reply:string}> {
    const text = message.trim().toLowerCase();
    if (!text) return {intent:'unknown',reply:"Bhai, apna sawaal likh de. Stock ya sales ke baare mein pooch sakta hai."};

    const store_id = await this.storeId();
    const client=requireClient();

    // Sales & revenue queries
    if (anyWord(text, ["sale","sales","revenue","bikri","kamai","transaction"])) {
      let period: "today" | "week" | "month" = "today";
      if (anyWord(text, ["week","weekly","hafte"])) period = "week";
      else if (anyWord(text, ["month","monthly","mahine"])) period = "month";
      const data = await this.getSalesReport(period);
      return {
        intent:"sales_report",
        data,
        reply: period === "today"
          ? `Aaj ki sales ₹${data.revenue.toFixed(2)} hain, total ${data.transactions} transactions aur ${data.unitsSold} units sold hui hain.`
          : `${period} revenue ₹${data.revenue.toFixed(2)} hai, ${data.transactions} transactions ke saath.`,
      };
    }

    // Best-selling products
    if (anyWord(text, ["best selling","best-selling","sabse zyada","top product","popular product"])) {
      // Allow the user to ask for a specific period, e.g. "this week's best sellers".
      let period: "today" | "week" | "month" = "today";
      if (anyWord(text, ["week","weekly","hafte"])) period = "week";
      else if (anyWord(text, ["month","monthly","mahine"])) period = "month";
      const data = await this.getSalesReport(period);
      if (data.topProducts.length === 0) {
        const label = period === "today" ? "today" : `this ${period}`;
        return {intent:"best_sellers",data:[],reply:`Abhi ${label} ki recorded sales mein koi product nahi bika.`};
      }
      const top = data.topProducts[0];
      const label = period === "today" ? "Today's" : period === "week" ? "This week's" : "This month's";
      return {
        intent:"best_sellers",
        data:data.topProducts,
        reply:`${label} best seller is ${top.name}: ${top.units_sold} units, ₹${top.revenue?.toFixed(2)} revenue.`,
      };
    }

    // Low-stock / restock queries
    if (anyWord(text, ["low stock","kam stock","stock kam","out of stock","khatam","restock","order karna"])) {
      const products = await this.getInventory();
      const lowItems = products.filter(p => p.status === "low_stock" || p.status === "out_of_stock");
      if (lowItems.length === 0) return {intent:"low_stock",data:[],reply:"Abhi forecast ke hisaab se koi product low-stock alert mein nahi hai."};
      const reply = "Low-stock products: " + lowItems.map(i => `${i.name}: ${i.stock} ${i.unit} bache hain`).join(", ");
      return {intent:"low_stock",data:lowItems,reply};
    }

    // Stock lookup for specific products
    if (anyWord(text, ["stock","kitne","kitna","bache","available","inventory"])) {
      const products = await this.getInventory();
      const matches = matchProducts(products, text);
      if (matches.length === 1) {
        const p = matches[0];
        return {intent:"stock_lookup",data:p,reply:`${p.name} ke ${p.stock} ${p.unit} available hain.`};
      }
      if (matches.length > 1) return {intent:"clarify_product",reply:`Bhai, kis product ka stock chahiye: ${matches.map(m=>m.name).join(", ")}?`};
      return {intent:"product_not_found",reply:"Product identify nahi hua. Product ka naam likh, jaise 'Amul Taaza Milk ka stock kitna hai?'."};
    }

    return {
      intent:"help",
      reply:"Bhai, main abhi stock, low-stock alerts, today's sales aur best-selling products bata sakta hoon. Example: 'milk ka stock kitna hai?'",
    };
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
  parseAddProduct:async(message:string):Promise<ChatProductDraft>=>{
    return parseProductMessage(message);
  },
  createProductFromChat:async(draft:ChatProductDraft):Promise<ChatProductResult>=>{
    const client=requireClient();
    const product=await api.createProduct({
      name:draft.name,
      nameHi:draft.nameHi,
      barcode:draft.barcode,
      category:draft.category,
      stock:draft.stock,
      unit:draft.unit,
      minThreshold:draft.minStock,
      costPrice:draft.costPrice,
      sellingPrice:draft.sellingPrice,
      mrp:draft.mrp,
      distributor:draft.distributor,
      distributorPhone:draft.distributorPhone,
      leadDays:draft.leadDays,
    });
    return {success:true,productId:product.id,name:product.name,stock:product.stock,message:`"${product.name}" has been added to your inventory.`};
  },
  getDashboard:async():Promise<DashboardData>=>{
    const client=requireClient();const [sales,inventory,entries,adjustments]=await Promise.all([fetchOrders(),api.getInventory(),client.from('khata_entries').select('*').order('created_at',{ascending:false}).limit(20),client.from('inventory_adjustments').select('*').order('created_at',{ascending:false}).limit(20)]);
    if(entries.error)throw entries.error;if(adjustments.error)throw adjustments.error;
    const today=new Date().toDateString();const todaySales=sales.filter(s=>new Date(s.createdAt).toDateString()===today).reduce((n,s)=>n+s.totalAmount,0);
    const recentActivity=[...sales.slice(0,8).map(s=>({id:s.id,timestamp:s.createdAt,description:`Sale ${s.invoiceNo} · ${s.customerName} · ₹${s.totalAmount.toLocaleString('en-IN')}`,type:'order' as const})),...(adjustments.data||[]).slice(0,8).map(a=>({id:a.id,timestamp:a.created_at,description:`Stock ${Number(a.delta)>0?'increased':'reduced'} by ${Math.abs(Number(a.delta))} · ${a.reason}`,type:'inventory' as const})),...(entries.data||[]).slice(0,8).map(e=>({id:e.id,timestamp:e.created_at,description:`Khata ${e.entry_type==='udhaar'?'credit':'payment'} · ₹${Number(e.amount).toLocaleString('en-IN')}`,type:'khata' as const}))].sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime()).slice(0,12);
    const lowStockProducts=inventory.filter(p=>p.status==='low_stock'||p.status==='out_of_stock');
    return {todaySales,todayBillsCount:sales.filter(s=>new Date(s.createdAt).toDateString()===today).length,recentOrders:sales.slice(0,8),pendingOrdersCount:0,lowStockCount:lowStockProducts.length,totalProducts:inventory.length,pendingOrders:[],lowStockProducts,recentActivity};
  },
  getRestockRecommendations:async():Promise<import('./types').RestockRecommendation[]>=>{
    const client=requireClient();
    const store_id=await storeId();
    const today=new Date();
    const windowStart=new Date();windowStart.setDate(today.getDate()-6);windowStart.setHours(0,0,0,0);
    const windowEnd=new Date();windowEnd.setDate(today.getDate()+1);windowEnd.setHours(0,0,0,0);
    const salesRes=await client.from('sales').select('id,created_at').eq('store_id',store_id).gte('created_at',windowStart.toISOString()).lt('created_at',windowEnd.toISOString()).order('created_at',{ascending:true});
    if(salesRes.error)throw salesRes.error;
    const salesRows=salesRes.data||[];
    const saleIds=salesRows.map(s=>s.id);
    const saleTimestamps: Record<string,string>={};
    for(const s of salesRows)saleTimestamps[s.id]=s.created_at;
    let saleItemsRes: any = { data: [] };
    if(saleIds.length>0){
      const res=await client.from('sale_items').select('product_id,quantity,price_per_unit,sale_id').eq('store_id',store_id).in('sale_id',saleIds);
      if(res.error)throw res.error;
      saleItemsRes=res;
    }
    const productsRes=await client.from('products').select('*').eq('store_id',store_id);
    if(productsRes.error)throw productsRes.error;
    const products=productsRes.data||[];
    const recommendations: import('./types').RestockRecommendation[]=[];
    // Oldest-to-newest recency weights (linear ramp, sums to 1). Newer days carry more weight.
    const weightNumerators=[1,2,3,4,5,6,7];
    const weightDenominator=weightNumerators.reduce((a,b)=>a+b,0); // 28
    const dailyWeights=weightNumerators.map(n=>n/weightDenominator);
    const dailyWeightLabels=weightNumerators.map(n=>`${n}/${weightDenominator}`);
    for(const product of products){
      const productSaleItems=saleItemsRes.data?.filter((item: any)=>item.product_id===product.id)||[];
      const salesHistory: number[] = Array(7).fill(0);
      if(productSaleItems.length>0){
        for(let i=0;i<7;i++){
          const dayStart=new Date();dayStart.setDate(today.getDate()-6+i);dayStart.setHours(0,0,0,0);
          const dayEnd=new Date(dayStart);dayEnd.setDate(dayStart.getDate()+1);
          const daySales=productSaleItems.filter((item: any)=>{
            const saleTime=saleTimestamps[item.sale_id];
            if(!saleTime)return false;
            const saleDate=new Date(saleTime).getTime();
            return saleDate>=dayStart.getTime()&&saleDate<dayEnd.getTime();
          });
          salesHistory[i]=daySales.map((item: any)=>item.quantity).reduce((sum: number,qty: number)=>sum+qty,0);
        }
      }
      const weightedDailyDemand=salesHistory.reduce((sum: number,qty: number,idx: number)=>sum+qty*dailyWeights[idx],0);
      const leadDays=Number(product.lead_days)||1;
      const minStock=Number(product.min_stock)||0;
      const currentStock=Number(product.stock)||0;
      const expectedDemandDuringLeadTime=weightedDailyDemand*leadDays;
      const bufferStock=Math.max(0,expectedDemandDuringLeadTime*0.2);
      const recommendedOrder=Math.max(0,minStock-currentStock+expectedDemandDuringLeadTime+bufferStock);
      const totalRecentSales=productSaleItems.map((item: any)=>item.quantity).reduce((sum: number,q: number)=>sum+q,0);
      const confidence=totalRecentSales>=14?'high':totalRecentSales>=7?'medium':'low';
      const confidenceNote=totalRecentSales===0?'Recent sales data is sparse; this forecast has low reliability. Consider manual validation.':totalRecentSales>=14?'Adequate sales history for reliable forecasting.':totalRecentSales>=7?'Moderate sales history; use with caution.':'Insufficient sales history; treat forecast as tentative.';
      const mathExplanation=`Daily demand = weighted sum of last 7 days (${salesHistory.map((d,i)=>`${d}×${dailyWeightLabels[i]}`).join(' + ')}) = ${weightedDailyDemand.toFixed(2)}. Expected demand during lead time = ${weightedDailyDemand.toFixed(2)} × ${leadDays} days = ${expectedDemandDuringLeadTime.toFixed(2)}. Buffer = 20% of lead time demand = ${bufferStock.toFixed(2)}. Recommended order = max(0, min_stock ${minStock} - current stock ${currentStock} + lead time demand ${expectedDemandDuringLeadTime.toFixed(2)} + buffer ${bufferStock.toFixed(2)}) = ${recommendedOrder.toFixed(2)}.`;
      recommendations.push({
        itemId:product.id,
        itemName:product.name,
        category:product.category||'General',
        subtitle:`${product.category||'General'} item with ${product.distributor||'direct supplier'}`,currentStock,
        dailyAvgSales:Number(weightedDailyDemand.toFixed(2)),
        leadTimeDays:leadDays,
        bufferStock:Number(bufferStock.toFixed(2)),
        recommendedOrder:Number(recommendedOrder.toFixed(2)),
        confidence,
        confidenceNote,
        mathExplanation,
      });
    }
    return recommendations;
  },
  getSystemStatus:async():Promise<SystemStatusData>=>{
    const client=requireClient();const counts=await Promise.all([client.from('products').select('id',{count:'exact',head:true}),client.from('sales').select('id',{count:'exact',head:true}),client.from('customers').select('id',{count:'exact',head:true})]);for(const result of counts)if(result.error)throw result.error;
    const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Session expired. Sign in again.');
    return {status:'Connected',service:'DukaanAI Store App',uptimeSeconds:0,uptimeHuman:'Current authenticated session',database:'Supabase Postgres',activeEndpoints:['products','sales','sale_items','customers','khata_entries','inventory_adjustments','create_product','adjust_stock','complete_sale','add_khata_entry'],itemsCount:counts[0].count||0,ordersCount:counts[1].count||0,customersCount:counts[2].count||0,lastSync:new Date().toISOString()};
  }
};

