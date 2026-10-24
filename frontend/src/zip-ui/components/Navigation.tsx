import React from 'react';
import type { NavTab } from '../types';

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
  email: string;
  onSignOut: () => void;
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
  email,
  onSignOut,
}) => {
  const tabs: { id: NavTab; label: string; icon: string; count?: number }[] = [
    { id: 'dashboard', label: 'Overview', icon: 'space_dashboard' },
    { id: 'orders', label: 'Sales & orders', icon: 'point_of_sale', count: pendingOrdersCount },
    { id: 'inventory', label: 'Inventory', icon: 'inventory_2', count: lowStockCount },
    { id: 'assistant', label: 'AI assistant', icon: 'auto_awesome' },
    { id: 'khata', label: 'Customer Khata', icon: 'menu_book' },
    { id: 'system', label: 'System health', icon: 'monitor_heart' },
  ];
  const activeLabel = tabs.find((tab) => tab.id === currentTab)?.label ?? 'Overview';

  return (
    <>
      <aside className="app-sidebar">
        <a className="sidebar-brand" href="#" onClick={(event) => { event.preventDefault(); onSelectTab('dashboard'); }}>
          <span className="brand-mark small"><span className="material-symbols-outlined">storefront</span></span>
          <span><strong>DukaanAI</strong><small>SHOPKEEPER DESK</small></span>
        </a>
        <div className="store-chip">
          <span className="store-avatar">{storeName.slice(0, 1).toUpperCase()}</span>
          <span className="store-details"><strong>{storeName}</strong><small><i className={isConnected ? 'connected-dot' : 'disconnected-dot'} />{isConnected ? 'Connected to store' : 'Connection needs attention'}</small></span>
          <span className="material-symbols-outlined store-chevron">expand_more</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => onSelectTab(tab.id)} className={isActive ? 'active' : ''} aria-current={isActive ? 'page' : undefined}>
                <span className="material-symbols-outlined">{tab.icon}</span><span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && <span className={`nav-count ${tab.id === 'inventory' ? 'alert' : ''}`}>{tab.count}</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip"><span className="avatar">{email.slice(0, 1).toUpperCase() || 'U'}</span><span className="user-details"><strong>{email || 'Store user'}</strong><small>{role || 'Store member'}</small></span></div>
          <button type="button" onClick={onSignOut} className="signout"><span className="material-symbols-outlined">logout</span>Sign out</button>
          <p className="sidebar-version">DukaanAI · Store workspace</p>
        </div>
      </aside>
      <header className="topbar">
        <div><div className="breadcrumb">Workspace <span>/</span> <b>{activeLabel}</b></div><h1>{activeLabel}</h1></div>
        <div className="top-actions">
          <span className={`connection-pill ${isConnected ? 'online' : 'offline'}`}><i />{isConnected ? 'Live data' : 'Offline'}</span>
          <span className="role-pill">{role || 'Member'}</span>
          <button type="button" onClick={onRefreshData} disabled={isRefreshing} className="sync-button" title="Refresh store data"><span className={`material-symbols-outlined ${isRefreshing ? 'animate-spin' : ''}`}>sync</span><span>{isRefreshing ? 'Syncing' : 'Refresh'}</span></button>
        </div>
      </header>
    </>
  );
};
