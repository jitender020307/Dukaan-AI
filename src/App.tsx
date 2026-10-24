import React, { useEffect, useState } from 'react';
import {
  initialInventory,
  initialSales,
  initialCustomers,
  restockRecommendationData,
  defaultCustomDomain,
} from './data/initialData';
import {
  NavTab,
  InventoryItem,
  SaleRecord,
  CustomerKhata,
  RestockRecommendation,
  CustomDomainConfig,
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { InventoryView } from './components/InventoryView';
import { SalesView } from './components/SalesView';
import { KhataView } from './components/KhataView';
import { CustomDomainView } from './components/CustomDomainView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { TermsView } from './components/TermsView';
import { OrderNoteModal } from './components/OrderNoteModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { DistributorModal } from './components/DistributorModal';
import { AlertsDrawer } from './components/AlertsDrawer';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [sales, setSales] = useState<SaleRecord[]>(initialSales);
  const [customers, setCustomers] = useState<CustomerKhata[]>(initialCustomers);
  const [domainConfig, setDomainConfig] = useState<CustomDomainConfig>(defaultCustomDomain);
  const [currentLang, setCurrentLang] = useState<'hi' | 'en'>('hi');

  // Ask the Python service for the milk recommendation; retain demo values if it is offline.
  const [recommendation, setRecommendation] =
    useState<RestockRecommendation>(restockRecommendationData);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/restock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'milk' }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Restock API request failed');
        return response.json();
      })
      .then((data) => {
        setRecommendation({
          ...restockRecommendationData,
          itemName: data.product,
          currentStock: data.stock,
          dailyAvgSales: data.dailyDemand,
          leadTimeDays: data.leadDays,
          bufferStock: data.safety,
          recommendedOrder: data.quantity,
          confidence: data.confidence as RestockRecommendation['confidence'],
          confidenceNote: data.method ?? 'Recent sales data se estimate',
          mathExplanation: data.reason,
        });
      })
      .catch(() => {
        // The overview keeps its clearly labeled sample recommendation when the API is offline.
      });
    return () => controller.abort();
  }, []);


  // Modals & Drawers state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isOrderNoteOpen, setIsOrderNoteOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [distributorModal, setDistributorModal] = useState<{
    open: boolean;
    name: string;
    phone: string;
  }>({ open: false, name: '', phone: '' });

  // Low stock inventory items
  const lowStockItems = inventory.filter(
    (i) => i.status === 'low_stock' || i.status === 'out_of_stock'
  );

  // Stock update handler
  const handleUpdateStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStock = Math.max(0, item.stock + delta);
          const nextStatus =
            nextStock === 0
              ? 'out_of_stock'
              : nextStock <= item.minThreshold
              ? 'low_stock'
              : 'in_stock';
          return { ...item, stock: nextStock, status: nextStatus };
        }
        return item;
      })
    );
  };

  // Add Item to inventory
  const handleAddItem = (newItem: Omit<InventoryItem, 'id'>) => {
    const id = `inv-${Date.now()}`;
    setInventory((prev) => [...prev, { ...newItem, id }]);
  };

  // Add new sale
  const handleAddNewSale = (saleData: Omit<SaleRecord, 'id' | 'invoiceNo'>) => {
    const nextInvoice = `BILL-${1049 + sales.length}`;
    const newSale: SaleRecord = {
      ...saleData,
      id: `sale-${Date.now()}`,
      invoiceNo: nextInvoice,
    };
    setSales((prev) => [newSale, ...prev]);

    // Deduct stock for sold items
    saleData.items.forEach((sold) => {
      handleUpdateStock(sold.itemId, -sold.quantity);
    });

    // If payment method is Khata, add to customer balance
    if (saleData.paymentMethod === 'khata' && saleData.customerName) {
      const match = customers.find(
        (c) => c.name.toLowerCase() === saleData.customerName?.toLowerCase()
      );
      if (match) {
        handleAddKhataTransaction(
          match.id,
          'udhaar',
          saleData.totalAmount,
          saleData.items.map((i) => `${i.itemName} (${i.quantity})`).join(', ')
        );
      }
    }
  };

  // Add Khata transaction
  const handleAddKhataTransaction = (
    customerId: string,
    type: 'udhaar' | 'jama',
    amount: number,
    description: string
  ) => {
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === customerId) {
          const balanceDiff = type === 'udhaar' ? amount : -amount;
          const nextBalance = Math.max(0, cust.balanceDue + balanceDiff);
          const nextStatus =
            nextBalance === 0
              ? 'settled'
              : nextBalance >= cust.creditLimit * 0.9
              ? 'warning'
              : 'active';

          const newTx = {
            id: `tx-${Date.now()}`,
            date: '23 Oct 2026, Aaj',
            type,
            amount,
            description,
          };

          return {
            ...cust,
            balanceDue: nextBalance,
            status: nextStatus,
            transactions: [newTx, ...cust.transactions],
          };
        }
        return cust;
      })
    );
  };

  // Add new customer
  const handleAddCustomer = (newCustomer: Omit<CustomerKhata, 'id' | 'transactions'>) => {
    const id = `cust-${Date.now()}`;
    setCustomers((prev) => [...prev, { ...newCustomer, id, transactions: [] }]);
  };

  // Custom domain updater
  const handleUpdateDomain = (domain: string) => {
    setDomainConfig((prev) => ({
      ...prev,
      domain,
      status: 'connected',
      sslStatus: 'active',
      lastChecked: '23 Oct 2026, Abhi jaancha gaya',
    }));
  };

  return (
    <div className="min-h-screen bg-[#F6FBF5] text-[#181D1A]">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        domainName={domainConfig.domain}
        domainConnected={domainConfig.status === 'connected'}
      />

      {/* Main View Area with Fixed Header */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <Header
          onOpenMobile={() => setIsMobileSidebarOpen(true)}
          onOpenVoice={() => setIsVoiceAssistantOpen(true)}
          onOpenDomain={() => setCurrentTab('domain')}
          domainName={domainConfig.domain}
          domainConnected={domainConfig.status === 'connected'}
          currentLang={currentLang}
          onToggleLang={() => setCurrentLang((l) => (l === 'hi' ? 'en' : 'hi'))}
          unreadAlertsCount={3}
          onOpenAlerts={() => setIsAlertsOpen(true)}
        />

        <main className="flex-1 pt-20 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <OverviewView
              onNavigate={setCurrentTab}
              onOpenOrderNote={() => setIsOrderNoteOpen(true)}
              onCallDistributor={(name, phone) =>
                setDistributorModal({ open: true, name, phone })
              }
              onAddToList={(itemName) => {
                // Flash alert / list add
              }}
              recommendation={recommendation}
              reorderListCount={lowStockItems.length}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              items={inventory}
              onUpdateStock={handleUpdateStock}
              onAddItem={handleAddItem}
              onOpenOrderNoteForDistributor={() => setIsOrderNoteOpen(true)}
            />
          )}

          {currentTab === 'sales' && (
            <SalesView
              sales={sales}
              inventory={inventory}
              onAddNewSale={handleAddNewSale}
            />
          )}

          {currentTab === 'customers' && (
            <KhataView
              customers={customers}
              onAddTransaction={handleAddKhataTransaction}
              onAddCustomer={handleAddCustomer}
            />
          )}

          {currentTab === 'domain' && (
            <CustomDomainView
              config={domainConfig}
              onUpdateDomain={handleUpdateDomain}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'privacy' && <PrivacyPolicyView />}

          {currentTab === 'terms' && <TermsView />}
        </main>

        {/* Clean, Grounded Footer without AI tags */}
        <footer className="border-t border-[#EAE6DF] bg-white py-5 px-6 sm:px-8 text-[12px] text-[#404941]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#14532D]">Ramesh General Store</span>
              <span>•</span>
              <span>Demo Market, Demo Nagar, Haryana</span>
              <span>•</span>
              <span className="text-[#717970] font-mono">Domain: {domainConfig.domain}</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setCurrentTab('privacy')}
                className="hover:text-[#14532D] hover:underline cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('terms')}
                className="hover:text-[#14532D] hover:underline cursor-pointer"
              >
                Terms & Conditions
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('domain')}
                className="hover:text-[#14532D] hover:underline cursor-pointer"
              >
                Custom Domain
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Reorder Note Modal */}
      {isOrderNoteOpen && (
        <OrderNoteModal
          recommendation={recommendation}
          lowStockItems={lowStockItems}
          onClose={() => setIsOrderNoteOpen(false)}
        />
      )}

      {/* Voice / Smart Assistant Modal */}
      {isVoiceAssistantOpen && (
        <VoiceAssistantModal
          onClose={() => setIsVoiceAssistantOpen(false)}
          inventory={inventory}
          sales={sales}
          customers={customers}
        />
      )}

      {/* Distributor Call Modal */}
      {distributorModal.open && (
        <DistributorModal
          distributorName={distributorModal.name}
          distributorPhone={distributorModal.phone}
          onClose={() => setDistributorModal({ open: false, name: '', phone: '' })}
          onOpenOrderNote={() => setIsOrderNoteOpen(true)}
        />
      )}

      {/* Alerts Drawer */}
      {isAlertsOpen && (
        <AlertsDrawer
          onClose={() => setIsAlertsOpen(false)}
          onNavigate={setCurrentTab}
        />
      )}
    </div>
  );
}
