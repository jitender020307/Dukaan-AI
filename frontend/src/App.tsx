import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import type { DashboardData, NavTab, Order } from './zip-ui/types';
import { api } from './zip-ui/api';
import { Navigation } from './zip-ui/components/Navigation';
import { DashboardView } from './zip-ui/components/DashboardView';
import { OrdersView } from './zip-ui/components/OrdersView';
import { InventoryView } from './zip-ui/components/InventoryView';
import { AssistantView } from './zip-ui/components/AssistantView';
import { KhataView } from './zip-ui/components/KhataView';
import { SystemStatusView } from './zip-ui/components/SystemStatusView';

const input='w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none';
const primary='rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40';

export default function App(){
  const [session,setSession]=useState<Session|null>(null);
  const [sessionLoading,setSessionLoading]=useState(true);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [currentTab,setCurrentTab]=useState<NavTab>('dashboard');
  const [dashboardData,setDashboardData]=useState<DashboardData|null>(null);
  const [inventoryList,setInventoryList]=useState<Awaited<ReturnType<typeof api.getInventory>>>([]);
  const [isLoading,setIsLoading]=useState(true);
  const [isRefreshing,setIsRefreshing]=useState(false);
  const [selectedOrder,setSelectedOrder]=useState<Order|null>(null);
  const [storeName,setStoreName]=useState('My Store');
  const [role,setRole]=useState('');

  const fetchGlobalData=useCallback(async()=>{
    if(!session)return;
    setIsRefreshing(true);setError(null);
    try{
      const [dash,inventory]=await Promise.all([api.getDashboard(),api.getInventory()]);
      setDashboardData(dash);setInventoryList(inventory);
    }catch(err){setError(err instanceof Error?err.message:'Could not connect to the store backend.');}
    finally{setIsLoading(false);setIsRefreshing(false);}
  },[session]);

  useEffect(()=>{
    if(!supabase){setSessionLoading(false);return;}
    supabase.auth.getSession().then(({data,error:authError})=>{if(authError)setError(authError.message);setSession(data.session);setSessionLoading(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setSessionLoading(false);});
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session){setDashboardData(null);setInventoryList([]);setStoreName('My Store');setRole('');setIsLoading(false);return;}
    let alive=true;
    setIsLoading(true);
    void (async()=>{
      try{
        const profile=await supabase!.from('profiles').select('store_id,role').eq('id',session.user.id).single();
        if(profile.error)throw profile.error;
        if(!profile.data?.store_id)throw new Error('This user has no store assigned in profiles.');
        const [store]=await Promise.all([supabase!.from('stores').select('name').eq('id',profile.data.store_id).maybeSingle()]);
        if(store.error)throw store.error;
        if(alive){setRole(profile.data.role||'');setStoreName(store.data?.name||'My Store');}
      }catch(e){if(alive)setError(e instanceof Error?e.message:'Could not load your store profile.');}
    })();
    return()=>{alive=false;};
  },[session]);
  useEffect(()=>{if(session)void fetchGlobalData();},[session,fetchGlobalData]);

  const signIn=async(event:FormEvent)=>{
    event.preventDefault();if(!supabase)return;setBusy(true);setError(null);
    const {error:authError}=await supabase.auth.signInWithPassword({email,password});
    if(authError)setError(authError.message);setBusy(false);
  };
  const signOut=async()=>{if(supabase)await supabase.auth.signOut();};
  const selectTab=(tab:NavTab)=>{setCurrentTab(tab);if(tab!=='orders')setSelectedOrder(null);};
  const selectDashboardOrder=(order:Order)=>{setSelectedOrder(order);setCurrentTab('orders');};

  if(!supabase)return <main className="min-h-screen grid place-items-center bg-gray-50 p-5"><section className="max-w-xl rounded-xl border bg-white p-7"><h1 className="text-xl font-bold">Supabase setup required</h1><p className="mt-2 text-sm text-gray-600">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart the app.</p></section></main>;
  if(sessionLoading)return <main className="min-h-screen grid place-items-center bg-gray-50 text-sm text-gray-500">Checking your session…</main>;
  if(!session)return <main className="login-screen"><form onSubmit={signIn} className="login-card"><div className="brand-mark"><span className="material-symbols-outlined">storefront</span></div><p className="eyebrow">DUKAANAI · SHOPKEEPER DESK</p><h1>Welcome back</h1><p className="login-copy">Sign in to manage your store, stock, sales and customer Khata.</p><label className="mb-3 block text-sm font-medium">Email<input required type="email" className={input+' mt-1'} value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="mb-4 block text-sm font-medium">Password<input required type="password" className={input+' mt-1'} value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className={primary+' w-full'}>{busy?'Signing in…':'Sign in'}</button></form></main>;

  return <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
    <Navigation currentTab={currentTab} onSelectTab={selectTab} pendingOrdersCount={dashboardData?.pendingOrdersCount||0} lowStockCount={dashboardData?.lowStockCount||0} onRefreshData={()=>void fetchGlobalData()} isRefreshing={isRefreshing} storeName={storeName} role={role} isConnected={!isLoading&&!error}/>
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
      {error&&<div role="alert" className="mb-4 p-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-800"><div className="flex justify-between gap-3"><span>{error}</span><button className="font-bold" onClick={()=>void fetchGlobalData()} aria-label="Retry">Retry</button></div></div>}
      {currentTab==='dashboard'&&<DashboardView data={dashboardData} isLoading={isLoading} error={error} onRefresh={()=>void fetchGlobalData()} onNavigate={selectTab} onSelectOrder={selectDashboardOrder}/>}
      {currentTab==='orders'&&<OrdersView initialSelectedOrder={selectedOrder} onClearSelectedOrder={()=>setSelectedOrder(null)} inventory={inventoryList} onOrderChanged={()=>void fetchGlobalData()}/>}
      {currentTab==='inventory'&&<InventoryView onInventoryChanged={()=>void fetchGlobalData()}/>}
      {currentTab==='assistant'&&<AssistantView onOrderCreated={()=>void fetchGlobalData()} onNavigate={selectTab}/>}
      {currentTab==='khata'&&<KhataView onKhataChanged={()=>void fetchGlobalData()}/>}
      {currentTab==='system'&&<SystemStatusView/>}
    </main>
    <footer className="border-t border-gray-200 bg-white py-3.5 px-4 sm:px-6 text-xs text-gray-500"><div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="font-bold text-gray-800">{storeName}</span><span>•</span><span>Live Supabase store</span><span>•</span><span className="capitalize">{role||'Store member'}</span></div><div className="flex items-center gap-3"><span>{session.user.email}</span><button type="button" onClick={()=>void signOut()} className="font-semibold text-emerald-800 hover:underline">Sign out</button></div></div></footer>
  </div>;
}
