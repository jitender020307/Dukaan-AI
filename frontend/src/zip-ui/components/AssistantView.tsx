import React, { useState } from 'react';
import { AssistantParseResult, Order, NavTab } from '../types';
import { api } from '../api';

interface AssistantViewProps {
  onOrderCreated: (order: Order) => void;
  onNavigate: (tab: NavTab) => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({ onOrderCreated, onNavigate }) => {
  const [customerMessage, setCustomerMessage] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<AssistantParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Order Placement State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'khata'>('upi');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const sampleMessages = [
    '2 [product name] and 1 [another product]',
    'Please add 3 [product name]',
  ];

  const handleParse = async () => {
    if (!customerMessage.trim()) return;

    setIsParsing(true);
    setParseError(null);
    setConfirmedOrder(null);
    setPlacementError(null);

    try {
      const result = await api.parseCustomerOrder(customerMessage.trim());
      setParseResult(result);
    } catch (err: any) {
      setParseError(err.message || 'Could not match the request to current inventory');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmAndPlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parseResult || parseResult.parsedItems.length === 0) return;

    setIsSubmittingOrder(true);
    setPlacementError(null);

    try {
      const itemsPayload = parseResult.parsedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const newOrder = await api.createOrder({
        customerName: customerName.trim() || 'WhatsApp Customer',
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod,
        items: itemsPayload,
      });

      setConfirmedOrder(newOrder);
      onOrderCreated(newOrder);
    } catch (err: any) {
      setPlacementError(err.message || 'Backend rejected order placement');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Customer Order Assistant</h2>
        <p className="text-xs text-gray-500">
          Match typed customer text to existing catalog items. Review the matches before recording a sale.
        </p>
      </div>

      {/* Step 1: Input Customer Request */}
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            1. Customer Request Text (WhatsApp / SMS)
          </label>
          <span className="text-xs text-gray-400">Matches against your live inventory</span>
        </div>

        <textarea
          rows={3}
          value={customerMessage}
          onChange={(e) => setCustomerMessage(e.target.value)}
          placeholder="Type or paste the customer's grocery request..."
          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-emerald-800"
        />

        {/* Quick Sample Prompts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-gray-500">Quick samples:</span>
          {sampleMessages.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCustomerMessage(sample)}
              className="text-[11px] px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer truncate max-w-xs"
            >
              "{sample.slice(0, 36)}..."
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={isParsing || !customerMessage.trim()}
            onClick={handleParse}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <span className={`material-symbols-outlined text-[16px] ${isParsing ? 'animate-spin' : ''}`}>
              {isParsing ? 'sync' : 'auto_fix_high'}
            </span>
            <span>{isParsing ? 'Parsing Request...' : 'Parse Customer Order'}</span>
          </button>
        </div>
      </div>

      {/* Parse Error Banner */}
      {parseError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs font-semibold text-red-800">
          Parsing Error: {parseError}
        </div>
      )}

      {/* Step 2: Parsed Result Breakdown */}
      {parseResult && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
              <h3 className="text-sm font-bold text-gray-900">2. Parsed Items & Clarification Review</h3>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Draft Only (Not placed)
              </span>
            </div>

            {/* Clarification Warnings */}
            {parseResult.clarificationsNeeded.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>Clarification / Stock Issues Detected:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1">
                  {parseResult.clarificationsNeeded.map((cl, idx) => (
                    <li key={idx}>{cl}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Parsed Items List */}
            {parseResult.parsedItems.length === 0 ? (
              <p className="text-xs text-gray-500 py-3 text-center">
                No matching catalog products could be confirmed from the request.
              </p>
            ) : (
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Confirmed Matched Items ({parseResult.parsedItems.length})
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3 text-center">Stock Available</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price (Backend)</th>
                        <th className="py-2.5 px-3 text-right">Item Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parseResult.parsedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{item.productName}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold">
                              {item.stockAvailable} {item.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold tabular-nums">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">₹{item.pricePerUnit}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900 tabular-nums">
                            ₹{item.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200 font-bold">
                      <tr>
                        <td colSpan={4} className="py-2.5 px-3 text-right text-gray-700">
                          Total (Backend Calculated):
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-800 text-sm tabular-nums">
                          ₹{parseResult.confirmedSummary.total}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Official Confirmation Form */}
          {parseResult.confirmedSummary.canPlaceOrder && !confirmedOrder && (
            <div className="bg-white p-4 sm:p-5 rounded-lg border border-emerald-300 shadow-xs space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-sm font-bold text-gray-900">3. Confirm & Record Sale</h3>
                <p className="text-xs text-gray-500">
                  Confirming records a completed sale through Supabase. Stock is deducted in the same transaction.
                </p>
              </div>

              {placementError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 font-medium">
                  {placementError}
                </div>
              )}

              <form onSubmit={handleConfirmAndPlaceOrder} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['upi', 'cash', 'khata'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-1.5 text-xs font-bold rounded border uppercase cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Calculated Total:{' '}
                    <span className="font-extrabold text-emerald-800 text-sm">
                      ₹{parseResult.confirmedSummary.total}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-md disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isSubmittingOrder ? 'Submitting to Backend...' : 'Confirm Order & Queue to Pending'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Confirmed Order Success Card */}
          {confirmedOrder && (
            <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-lg text-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <span className="material-symbols-outlined text-[20px] text-emerald-700">check_circle</span>
                <span>Order Officially Confirmed by Backend</span>
              </div>
              <p className="text-emerald-800">
                Order <strong>{confirmedOrder.invoiceNo}</strong> has been registered with status{' '}
                <span className="bg-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase">
                  {confirmedOrder.status}
                </span>{' '}
                and total <strong>₹{confirmedOrder.totalAmount}</strong>.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('orders')}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded cursor-pointer"
                >
                  View in Orders List
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedOrder(null);
                    setParseResult(null);
                    setCustomerMessage('');
                  }}
                  className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded cursor-pointer"
                >
                  Parse Another Request
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
