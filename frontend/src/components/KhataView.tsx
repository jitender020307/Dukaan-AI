import React, { useState } from 'react';
import { CustomerKhata } from '../types';

interface KhataViewProps {
  customers: CustomerKhata[];
  onAddTransaction: (
    customerId: string,
    type: 'udhaar' | 'jama',
    amount: number,
    description: string
  ) => void;
  onAddCustomer: (newCustomer: Omit<CustomerKhata, 'id' | 'transactions'>) => void;
}

export const KhataView: React.FC<KhataViewProps> = ({
  customers,
  onAddTransaction,
  onAddCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCustomer, setActiveCustomer] = useState<CustomerKhata | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<CustomerKhata | null>(null);
  const [copiedReminder, setCopiedReminder] = useState(false);

  // New Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'udhaar' | 'jama'>('jama');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');

  // Add Customer Modal State
  const [isAddCustOpen, setIsAddCustOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustLimit, setNewCustLimit] = useState('3000');

  const totalOutstanding = customers.reduce((sum, c) => sum + c.balanceDue, 0);
  const activeCount = customers.filter((c) => c.balanceDue > 0).length;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenReminder = (cust: CustomerKhata) => {
    setReminderTarget(cust);
    setIsReminderOpen(true);
    setCopiedReminder(false);
  };

  const getReminderMessage = (cust: CustomerKhata) => {
    return `Namaste ${cust.name} ji,\n\nRamesh General Store (Demo Market, Demo Nagar) se aapka bahi-khata baaki hisaab ₹${cust.balanceDue.toLocaleString('en-IN')} hai.\n\nAap suvidhanusaar dukaan par aakar ya diye gaye UPI number par jama kar sakte hain.\n\nDhanyawaad,\nRamesh Joshi (Sanchalak)\nPhone: +91 00000 00000`;
  };

  const handleCopyReminder = () => {
    if (!reminderTarget) return;
    navigator.clipboard.writeText(getReminderMessage(reminderTarget));
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2000);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    onAddCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim() || '+91 00000 00000',
      address: newCustAddress.trim() || 'Demo Market, Demo Nagar',
      balanceDue: 0,
      lastPaymentDate: 'Abhi joda gaya',
      creditLimit: parseInt(newCustLimit, 10) || 3000,
      status: 'settled',
    });

    setIsAddCustOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !txAmount) return;

    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) return;

    onAddTransaction(
      activeCustomer.id,
      txType,
      amt,
      txDescription.trim() || (txType === 'jama' ? 'Cash payment received' : 'Grocery purchase')
    );

    setIsTxModalOpen(false);
    setTxAmount('');
    setTxDescription('');
  };

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-3">
        <div>
          <h1 className="text-[26px] sm:text-[30px] font-bold text-[#003B1B] tracking-tight">
            Customers (Udhaar Bahi-Khata)
          </h1>
          <p className="text-[14px] text-[#404941] mt-0.5">
            Grahakon ka udhaar, wasooli aur hisaab-kitaab ka pakka bahi-khata.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddCustOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg text-[14px] font-semibold hover:bg-[#003B1B] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[19px]">person_add</span>
          <span>Naya Grahak Jodein</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
        <div className="bg-white p-4 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <span className="text-[12px] text-[#404941] font-medium">Kul Udhaar Baaki (Due)</span>
          <div className="text-[26px] font-extrabold text-[#9B4500] mt-1 tabular-nums">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#404941] mt-0.5 block">
            {activeCount} grahakon ke paas baaki hai
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <span className="text-[12px] text-[#404941] font-medium">Aaj Ki Wasooli (Collections)</span>
          <div className="text-[26px] font-extrabold text-[#14532D] mt-1 tabular-nums">
            ₹1,340
          </div>
          <span className="text-[11px] text-[#717970] mt-0.5 block">Cash aur UPI dwara jama</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <span className="text-[12px] text-[#404941] font-medium">Surakshit Udhaar Seema (Limit)</span>
          <div className="text-[26px] font-extrabold text-[#181D1A] mt-1 tabular-nums">
            ₹3,500
          </div>
          <span className="text-[11px] text-[#717970] mt-0.5 block">Prati grahak aam niyam</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] mb-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-[#404941]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Grahak ka naam, phone number ya pata khojein..."
            className="w-full pl-10 pr-4 py-2 bg-[#F0F5F0] border border-[#DFE4DF] rounded-lg text-[14px] text-[#181D1A] placeholder-[#717970] focus:outline-none focus:border-[#14532D]"
          />
        </div>
      </div>

      {/* Customer Ledger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.map((cust) => {
          const isWarning = cust.balanceDue >= cust.creditLimit * 0.9;
          const isSettled = cust.balanceDue === 0;

          return (
            <div
              key={cust.id}
              className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#EBEFEA] text-[#14532D] flex items-center justify-center font-bold text-[16px]">
                      {cust.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[16px] font-bold text-[#181D1A]">{cust.name}</span>
                      <span className="text-[12px] text-[#404941]">{cust.phone}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      isSettled
                        ? 'bg-[#DCFCE7] text-[#14532D]'
                        : isWarning
                        ? 'bg-[#FFDAD6] text-[#93000A]'
                        : 'bg-[#FFDBCA] text-[#763300]'
                    }`}
                  >
                    {isSettled ? 'Hisaab Chukta' : isWarning ? 'Seema Paar (Warning)' : 'Udhaar Chalu'}
                  </span>
                </div>

                <div className="mt-3 text-[12px] text-[#717970]">{cust.address}</div>

                {/* Amount Due Strip */}
                <div className="mt-3 p-3 bg-[#F0F5F0] rounded-lg border border-[#DFE4DF] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#404941]">Baaki Udhaar</span>
                    <span
                      className={`text-[20px] font-extrabold tabular-nums ${
                        isSettled ? 'text-[#14532D]' : 'text-[#BA1A1A]'
                      }`}
                    >
                      ₹{cust.balanceDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] text-[#717970]">Udhaar Seema</span>
                    <span className="text-[13px] font-semibold text-[#181D1A]">
                      ₹{cust.creditLimit.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Recent entries preview */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold text-[#404941] uppercase tracking-wider block mb-1">
                    Taaza Hisaab ({cust.transactions.length})
                  </span>
                  <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                    {cust.transactions.slice(0, 2).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between text-[12px] py-1 border-b border-[#F0F5F0]"
                      >
                        <div className="flex flex-col">
                          <span className="text-[#181D1A] font-medium">{tx.description}</span>
                          <span className="text-[10px] text-[#717970]">{tx.date}</span>
                        </div>
                        <span
                          className={`font-bold tabular-nums ${
                            tx.type === 'jama' ? 'text-[#14532D]' : 'text-[#BA1A1A]'
                          }`}
                        >
                          {tx.type === 'jama' ? `+₹${tx.amount} (Jama)` : `-₹${tx.amount} (Udhaar)`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 mt-3 border-t border-[#EBEFEA] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCustomer(cust);
                    setIsTxModalOpen(true);
                  }}
                  className="flex-1 py-2 px-3 border border-[#14532D] text-[#14532D] hover:bg-[#F0F5F0] rounded-lg text-[13px] font-bold transition-colors cursor-pointer"
                >
                  Hisaab Likhein
                </button>
                {cust.balanceDue > 0 && (
                  <button
                    type="button"
                    onClick={() => handleOpenReminder(cust)}
                    className="flex-1 py-2 px-3 bg-[#14532D] text-white hover:bg-[#003B1B] rounded-lg text-[13px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>WhatsApp Yaad</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* WhatsApp Reminder Modal */}
      {isReminderOpen && reminderTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EAE6DF] max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEFEA] mb-3">
              <h2 className="text-[17px] font-bold text-[#181D1A]">WhatsApp Hisaab Sandesh</h2>
              <button
                type="button"
                onClick={() => setIsReminderOpen(false)}
                className="text-[#404941] hover:text-[#181D1A] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-[13px] text-[#404941] mb-3">
              Yeh aadarpoorvak sandesh aap {reminderTarget.name} ji ke WhatsApp par bhej sakte hain.
            </p>

            <div className="bg-[#F0F5F0] border border-[#DFE4DF] p-3.5 rounded-lg text-[13px] text-[#181D1A] font-mono whitespace-pre-wrap leading-relaxed mb-4">
              {getReminderMessage(reminderTarget)}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCopyReminder}
                className="px-4 py-2 border border-[#DFE4DF] rounded-lg text-[13px] font-semibold text-[#181D1A] hover:bg-[#F0F5F0] cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedReminder ? 'check' : 'content_copy'}
                </span>
                <span>{copiedReminder ? 'Copy Ho Gaya' : 'Copy Sandesh'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(getReminderMessage(reminderTarget))}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#14532D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003B1B] cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                <span>WhatsApp Kholein</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Record Transaction Modal */}
      {isTxModalOpen && activeCustomer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EAE6DF] max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEFEA] mb-3">
              <div>
                <h2 className="text-[17px] font-bold text-[#181D1A]">
                  Hisaab Darj Karein ({activeCustomer.name})
                </h2>
                <span className="text-[12px] text-[#404941]">
                  Maujuda Baaki: ₹{activeCustomer.balanceDue}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="text-[#404941] hover:text-[#181D1A] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('jama')}
                  className={`py-2 rounded-lg font-bold text-[13px] border cursor-pointer ${
                    txType === 'jama'
                      ? 'bg-[#14532D] text-white border-[#14532D]'
                      : 'bg-white border-[#DFE4DF] text-[#404941]'
                  }`}
                >
                  + Rakam Jama Mili
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('udhaar')}
                  className={`py-2 rounded-lg font-bold text-[13px] border cursor-pointer ${
                    txType === 'udhaar'
                      ? 'bg-[#BA1A1A] text-white border-[#BA1A1A]'
                      : 'bg-white border-[#DFE4DF] text-[#404941]'
                  }`}
                >
                  - Naya Samaan Udhaar Diya
                </button>
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#404941] block mb-1">
                  Rakam (₹ Amount)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[15px] font-bold focus:outline-none focus:border-[#14532D]"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#404941] block mb-1">
                  Vivaran (Note / Items)
                </label>
                <input
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder={txType === 'jama' ? 'e.g. UPI dwara prapt' : 'e.g. Atta 5kg, Tel 1L'}
                  className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBEFEA]">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 border border-[#DFE4DF] rounded-lg text-[13px] font-semibold text-[#404941] hover:bg-[#F0F5F0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#14532D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003B1B] transition-colors cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EAE6DF] max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEFEA] mb-3">
              <h2 className="text-[17px] font-bold text-[#181D1A]">Naya Khata Grahak Jodein</h2>
              <button
                type="button"
                onClick={() => setIsAddCustOpen(false)}
                className="text-[#404941] hover:text-[#181D1A] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[12px] font-bold text-[#404941] block mb-1">
                  Grahak Ka Naam
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Suresh Ji Tailor"
                  className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#404941] block mb-1">
                  Mobile Number (WhatsApp)
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+91 98..."
                  className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#404941] block mb-1">
                  Ghar / Pata
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Area, City"
                  className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#404941] block mb-1">
                  Udhaar Seema (Credit Limit ₹)
                </label>
                <input
                  type="number"
                  value={newCustLimit}
                  onChange={(e) => setNewCustLimit(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBEFEA]">
                <button
                  type="button"
                  onClick={() => setIsAddCustOpen(false)}
                  className="px-4 py-2 border border-[#DFE4DF] rounded-lg text-[13px] font-semibold text-[#404941] hover:bg-[#F0F5F0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#14532D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003B1B] transition-colors cursor-pointer"
                >
                  Khata Kholein
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
