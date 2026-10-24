import React, { useState } from 'react';
import { DashboardData, Order, InventoryProduct, NavTab } from '../types';
import { api } from '../api';

interface DashboardViewProps {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onNavigate: (tab: NavTab) => void;
  onSelectOrder: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  isLoading,
  error,
  onRefresh,
  onNavigate,
  onSelectOrder,
}) => {
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleApprove = async (orderId: string) => {
    setActionLoadingId(orderId);
    setActionFeedback(null);
    try {
      await api.updateOrderStatus(orderId, 'approved');
      setActionFeedback({ message: 'Order approved successfully. Stock has been deducted.', type: 'success' });
      onRefresh();
    } catch (err: any) {
      setActionFeedback({ message: err.message || 'Failed to approve order', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    const reason = window.prompt('Reason for rejecting order (optional):', 'Item unavailable') || 'Declined by shopkeeper';
    setActionLoadingId(orderId);
    setActionFeedback(null);
    try {
      await api.updateOrderStatus(orderId, 'rejected', reason);
      setActionFeedback({ message: 'Order marked as rejected.', type: 'success' });
      onRefresh();
    } catch (err: any) {
      setActionFeedback({ message: err.message || 'Failed to reject order', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickAddStock = async (prodId: string, amount: number) => {
    setActionLoadingId(prodId);
    setActionFeedback(null);
    try {
      await api.updateStock(prodId, { delta: amount });
      setActionFeedback({ message: `Added +${amount} to stock.`, type: 'success' });
      onRefresh();
    } catch (err: any) {
      setActionFeedback({ message: err.message || 'Failed to update stock', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-medium text-gray-600">Loading shopkeeper dashboard from backend...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center my-6">
        <span className="material-symbols-outlined text-red-600 text-[36px] mb-2">error</span>
        <h3 className="text-base font-bold text-red-900 mb-1">Backend Connection Error</h3>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-md cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Shopkeeper Dashboard</h2>
          <p className="text-xs text-gray-500">Sales, inventory health and recent activity from your store.</p>
        </div>
        <div className="text-xs text-gray-500">
          Source of truth: <span className="font-semibold text-gray-800">Supabase store data</span>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-md text-xs font-semibold flex items-center justify-between border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {actionFeedback.type === 'success' ? 'check_circle' : 'warning'}
            </span>
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Sales today</span>
            <span className="material-symbols-outlined text-gray-400 text-[18px]">point_of_sale</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
            ₹{data?.todaySales.toLocaleString('en-IN') || 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">Completed transactions today</div>
        </div>

        {/* Bills today */}
        <div
          onClick={() => onNavigate('orders')}
          className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs cursor-pointer hover:bg-gray-50/80 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-gray-500">
              Bills today
            </span>
            <span
              className={`material-symbols-outlined text-[18px] text-gray-400`}
            >
              receipt_long
            </span>
          </div>
          <div
            className={`mt-2 text-2xl font-bold tabular-nums text-gray-900`}
          >
            {data?.todayBillsCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Completed transactions recorded today
          </div>
        </div>

        {/* Low Stock Items */}
        <div
          onClick={() => onNavigate('inventory')}
          className={`bg-white p-4 rounded-lg border shadow-xs cursor-pointer transition-colors ${
            (data?.lowStockCount || 0) > 0 ? 'border-red-300 hover:bg-red-50/40' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={(data?.lowStockCount || 0) > 0 ? 'text-red-800 font-bold' : 'text-gray-500'}>
              Low-Stock Products
            </span>
            <span
              className={`material-symbols-outlined text-[18px] ${
                (data?.lowStockCount || 0) > 0 ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              warning
            </span>
          </div>
          <div
            className={`mt-2 text-2xl font-bold tabular-nums ${
              (data?.lowStockCount || 0) > 0 ? 'text-red-700' : 'text-gray-900'
            }`}
          >
            {data?.lowStockCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">Items at or below safety threshold</div>
        </div>

        {/* Total Catalog Products */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs cursor-pointer hover:bg-gray-50/80 transition-colors"
        >
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Total Catalog</span>
            <span className="material-symbols-outlined text-gray-400 text-[18px]">inventory_2</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
            {data?.totalProducts || 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">Active listed inventory items</div>
        </div>
      </div>

      {/* Main Grid: Recent Sales & Assistant with Low Stock + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-700 text-[20px]">receipt_long</span><h3 className="text-sm font-bold text-gray-900">Recent Sales</h3></div>
              <button type="button" onClick={() => onNavigate('orders')} className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer">View all sales</button>
            </div>
            <div className="p-4">
              {(!data?.recentOrders || data.recentOrders.length === 0) ? <div className="py-8 text-center text-gray-500 text-sm"><span className="material-symbols-outlined text-gray-300 text-[32px] mb-1">receipt_long</span><p className="font-semibold text-gray-700">No sales recorded yet</p><p className="text-xs text-gray-400 mt-0.5">Create a sale to see it here.</p></div> : <div className="divide-y divide-gray-100">{data.recentOrders.slice(0,6).map((sale)=><button key={sale.id} type="button" onClick={()=>onSelectOrder(sale)} className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50"><span className="min-w-0"><span className="block text-xs font-bold text-gray-900">{sale.invoiceNo} · {sale.customerName}</span><span className="block mt-1 text-[11px] text-gray-500">{sale.items.map((item)=>`${item.productName} × ${item.quantity}`).join(', ')}</span></span><span className="shrink-0 text-right"><b className="block text-xs text-emerald-800">₹{sale.totalAmount.toLocaleString('en-IN')}</b><small className="text-[10px] text-gray-400">{new Date(sale.createdAt).toLocaleString('en-IN')}</small></span></button>)}</div>}
            </div>
          </div>

          {/* Quick Assistant Callout */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-emerald-800 text-white flex items-center justify-center font-bold"><span className="material-symbols-outlined text-[20px]">support_agent</span></div>
              <div><h4 className="text-sm font-bold text-emerald-950">Customer Order Assistant</h4><p className="text-xs text-emerald-800">Match typed requests with products in your live catalog.</p></div>
            </div>
            <button type="button" onClick={() => onNavigate('assistant')} className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-md cursor-pointer whitespace-nowrap">Open Assistant</button>
          </div>
        </div>

        {/* Low Stock Alerts & Recent Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Low Stock Products */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[20px]">inventory</span>
                <h3 className="text-sm font-bold text-gray-900">Low-Stock Products ({data?.lowStockCount || 0})</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                Manage stock
              </button>
            </div>

            <div className="p-4">
              {(!data?.lowStockProducts || data.lowStockProducts.length === 0) ? (
                <div className="py-6 text-center text-gray-500 text-xs">
                  <span className="material-symbols-outlined text-emerald-600 text-[28px] mb-1">check_circle</span>
                  <p className="font-semibold text-gray-800">All items are sufficiently stocked.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data.lowStockProducts.slice(0, 5).map((prod) => {
                    const isUpdating = actionLoadingId === prod.id;
                    return (
                      <div key={prod.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{prod.name}</p>
                          <p className="text-[11px] text-gray-500">{prod.distributor}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                              prod.stock === 0
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {prod.stock === 0 ? 'Out of stock' : `${prod.stock} left`}
                          </span>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleQuickAddStock(prod.id, 5)}
                            className="px-2 py-1 text-[11px] font-bold rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 cursor-pointer"
                            title="Add +5 packets to stock"
                          >
                            {isUpdating ? '...' : '+5 Stock'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Backend Activity */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-600 text-[18px]">history</span>
              <h3 className="text-sm font-bold text-gray-900">Recent Store Activity</h3>
            </div>
            <div className="p-4">
              {(!data?.recentActivity || data.recentActivity.length === 0) ? (
                <p className="text-xs text-gray-400 py-3 text-center">No recent activity recorded.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentActivity.map((act) => (
                    <div key={act.id} className="flex items-start gap-2.5 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-1.5 flex-shrink-0"></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium leading-snug">{act.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{act.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
