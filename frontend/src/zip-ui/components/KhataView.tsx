import React, { useState, useEffect } from 'react';
import { CustomerRecord } from '../types';
import { api } from '../api';

interface KhataViewProps {
  onKhataChanged: () => void;
}

export const KhataView: React.FC<KhataViewProps> = ({ onKhataChanged }) => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected customer for transaction modal
  const [activeCustomer, setActiveCustomer] = useState<CustomerRecord | null>(null);
  const [txType, setTxType] = useState<'udhaar' | 'jama'>('jama');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // New Customer Modal
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustLimit, setNewCustLimit] = useState('3000');
  const [newCustError, setNewCustError] = useState<string | null>(null);
  const [isCreatingCust, setIsCreatingCust] = useState(false);

  // Feedback banner
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchKhata = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getKhata();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Could not load customer Khata');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKhata();
  }, []);

  const totalOutstanding = customers.reduce((sum, c) => sum + c.balanceDue, 0);
  const activeCount = customers.filter((c) => c.balanceDue > 0).length;

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;

    const amt = parseFloat(txAmount);
    if (!amt || amt <= 0) {
      setTxError('Please enter a valid amount');
      return;
    }

    setIsSubmittingTx(true);
    setTxError(null);

    try {
      await api.addKhataTransaction(activeCustomer.id, {
        type: txType,
        amount: amt,
        description: txDescription.trim() || (txType === 'jama' ? 'Cash collected' : 'Store grocery credit'),
      });

      setFeedback(`Transaction recorded successfully for ${activeCustomer.name}.`);
      setActiveCustomer(null);
      setTxAmount('');
      setTxDescription('');
      fetchKhata();
      onKhataChanged();
    } catch (err: any) {
      setTxError(err.message || 'Backend rejected transaction');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      setNewCustError('Customer name is required');
      return;
    }

    setIsCreatingCust(true);
    setNewCustError(null);

    try {
      await api.createKhataCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        address: newCustAddress.trim() || 'Sector 14, Gurugram',
        creditLimit: parseInt(newCustLimit, 10) || 3000,
      });

      setFeedback(`New customer ${newCustName} added to Khata.`);
      setIsNewCustModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      fetchKhata();
      onKhataChanged();
    } catch (err: any) {
      setNewCustError(err.message || 'Could not create customer');
    } finally {
      setIsCreatingCust(false);
    }
  };

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.address.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Customer Khata (Bahi-Khata Ledger)</h2>
          <p className="text-xs text-gray-500">
            Track customer balances, log credit (udhaar) or payments (jama), and review transaction histories.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewCustModalOpen(true)}
          className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          <span>New Customer</span>
        </button>
      </div>

      {/* Success Notification */}
      {feedback && (
        <div className="p-3 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-gray-500 hover:text-gray-800">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-medium">Total Outstanding Due</span>
          <div className="mt-1 text-2xl font-bold text-amber-700 tabular-nums">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">{activeCount} customer(s) have unpaid balances</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-medium">Credit Limit Ceiling</span>
          <div className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">₹3,000</div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Standard safe limit per customer</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-medium">Active Accounts</span>
          <div className="mt-1 text-2xl font-bold text-emerald-800 tabular-nums">{customers.length}</div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Recorded in Supabase Khata ledger</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2 text-[18px] text-gray-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer by name, phone, or address..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-emerald-800"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800 flex items-center justify-between">
          <span>Error loading Khata: {error}</span>
          <button type="button" onClick={fetchKhata} className="underline font-bold text-red-900 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Customer Cards Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-500 text-xs">
          <div className="w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading customer Khata…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-xs bg-white rounded-lg border border-gray-200">
          <span className="material-symbols-outlined text-gray-300 text-[36px] mb-1">person_search</span>
          <p className="font-semibold text-gray-800 text-sm">No customer accounts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((cust) => {
            const isSettled = cust.balanceDue === 0;
            const isWarning = cust.balanceDue >= cust.creditLimit * 0.9;

            return (
              <div
                key={cust.id}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{cust.name}</h4>
                      <p className="text-xs text-gray-500">{cust.phone || 'No phone'}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{cust.address}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        isSettled
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isWarning
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {isSettled ? 'Settled' : isWarning ? 'Near Limit' : 'Active Balance'}
                    </span>
                  </div>

                  {/* Balance Strip */}
                  <div className="mt-3 p-2.5 rounded bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-gray-500 block">Balance Due</span>
                      <span
                        className={`text-base font-extrabold tabular-nums ${
                          isSettled ? 'text-emerald-800' : 'text-amber-800'
                        }`}
                      >
                        ₹{cust.balanceDue.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-gray-500 block">Credit Limit</span>
                      <span className="font-semibold text-gray-800 tabular-nums">
                        ₹{cust.creditLimit.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="mt-3">
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block mb-1">
                      Recent Ledger ({cust.transactions.length})
                    </span>
                    <div className="max-h-24 overflow-y-auto space-y-1 text-xs divide-y divide-gray-100">
                      {cust.transactions.slice(0, 3).map((tx) => (
                        <div key={tx.id} className="pt-1 flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <p className="text-gray-800 font-medium truncate">{tx.description}</p>
                            <p className="text-[10px] text-gray-400">{tx.date}</p>
                          </div>
                          <span
                            className={`font-bold tabular-nums flex-shrink-0 ${
                              tx.type === 'jama' ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {tx.type === 'jama' ? `+₹${tx.amount} (Paid)` : `-₹${tx.amount} (Credit)`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCustomer(cust);
                      setTxError(null);
                      setTxAmount('');
                      setTxDescription('');
                    }}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-xs font-bold cursor-pointer shadow-xs"
                  >
                    Record Transaction
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Transaction Modal */}
      {activeCustomer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-sm w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Record Entry: {activeCustomer.name}</h3>
                <p className="text-xs text-gray-500">Current Balance: ₹{activeCustomer.balanceDue}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCustomer(null)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {txError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 font-medium">
                {txError}
              </div>
            )}

            <form onSubmit={handleRecordTransaction} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('jama')}
                  className={`py-1.5 text-xs font-bold rounded border cursor-pointer ${
                    txType === 'jama'
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  + Jama (Payment)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('udhaar')}
                  className={`py-1.5 text-xs font-bold rounded border cursor-pointer ${
                    txType === 'udhaar'
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  - Udhaar (Credit)
                </button>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-bold focus:outline-none focus:border-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description / Note</label>
                <input
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder={txType === 'jama' ? 'e.g. Cash collected' : 'e.g. 5kg Atta, 1L Oil'}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveCustomer(null)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTx}
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmittingTx ? 'Saving...' : 'Save Entry (Backend)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-sm w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
              <h3 className="text-sm font-bold text-gray-900">Add New Khata Customer</h3>
              <button
                type="button"
                onClick={() => setIsNewCustModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {newCustError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 font-medium">
                {newCustError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Masterji Tailor"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Address / Street</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Gali No. 3, Sector 14"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  value={newCustLimit}
                  onChange={(e) => setNewCustLimit(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCust}
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isCreatingCust ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
