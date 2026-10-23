import React, { useState } from 'react';
import { SaleRecord, InventoryItem } from '../types';

interface SalesViewProps {
  sales: SaleRecord[];
  inventory: InventoryItem[];
  onAddNewSale: (sale: Omit<SaleRecord, 'id' | 'invoiceNo'>) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  sales,
  inventory,
  onAddNewSale,
}) => {
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'cash' | 'upi' | 'khata'>('all');

  // New Sale modal state
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'khata'>('cash');
  const [selectedItemId, setSelectedItemId] = useState(inventory[0]?.id || '');
  const [quantity, setQuantity] = useState('1');
  const [cartItems, setCartItems] = useState<{ item: InventoryItem; qty: number }[]>([]);

  const totalSales = 8450;
  const cashSales = 3890;
  const upiSales = 3720;
  const khataSales = 840;

  const filteredSales = sales.filter((s) => {
    if (filterMode === 'all') return true;
    return s.paymentMethod === filterMode;
  });

  const handleAddToCart = () => {
    const item = inventory.find((i) => i.id === selectedItemId);
    const qty = parseInt(quantity, 10) || 1;
    if (!item) return;

    setCartItems((prev) => {
      const existing = prev.find((p) => p.item.id === item.id);
      if (existing) {
        return prev.map((p) => (p.item.id === item.id ? { ...p, qty: p.qty + qty } : p));
      }
      return [...prev, { item, qty }];
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((p) => p.item.id !== id));
  };

  const currentCartTotal = cartItems.reduce(
    (sum, c) => sum + c.item.sellingPrice * c.qty,
    0
  );

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const items = cartItems.map((c) => ({
      itemId: c.item.id,
      itemName: c.item.name,
      quantity: c.qty,
      pricePerUnit: c.item.sellingPrice,
      total: c.item.sellingPrice * c.qty,
    }));

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    onAddNewSale({
      time: timeStr,
      customerName: customerName.trim() || 'Counter Cash Customer',
      items,
      totalAmount: currentCartTotal,
      paymentMethod,
    });

    // Reset
    setCartItems([]);
    setCustomerName('');
    setIsNewSaleOpen(false);
  };

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-3">
        <div>
          <h1 className="text-[26px] sm:text-[30px] font-bold text-[#003B1B] tracking-tight">
            Sales (Aaj ki Bikri Bahi)
          </h1>
          <p className="text-[14px] text-[#404941] mt-0.5">
            Dukaan ki dainik bikri, nakad, UPI aur udhaar ki poori entry.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewSaleOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg text-[14px] font-semibold hover:bg-[#003B1B] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[19px]">add_shopping_cart</span>
          <span>Nayi Bikri Likhein</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-white p-4 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <span className="text-[12px] text-[#404941] font-medium">Kul Bikri (Today)</span>
          <div className="text-[24px] font-bold text-[#181D1A] mt-1 tabular-nums">
            ₹{totalSales.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#14532D] font-bold mt-0.5 block">67 packets sold</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <span className="text-[12px] text-[#404941] font-medium">Nakad (Cash)</span>
          <div className="text-[24px] font-bold text-[#14532D] mt-1 tabular-nums">
            ₹{cashSales.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#717970] mt-0.5 block">Galle mein jama</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <span className="text-[12px] text-[#404941] font-medium">Online (UPI QR)</span>
          <div className="text-[24px] font-bold text-[#003B1B] mt-1 tabular-nums">
            ₹{upiSales.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#717970] mt-0.5 block">Bank account mein</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <span className="text-[12px] text-[#404941] font-medium">Udhaar (Khata)</span>
          <div className="text-[24px] font-bold text-[#9B4500] mt-1 tabular-nums">
            ₹{khataSales.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#9B4500] font-bold mt-0.5 block">Baaki hisaab mein darj</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer ${
            filterMode === 'all'
              ? 'bg-[#14532D] text-white'
              : 'bg-white border border-[#DFE4DF] text-[#404941] hover:bg-[#F0F5F0]'
          }`}
        >
          Sabhi Bills ({sales.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('cash')}
          className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer ${
            filterMode === 'cash'
              ? 'bg-[#14532D] text-white'
              : 'bg-white border border-[#DFE4DF] text-[#404941] hover:bg-[#F0F5F0]'
          }`}
        >
          Cash ({sales.filter((s) => s.paymentMethod === 'cash').length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('upi')}
          className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer ${
            filterMode === 'upi'
              ? 'bg-[#14532D] text-white'
              : 'bg-white border border-[#DFE4DF] text-[#404941] hover:bg-[#F0F5F0]'
          }`}
        >
          UPI ({sales.filter((s) => s.paymentMethod === 'upi').length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('khata')}
          className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer ${
            filterMode === 'khata'
              ? 'bg-[#14532D] text-white'
              : 'bg-white border border-[#DFE4DF] text-[#404941] hover:bg-[#F0F5F0]'
          }`}
        >
          Udhaar Khata ({sales.filter((s) => s.paymentMethod === 'khata').length})
        </button>
      </div>

      {/* Sales Transactions List */}
      <div className="bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="divide-y divide-[#EBEFEA]">
          {filteredSales.map((sale) => (
            <div key={sale.id} className="p-4 hover:bg-[#F6FBF5] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F0F5F0] border border-[#DFE4DF] flex items-center justify-center flex-shrink-0 text-[#14532D]">
                  <span className="material-symbols-outlined text-[20px]">
                    {sale.paymentMethod === 'upi'
                      ? 'qr_code_2'
                      : sale.paymentMethod === 'khata'
                      ? 'menu_book'
                      : 'payments'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#181D1A] text-[15px]">
                      {sale.customerName || 'Cash Customer'}
                    </span>
                    <span className="text-[11px] font-bold text-[#717970] px-1.5 py-0.5 rounded bg-[#F0F5F0]">
                      {sale.invoiceNo}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        sale.paymentMethod === 'upi'
                          ? 'bg-[#E0F2FE] text-[#0369A1]'
                          : sale.paymentMethod === 'khata'
                          ? 'bg-[#FFDBCA] text-[#763300]'
                          : 'bg-[#DCFCE7] text-[#14532D]'
                      }`}
                    >
                      {sale.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[13px] text-[#404941] mt-1 flex flex-wrap gap-1">
                    {sale.items.map((it, idx) => (
                      <span key={idx}>
                        {it.itemName} ({it.quantity}x)
                        {idx < sale.items.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-[#717970] mt-0.5">Samay: {sale.time}</span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-[#F0F5F0]">
                <span className="text-[18px] font-extrabold text-[#14532D] tabular-nums">
                  ₹{sale.totalAmount}
                </span>
                <span className="text-[11px] text-[#717970]">
                  {sale.paymentMethod === 'khata' ? 'Khata mein joda gaya' : 'Buktana Prapt'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Sale Modal */}
      {isNewSaleOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EAE6DF] max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEFEA] mb-4">
              <h2 className="text-[18px] font-bold text-[#181D1A]">Nayi Bikri Darj Karein</h2>
              <button
                type="button"
                onClick={() => setIsNewSaleOpen(false)}
                className="text-[#404941] hover:text-[#181D1A] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCompleteSale} className="flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-bold text-[#404941] block mb-1">
                  Grahak ka Naam (Khata ke liye zaroori)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Sunil Sharma, Sharma ji (Gali 3)"
                  className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                />
              </div>

              {/* Item Adder */}
              <div className="p-3 bg-[#F0F5F0] rounded-lg border border-[#DFE4DF]">
                <span className="text-[12px] font-bold text-[#181D1A] block mb-2">Samaan Jodein</span>
                <div className="flex gap-2">
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-[#DFE4DF] rounded-lg text-[13px] focus:outline-none focus:border-[#14532D]"
                  >
                    {inventory.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} (₹{i.sellingPrice}) - Stock: {i.stock}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-16 px-2 py-2 bg-white border border-[#DFE4DF] rounded-lg text-[13px] text-center focus:outline-none focus:border-[#14532D]"
                  />
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="px-3 py-2 bg-[#14532D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003B1B] cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {/* Cart list preview */}
                {cartItems.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#DFE4DF] flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                    {cartItems.map((c) => (
                      <div
                        key={c.item.id}
                        className="flex items-center justify-between text-[13px] bg-white px-2.5 py-1.5 rounded border border-[#DFE4DF]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#181D1A]">{c.item.name}</span>
                          <span className="text-[#404941]">x {c.qty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#14532D]">
                            ₹{c.item.sellingPrice * c.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(c.item.id)}
                            className="text-[#BA1A1A] hover:opacity-75 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[12px] font-bold text-[#404941] block mb-1">
                  Buktana ka Tarika (Payment Method)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-lg border text-[13px] font-bold cursor-pointer transition-colors ${
                      paymentMethod === 'cash'
                        ? 'bg-[#14532D] text-white border-[#14532D]'
                        : 'bg-white border-[#DFE4DF] text-[#404941] hover:bg-[#F0F5F0]'
                    }`}
                  >
                    Cash (Nakad)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-3 rounded-lg border text-[13px] font-bold cursor-pointer transition-colors ${
                      paymentMethod === 'upi'
                        ? 'bg-[#14532D] text-white border-[#14532D]'
                        : 'bg-white border-[#DFE4DF] text-[#404941] hover:bg-[#F0F5F0]'
                    }`}
                  >
                    UPI QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('khata')}
                    className={`py-2 px-3 rounded-lg border text-[13px] font-bold cursor-pointer transition-colors ${
                      paymentMethod === 'khata'
                        ? 'bg-[#9B4500] text-white border-[#9B4500]'
                        : 'bg-white border-[#DFE4DF] text-[#404941] hover:bg-[#F0F5F0]'
                    }`}
                  >
                    Udhaar Khata
                  </button>
                </div>
              </div>

              {/* Total & Action */}
              <div className="pt-3 border-t border-[#EBEFEA] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#404941] block">Kul Rakam (Total)</span>
                  <span className="text-[22px] font-extrabold text-[#14532D] tabular-nums">
                    ₹{currentCartTotal}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewSaleOpen(false)}
                    className="px-4 py-2 border border-[#DFE4DF] rounded-lg text-[14px] font-semibold text-[#404941] hover:bg-[#F0F5F0] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cartItems.length === 0}
                    className="px-4 py-2 bg-[#14532D] text-white rounded-lg text-[14px] font-semibold hover:bg-[#003B1B] transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Bill Save Karein
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
