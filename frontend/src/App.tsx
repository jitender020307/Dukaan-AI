import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

type Product = {id:string;name:string;name_hi:string;barcode:string|null;category:string;stock:number;unit:string;min_stock:number;cost_price:number;selling_price:number;mrp:number;distributor:string};
type Entry = {id:string;customer_id:string;entry_type:'udhaar'|'jama';amount:number;description:string;created_at:string};
type Customer = {id:string;name:string;phone:string;address:string;credit_limit:number;entries:Entry[]};
type Sale = {id:string;invoice_no:string;customer_name:string;payment_method:string;total_amount:number;created_at:string};
type Tab='overview'|'inventory'|'sales'|'khata';
const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
const input='w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none';
const primary='rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40';
const secondary='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold';

export default function App(){
 const [session,setSession]=useState<Session|null>(null),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [tab,setTab]=useState<Tab>('overview'),[store,setStore]=useState(''),[role,setRole]=useState('');
 const [products,setProducts]=useState<Product[]>([]),[customers,setCustomers]=useState<Customer[]>([]),[sales,setSales]=useState<Sale[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');

 const refresh=useCallback(async()=>{
  if(!supabase||!session)return;
  setLoading(true);setError('');
  try{
   const pr=await supabase!.from('profiles').select('store_id,role').eq('id',session.user.id).single();
   if(pr.error)throw pr.error;if(!pr.data?.store_id)throw Error('This user has no store assigned in profiles.');
   setRole(pr.data.role);
   const rs=await Promise.all([
    supabase!.from('stores').select('name').eq('id',pr.data.store_id).maybeSingle(),
    supabase!.from('products').select('*').order('name'),
    supabase!.from('customers').select('*').order('name'),
    supabase!.from('sales').select('*').order('created_at',{ascending:false}).limit(100),
    supabase!.from('khata_entries').select('*').order('created_at',{ascending:false})
   ]);
   for(const r of rs)if(r.error)throw r.error;
   setStore(rs[0].data?.name||'My Store');setProducts(rs[1].data||[]);
   const entries=(rs[4].data||[]) as Entry[];
   setCustomers((rs[2].data||[]).map((c:any)=>({...c,entries:entries.filter(e=>e.customer_id===c.id)})));
   setSales(rs[3].data||[]);
  }catch(e:any){setError(e.message||'Could not load store data.')}finally{setLoading(false)}
 },[session]);
 useEffect(()=>{
  if(!supabase){setLoading(false);return}
  supabase!.auth.getSession().then(({data})=>setSession(data.session));
  const {data:{subscription}}=supabase!.auth.onAuthStateChange((_event,s)=>setSession(s));
  return()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{if(session)void refresh();else{setLoading(false);setProducts([]);setCustomers([]);setSales([])}},[session,refresh]);

 const run=async(action:()=>Promise<void>,message:string)=>{
  setBusy(true);setError('');setNotice('');
  try{await action();await refresh();setNotice(message);return true}catch(e:any){setError(e.message||'Could not save change');return false}finally{setBusy(false)}
 };
 const signIn=async(e:React.FormEvent)=>{
  e.preventDefault();if(!supabase)return;setBusy(true);setError('');
  const {error}=await supabase!.auth.signInWithPassword({email,password});
  if(error)setError(error.message);setBusy(false);
 };
 const balance=(c:Customer)=>c.entries.reduce((n,e)=>n+(e.entry_type==='udhaar'?Number(e.amount):-Number(e.amount)),0);
 const today=sales.filter(s=>new Date(s.created_at).toDateString()===new Date().toDateString());
 const salesToday=today.reduce((n,s)=>n+Number(s.total_amount),0);
 const low=products.filter(p=>Number(p.stock)<=Number(p.min_stock));

 if(!supabase)return <Center title="Supabase setup required"><p>Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart Vite.</p></Center>;
 if(!session)return <main className="grid min-h-screen place-items-center bg-slate-50 p-4"><form onSubmit={signIn} className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm"><p className="font-bold uppercase tracking-wider text-emerald-800">DukaanAI</p><h1 className="mt-2 text-2xl font-bold">Sign in</h1><p className="mb-5 mt-1 text-sm text-slate-500">Use your existing Supabase user account.</p><label className="mb-3 block text-sm">Email<input required type="email" className={input+' mt-1'} value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="mb-4 block text-sm">Password<input required type="password" className={input+' mt-1'} value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="mb-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className={primary+' w-full'}>Sign in</button></form></main>;

 return <div className="min-h-screen bg-slate-50 text-slate-900">
  <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3"><div><b className="text-emerald-900">DukaanAI</b><div className="text-xs text-slate-500">{store} · {role}</div></div><nav className="flex gap-1">{(['overview','inventory','sales','khata'] as Tab[]).map(t=><button key={t} onClick={()=>setTab(t)} className={'rounded-lg px-3 py-2 text-sm capitalize '+(t===tab?'bg-emerald-800 text-white':'hover:bg-slate-100')}>{t}</button>)}</nav><button className={secondary} onClick={()=>void supabase!.auth.signOut()}>Sign out</button></div></header>
  <main className="mx-auto max-w-7xl p-4 sm:p-6">
   {error&&<div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
   {notice&&<div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
   {loading?<div className="rounded-xl border bg-white p-8 text-slate-500">Loading store data…</div>:<>
    {tab==='overview'&&<section><h1 className="text-2xl font-bold">Store overview</h1><p className="mt-1 text-sm text-slate-500">Live data from your Supabase store.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Sales today',money(salesToday)],['Bills today',String(today.length)],['Products',String(products.length)],['Low stock',String(low.length)]].map(([k,v])=><div key={k} className="rounded-xl border bg-white p-5"><div className="text-sm text-slate-500">{k}</div><div className="mt-2 text-2xl font-bold">{v}</div></div>)}</div><div className="mt-5 rounded-xl border bg-white p-5"><h2 className="font-semibold">Low stock</h2>{low.length?low.map(p=><div key={p.id} className="flex justify-between border-b py-3 text-sm"><span>{p.name}</span><b className="text-amber-700">{p.stock} {p.unit} · min {p.min_stock}</b></div>):<p className="mt-3 text-sm text-slate-500">No products below minimum stock.</p>}</div></section>}
    {tab==='inventory'&&<Inventory products={products} busy={busy} onAdd={(data:any)=>run(async()=>{const r=await supabase!.rpc('create_product',{p_product:data});if(r.error)throw r.error},'Product added')} onAdjust={(p:Product,d:number)=>run(async()=>{const r=await supabase!.rpc('adjust_stock',{p_product_id:p.id,p_delta:d,p_reason:'Manual stock adjustment'});if(r.error)throw r.error},'Stock updated')}/>}
    {tab==='sales'&&<Sales products={products} customers={customers} sales={sales} busy={busy} onSave={(payload:any)=>run(async()=>{const r=await supabase!.rpc('complete_sale',payload);if(r.error)throw r.error},'Bill saved; stock and Khata updated as needed')}/>}
    {tab==='khata'&&<Khata customers={customers} busy={busy} balance={balance} onAddCustomer={(data:any)=>run(async()=>{const p=await supabase!.from('profiles').select('store_id').eq('id',session.user.id).single();if(p.error)throw p.error;const r=await supabase!.from('customers').insert({store_id:p.data.store_id,...data});if(r.error)throw r.error},'Customer added')} onEntry={(id:string,type:string,amount:number,description:string)=>run(async()=>{const r=await supabase!.rpc('add_khata_entry',{p_customer_id:id,p_entry_type:type,p_amount:amount,p_description:description});if(r.error)throw r.error},'Khata entry saved')}/>}
   </>}
   <div className="mt-6 flex justify-between text-xs text-slate-400"><span>{session.user.email}</span><button className="underline" onClick={()=>void refresh()}>Refresh</button></div>
  </main>
 </div>;
}
function Center({title,children}:any){return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="max-w-xl rounded-2xl border bg-white p-8"><h1 className="text-2xl font-bold">{title}</h1><div className="mt-3 text-sm text-slate-600">{children}</div></section></main>}

function Inventory({products,busy,onAdd,onAdjust}:any){
 const [barcode,setBarcode]=useState(''),[result,setResult]=useState(''),[form,setForm]=useState(false);
 return <section><div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold">Inventory</h1><p className="mt-1 text-sm text-slate-500">Barcode lookup only finds products; it never adjusts stock.</p></div><button className={primary} onClick={()=>setForm(!form)}>Add product</button></div>
  <form onSubmit={e=>{e.preventDefault();const p=products.find((x:Product)=>x.barcode===barcode.trim());setResult(p?p.name+' · '+p.stock+' '+p.unit:'No product found');}} className="mt-4 flex max-w-xl gap-2"><input autoFocus className={input} value={barcode} onChange={e=>setBarcode(e.target.value)} placeholder="Scan barcode and press Enter"/><button className={secondary}>Find</button></form>{result&&<p className="mt-2 text-sm text-emerald-800">{result}</p>}
  {form&&<form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void onAdd({name:f.get('name'),name_hi:f.get('name_hi'),barcode:f.get('barcode'),category:f.get('category')||'General',stock:Number(f.get('stock')),unit:f.get('unit')||'piece',min_stock:Number(f.get('min_stock')),cost_price:Number(f.get('cost_price')),selling_price:Number(f.get('selling_price')),mrp:Number(f.get('selling_price')),distributor:f.get('supplier')||''}).then((ok:boolean)=>{if(ok)setForm(false)})}} className="mt-4 grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-3"><input required name="name" className={input} placeholder="Product name"/><input name="name_hi" className={input} placeholder="Hindi name"/><input name="barcode" className={input} placeholder="Barcode"/><input name="category" className={input} placeholder="Category"/><input required name="stock" type="number" min="0" step="0.001" className={input} placeholder="Opening stock"/><input name="unit" className={input} placeholder="Unit"/><input name="min_stock" type="number" min="0" className={input} placeholder="Minimum stock"/><input name="cost_price" type="number" min="0" step="0.01" className={input} placeholder="Cost price"/><input required name="selling_price" type="number" min="0" step="0.01" className={input} placeholder="Selling price"/><input name="supplier" className={input} placeholder="Supplier"/><button disabled={busy} className={primary}>Save product</button></form>}
  <div className="mt-4 overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{['Product','Barcode','Stock','Price','Adjust'].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y">{products.map((p:Product)=><tr key={p.id}><td className="px-4 py-3 font-medium">{p.name}<div className="text-xs text-slate-500">{p.category}</div></td><td className="px-4 py-3 font-mono text-xs">{p.barcode||'—'}</td><td className="px-4 py-3">{p.stock} {p.unit}<div className="text-xs text-slate-500">minimum {p.min_stock}</div></td><td className="px-4 py-3">{money(p.selling_price)}</td><td className="px-4 py-3"><button className={secondary+' mr-2'} disabled={busy||Number(p.stock)<=0} onClick={()=>onAdjust(p,-1)}>−1</button><button className={secondary} disabled={busy} onClick={()=>onAdjust(p,1)}>+1</button></td></tr>)}</tbody></table>{!products.length&&<p className="p-8 text-center text-sm text-slate-500">No products yet.</p>}</div></section>;
}
function Sales({products,customers,sales,busy,onSave}:any){
 const [code,setCode]=useState(''),[cart,setCart]=useState<Record<string,number>>({}),[method,setMethod]=useState('cash'),[customer,setCustomer]=useState(''),[message,setMessage]=useState('');
 const add=(p:Product)=>setCart(c=>({...c,[p.id]:(c[p.id]||0)+1}));
 const items=Object.entries(cart).map(([id,q])=>({id,qty:Number(q),product:products.find((p:Product)=>p.id===id)})).filter(x=>x.product);
 const total=items.reduce((n,x)=>n+Number(x.product.selling_price)*x.qty,0);
 const finish=async()=>{if(!items.length)return;if(method==='khata'&&!customer){setMessage('Choose a Khata customer');return}setMessage('');const ok=await onSave({p_items:items.map(x=>({product_id:x.id,quantity:x.qty})),p_payment_method:method,p_customer_id:method==='khata'?customer:null,p_customer_name:customers.find((c:Customer)=>c.id===customer)?.name||'Walk-in customer'});if(ok)setCart({})};
 return <section><h1 className="text-2xl font-bold">Sales</h1><p className="mt-1 text-sm text-slate-500">Scan or select products. Inventory changes only after saving a bill.</p><div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-xl border bg-white p-4"><form onSubmit={e=>{e.preventDefault();const p=products.find((x:Product)=>x.barcode===code.trim());if(p){add(p);setMessage('')}else setMessage('Barcode not found');setCode('')}} className="flex gap-2"><input autoFocus className={input} value={code} onChange={e=>setCode(e.target.value)} placeholder="Scan barcode and press Enter"/><button className={secondary}>Add</button></form>{products.map((p:Product)=><div key={p.id} className="flex justify-between border-b py-3 text-sm"><span>{p.name}<span className="ml-2 text-xs text-slate-500">{money(p.selling_price)} · stock {p.stock}</span></span><button disabled={Number(p.stock)<=0} className={secondary} onClick={()=>add(p)}>Add</button></div>)}{message&&<p className="mt-2 text-sm text-red-700">{message}</p>}</div><div className="rounded-xl border bg-white p-4"><h2 className="font-semibold">Current bill</h2>{items.map(x=><div key={x.id} className="flex justify-between border-b py-3 text-sm"><span>{x.product.name} × {x.qty}</span><span>{money(x.product.selling_price*x.qty)} <button className="ml-2" onClick={()=>setCart(c=>({...c,[x.id]:Math.max(0,c[x.id]-1)}))}>−</button></span></div>)}<div className="flex justify-between py-3 font-bold"><span>Total</span><span>{money(total)}</span></div><label className="block text-sm">Payment<select className={input+' mt-1'} value={method} onChange={e=>setMethod(e.target.value)}><option value="cash">Cash</option><option value="upi">UPI</option><option value="khata">Khata</option></select></label>{method==='khata'&&<label className="mt-3 block text-sm">Customer<select className={input+' mt-1'} value={customer} onChange={e=>setCustomer(e.target.value)}><option value="">Select customer</option>{customers.map((c:Customer)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}<button disabled={busy||!items.length} className={primary+' mt-4 w-full'} onClick={finish}>{busy?'Saving…':'Save bill'}</button></div></div><div className="mt-4 rounded-xl border bg-white p-4"><h2 className="font-semibold">Recent sales</h2>{sales.slice(0,8).map((s:Sale)=><div key={s.id} className="flex justify-between border-b py-3 text-sm"><span>{s.invoice_no} · {s.payment_method.toUpperCase()} · {new Date(s.created_at).toLocaleString()}</span><b>{money(s.total_amount)}</b></div>)}</div></section>;
}
function Khata({customers,busy,balance,onAddCustomer,onEntry}:any){
 const [form,setForm]=useState(false),[cid,setCid]=useState(''),[type,setType]=useState('jama'),[amount,setAmount]=useState(''),[note,setNote]=useState('');
 return <section><div className="flex justify-between"><div><h1 className="text-2xl font-bold">Khata</h1><p className="mt-1 text-sm text-slate-500">Customer credit ledger and payments.</p></div><button className={primary} onClick={()=>setForm(!form)}>Add customer</button></div>
 {form&&<form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void onAddCustomer({name:f.get('name'),phone:f.get('phone')||'',address:f.get('address')||'',credit_limit:Number(f.get('limit'))||3000}).then((ok:boolean)=>{if(ok)setForm(false)})}} className="mt-4 grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-2"><input required name="name" className={input} placeholder="Name"/><input name="phone" className={input} placeholder="Phone"/><input name="address" className={input} placeholder="Address"/><input name="limit" type="number" min="0" className={input} placeholder="Credit limit"/><button className={primary}>Save customer</button></form>}
 <form onSubmit={e=>{e.preventDefault();if(Number(amount)<=0||!cid)return;void onEntry(cid,type,Number(amount),note).then((ok:boolean)=>{if(ok){setAmount('');setNote('')}})}} className="mt-4 grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-5"><select required className={input} value={cid} onChange={e=>setCid(e.target.value)}><option value="">Select customer</option>{customers.map((c:Customer)=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select className={input} value={type} onChange={e=>setType(e.target.value)}><option value="jama">Payment received</option><option value="udhaar">Add credit</option></select><input required type="number" min=".01" step=".01" className={input} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount"/><input className={input} value={note} onChange={e=>setNote(e.target.value)} placeholder="Note"/><button disabled={busy||!customers.length} className={primary}>Save entry</button></form>
 <div className="mt-4 grid gap-3 lg:grid-cols-2">{customers.map((c:Customer)=><article key={c.id} className="rounded-xl border bg-white p-5"><div className="flex justify-between"><div><b>{c.name}</b><div className="text-xs text-slate-500">{c.phone} {c.address}</div></div><b>{money(Math.max(0,balance(c)))}</b></div>{c.entries.slice(0,5).map(e=><div key={e.id} className="flex justify-between border-t py-2 text-sm"><span>{e.description||e.entry_type} <small className="text-slate-400">{new Date(e.created_at).toLocaleDateString()}</small></span><b className={e.entry_type==='jama'?'text-emerald-700':'text-amber-700'}>{e.entry_type==='jama'?'−':'+'}{money(e.amount)}</b></div>)}</article>)}</div>{!customers.length&&<p className="mt-4 rounded-xl border bg-white p-8 text-center text-sm text-slate-500">No customers yet.</p>}</section>;
}

