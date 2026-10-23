import React from 'react';
import { NavTab } from '../types';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  domainName: string;
  domainConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  domainName,
  domainConnected,
}) => {
  const navItems: { tab: NavTab; label: string; icon: string; badge?: string }[] = [
    { tab: 'overview', label: 'Overview', icon: 'space_dashboard' },
    { tab: 'inventory', label: 'Inventory (Stock)', icon: 'inventory_2' },
    { tab: 'sales', label: 'Sales (Bikri)', icon: 'receipt_long' },
    { tab: 'customers', label: 'Customers (Khata)', icon: 'menu_book' },
    { 
      tab: 'domain', 
      label: 'Custom Domain', 
      icon: 'globe', 
      badge: domainConnected ? 'ACTIVE' : 'PENDING' 
    },
    { tab: 'privacy', label: 'Privacy Policy', icon: 'policy' },
    { tab: 'terms', label: 'Terms & Conditions', icon: 'description' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-[#EAE6DF] z-50 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo & Store Header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#14532D] flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">storefront</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[18px] font-bold text-[#003B1B] tracking-tight">DukaanAI</span>
                <span className="text-[11px] text-[#404941] font-medium">Kirana Sahayak</span>
              </div>
            </div>

            {/* Store Badge Selector */}
            <div className="p-2.5 bg-[#F0F5F0] rounded-lg border border-[#DFE4DF] flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="material-symbols-outlined text-[#003B1B] text-[20px] flex-shrink-0">storefront</span>
                <div className="flex flex-col truncate">
                  <span className="text-[13px] text-[#181D1A] font-semibold truncate">Ramesh General Store</span>
                  <span className="text-[11px] text-[#404941] truncate">Demo Market, Demo Nagar</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#404941] text-[18px]">unfold_more</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="px-3 py-1 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.tab);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors text-left text-[15px] font-semibold cursor-pointer ${
                    isActive
                      ? 'bg-[#14532D] text-white shadow-sm'
                      : 'text-[#404941] hover:bg-[#EBEFEA] hover:text-[#181D1A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide ${
                        isActive
                          ? 'bg-white/20 text-[#B1F2BE]'
                          : domainConnected
                          ? 'bg-[#DCFCE7] text-[#14532D]'
                          : 'bg-[#FFDBCA] text-[#763300]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Store Status & Profile */}
        <div className="p-4 flex flex-col gap-3 border-t border-[#EAE6DF]">
          {/* Live Store indicator */}
          <div className="bg-[#F0F5F0] p-2.5 rounded-lg border border-[#DFE4DF] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#96D5A3] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#14532D]"></span>
              </span>
              <span className="text-[13px] text-[#181D1A] font-semibold">Dukaan khuli hai</span>
            </div>
            <span className="text-[11px] text-[#14532D] font-bold px-2 py-0.5 rounded bg-[#DFE4DF]">LIVE</span>
          </div>

          {/* Profile Card */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#14532D] flex items-center justify-center text-white text-[15px] font-bold tracking-tight">
                RJ
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] text-[#181D1A] font-semibold leading-tight">Ramesh Joshi</span>
                <span className="text-[11px] text-[#404941]">Sanchalak</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#404941]">
              <button
                type="button"
                onClick={() => onSelectTab('domain')}
                title="Custom Domain & Settings"
                className="p-1.5 rounded-lg hover:bg-[#EBEFEA] hover:text-[#181D1A] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px]">settings</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('privacy')}
                title="Policies & Compliance"
                className="p-1.5 rounded-lg hover:bg-[#EBEFEA] hover:text-[#181D1A] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px]">help_outline</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
