import React from 'react';
import { NavTab } from '../types';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingOrdersCount: number;
  lowStockCount: number;
  onRefreshData: () => void;
  isRefreshing: boolean;
  storeName: string;
  role: string;
  isConnected: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  pendingOrdersCount,
  lowStockCount,
  onRefreshData,
  isRefreshing,
  storeName,
  role,
  isConnected,
}) => {
  const tabs: { id: NavTab; label: string; icon: string; count?: number; countColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    {
      id: 'orders',
      label: 'Orders',
      icon: 'receipt_long',
      count: pendingOrdersCount,
      countColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: 'inventory_2',
      count: lowStockCount,
      countColor: 'bg-red-100 text-red-800 border-red-300',
    },
    { id: 'assistant', label: 'Order Assistant', icon: 'support_agent' },
    { id: 'khata', label: 'Customers (Khata)', icon: 'menu_book' },
    { id: 'system', label: 'System Status', icon: 'dns' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      {/* Top Shop Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-emerald-800 flex items-center justify-center text-white font-bold text-sm">
            <span className="material-symbols-outlined text-[18px]">storefront</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 leading-tight">{storeName}</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${isConnected?'bg-emerald-50 text-emerald-800 border-emerald-200':'bg-amber-50 text-amber-800 border-amber-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected?'bg-emerald-600':'bg-amber-600'}`}></span>
                {isConnected?'Supabase connected':'Connection needs attention'}
              </span>
            </div>
            <p className="text-xs text-gray-500">Shopkeeper Desk • {role || 'Store member'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Fetch latest store data"
          >
            <span className={`material-symbols-outlined text-[16px] text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[11px] font-bold rounded-full border ${
                      isActive ? 'bg-white/20 text-white border-white/30' : tab.countColor
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
