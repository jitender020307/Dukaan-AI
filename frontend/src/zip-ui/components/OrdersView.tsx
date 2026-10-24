import React, { useState, useEffect } from 'react';
import { Order, InventoryProduct } from '../types';
import { api } from '../api';

interface OrdersViewProps {
  initialSelectedOrder?: Order | null;
  onClearSelectedOrder?: () => void;
  inventory: InventoryProduct[];
  onOrderChanged: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  initialSelectedOrder,
  onClearSelectedOrder,
  inventory,
  onOrderChanged,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected order details modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New Order modal
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeMessage, setBarcodeMessage] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'cash' | 'upi' | 'khata'>('cash');
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [newOrderError, setNewOrderError] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getOrders(statusFilter);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    if (initialSelectedOrder) {
      setSelectedOrder(initialSelectedOrder);
    }
  }, [initialSelectedOrder]);

  const handleApprove = async (orderId: string) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const result = await api.updateOrderStatus(orderId, 'approved');
      setActionSuccess('Sale completed and stock updated.');
      setSelectedOrder(result.order);
      fetchOrders();
      onOrderChanged();
    } catch (err: any) {
      setActionError(err.message || 'Backend rejected order approval');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (orderId: string) => {
    const reason = window.prompt('Reason for rejecting order (optional):', 'Item unavailable') || 'Declined by shopkeeper';
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const result = await api.updateOrderStatus(orderId, 'rejected', reason);
      setActionSuccess('Order marked as rejected.');
      setSelectedOrder(result.order);
      fetchOrders();
      onOrderChanged();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddItemToCart = (prodId: string) => {
    const product=inventory.find((p)=>p.id===prodId);
    if(!product)return;
    const current=cartItems.find((p)=>p.productId===prodId)?.quantity||0;
    if(current>=product.stock){setNewOrderError(`Only ${product.stock} ${product.unit} available for ${product.name}.`);return;}
    setNewOrderError(null);
    setCartItems((prev) => {
      const existing = prev.find((p) => p.productId === prodId);
      if (existing) {
        return prev.map((p) => (p.productId === prodId ? { ...p, quantity: p.quantity + 1 } : p));
      }
      return [...prev, { productId: prodId, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (prodId: string, qty: number) => {
    const product=inventory.find((p)=>p.id===prodId);
    if(product&&qty>product.stock){setNewOrderError(`Only ${product.stock} ${product.unit} available for ${product.name}.`);return;}
    setNewOrderError(null);
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((p) => p.productId !== prodId));
    } else {
      setCartItems((prev) => prev.map((p) => (p.productId === prodId ? { ...p, quantity: qty } : p)));
    }
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setNewOrderError('Please add at least one item to the order');
      return;
    }

    setIsCreatingOrder(true);
    setNewOrderError(null);

    try {
      const created = await api.createOrder({
        customerName: newCustName.trim() || 'Walk-in customer',
        customerPhone: newCustPhone.trim() || undefined,
        paymentMethod: newPaymentMethod,
        items: cartItems,
      });

      setIsNewOrderModalOpen(false);
      setCartItems([]);
      setNewCustName('');
      setNewCustPhone('');
      setSelectedOrder(created);
      fetchOrders();
      onOrderChanged();
    } catch (err: any) {
      setNewOrderError(err.message || 'Could not complete this sale');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.invoiceNo.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.customerPhone && o.customerPhone.includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Sales & Bills</h2>
          <p className="text-xs text-gray-500">
            List, review, and approve incoming orders. Backend is the source of truth for totals and stock deductions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['all', 'completed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2 text-[18px] text-gray-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, name, phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-emerald-800"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800 flex items-center justify-between">
          <span>Error loading orders: {error}</span>
          <button
            type="button"
            onClick={fetchOrders}
            className="underline font-bold text-red-900 hover:text-red-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            <div className="w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading recent sales…
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            <span className="material-symbols-outlined text-gray-300 text-[36px] mb-1">receipt_long</span>
            <p className="font-semibold text-gray-800 text-sm">No sales found</p>
            <p className="text-gray-400 mt-0.5">
              {statusFilter !== 'all' ? `No orders with status "${statusFilter}".` : 'No sales recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Order Items</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Backend Total</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold font-mono text-gray-900">{ord.invoiceNo}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{ord.customerName}</span>
                        {ord.customerPhone && <span className="text-[11px] text-gray-500">{ord.customerPhone}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-gray-600">
                      {ord.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 uppercase font-semibold text-[10px] rounded bg-gray-100 text-gray-700">
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                          ord.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : ord.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : ord.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-gray-900 text-sm tabular-nums">
                      ₹{ord.totalAmount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(ord);
                          setActionError(null);
                          setActionSuccess(null);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 cursor-pointer"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-lg w-full p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900">Sale Details</span>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedOrder.invoiceNo}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  if (onClearSelectedOrder) onClearSelectedOrder();
                }}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Status alerts */}
            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs font-semibold text-red-800">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs font-semibold text-emerald-800">
                {actionSuccess}
              </div>
            )}

            {/* Customer & Order Metadata */}
            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 text-xs space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Customer:</span>
                <span className="font-bold text-gray-900">{selectedOrder.customerName}</span>
              </div>
              {selectedOrder.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Phone:</span>
                  <span className="text-gray-700">{selectedOrder.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Payment Mode:</span>
                <span className="font-bold text-gray-800 uppercase">{selectedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Created Time:</span>
                <span className="text-gray-600">{new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                <span className="text-gray-500 font-medium">Order Status:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                    selectedOrder.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : selectedOrder.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedOrder.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              {selectedOrder.rejectionReason && (
                <div className="pt-1 text-red-700 text-xs">
                  <strong>Rejection Note:</strong> {selectedOrder.rejectionReason}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Order Line Items</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-gray-900">{item.productName}</td>
                        <td className="py-2 px-3 text-center tabular-nums">{item.quantity}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-gray-600">₹{item.pricePerUnit}</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-900 tabular-nums">₹{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200 font-bold">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-right text-gray-700">
                        Backend Calculated Total:
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-800 text-sm tabular-nums">
                        ₹{selectedOrder.totalAmount}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  if (onClearSelectedOrder) onClearSelectedOrder();
                }}
                className="px-3.5 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>

              {selectedOrder.status === 'pending' && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleReject(selectedOrder.id)}
                    className="px-3.5 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 rounded text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    Reject Order
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedOrder.id)}
                    className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-xs font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    {actionLoading ? 'Updating...' : 'Approve Order'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Sale Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-lg w-full p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h3 className="text-base font-bold text-gray-900">Create New Sale</h3>
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {newOrderError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-800 font-medium">
                {newOrderError}
              </div>
            )}

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="Customer name or Walk-in"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'upi', 'khata'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNewPaymentMethod(m)}
                      className={`py-1.5 text-xs font-bold rounded border uppercase cursor-pointer ${
                        newPaymentMethod === m
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Items Section */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Scan product barcode</label>
                <form onSubmit={(e) => { e.preventDefault(); const code=barcodeInput.trim(); const product=inventory.find((p)=>p.barcode?.trim()===code); if(!product){setBarcodeMessage('Barcode not found in inventory.');return;} if(product.stock<=0){setBarcodeMessage(`${product.name} is out of stock.`);return;} handleAddItemToCart(product.id);setBarcodeInput('');setBarcodeMessage(`${product.name} added to the sale.`); }} className="flex gap-2">
                  <input autoFocus value={barcodeInput} onChange={(e)=>setBarcodeInput(e.target.value)} placeholder="Scan and press Enter" className="flex-1 px-3 py-2 border border-gray-300 rounded text-xs" />
                  <button type="submit" className="px-3 py-2 bg-emerald-800 text-white text-xs font-bold rounded">Scan</button>
                </form>
                {barcodeMessage&&<p className="mt-1 text-[11px] text-gray-600" role="status">{barcodeMessage}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pick Products from Inventory</label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded divide-y divide-gray-100 text-xs">
                  {inventory.map((prod) => {
                    const inCart = cartItems.find((p) => p.productId === prod.id);
                    return (
                      <div key={prod.id} className="p-2 flex items-center justify-between hover:bg-gray-50">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-gray-900 truncate">{prod.name}</p>
                          <p className="text-[11px] text-gray-500">
                            Price: ₹{prod.sellingPrice} • In stock: {prod.stock}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {inCart ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(prod.id, inCart.quantity - 1)}
                                className="w-6 h-6 rounded border border-gray-300 bg-white font-bold text-xs"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-bold">{inCart.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(prod.id, inCart.quantity + 1)}
                                className="w-6 h-6 rounded border border-gray-300 bg-white font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddItemToCart(prod.id)}
                              className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  {cartItems.length} product(s) selected • Total calculated from live product prices
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewOrderModalOpen(false)}
                    className="px-3.5 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingOrder || cartItems.length === 0}
                    className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isCreatingOrder ? 'Submitting...' : 'Save Order (Backend)'}
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
