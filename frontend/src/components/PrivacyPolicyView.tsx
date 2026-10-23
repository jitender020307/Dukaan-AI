import React from 'react';

export const PrivacyPolicyView: React.FC = () => {
  return (
    <div className="flex flex-col w-full pb-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="pb-6 border-b border-[#EAE6DF] mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded bg-[#DCFCE7] text-[#14532D] text-[11px] font-bold uppercase tracking-wider">
            Sample Policy — Review Before Use
          </span>
          <span className="text-[12px] text-[#717970]">Prototype sample · Replace with verified business details</span>
        </div>
        <h1 className="text-[28px] sm:text-[32px] font-bold text-[#003B1B] tracking-tight">
          Privacy Policy (Nijata Niti)
        </h1>
        <p className="text-[14px] text-[#404941] mt-1">
          Ramesh General Store (Demo Market, Demo Nagar) and DukaanAI Kirana Sahayak Data Protection Policy.
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col gap-6 text-[14px] text-[#181D1A] leading-relaxed">
        <section>
          <h2 className="text-[17px] font-bold text-[#003B1B] mb-2">
            1. Preamble & Applicability
          </h2>
          <p className="text-[#404941]">
            This Privacy Policy governs the collection, recording, storage, and processing of retail sales records, customer credit accounts (Bahi-Khata), and inventory logistics data operated by Ramesh General Store, situated at Demo Market, Demo Nagar, Haryana, via the DukaanAI retail management platform. We adhere strictly to the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000 of India.
          </p>
        </section>

        <section className="pt-4 border-t border-[#EBEFEA]">
          <h2 className="text-[17px] font-bold text-[#003B1B] mb-2">
            2. Nature of Data Collected
          </h2>
          <p className="text-[#404941] mb-2">
            In operating our kirana counter and bahi-khata ledger, we collect only the minimum necessary operational data required to conduct neighborhood commerce:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#404941] pl-2">
            <li>
              <strong>Customer Identification:</strong> Customer names, residential alley/house references, and mobile numbers for the express purpose of credit tracking (Udhaar Khata) and optional WhatsApp payment reminders.
            </li>
            <li>
              <strong>Transaction Logs:</strong> Line items purchased, units, pricing, payment method (Cash, UPI QR, or Khata credit), and transaction timestamps.
            </li>
            <li>
              <strong>Distributor & Inventory Data:</strong> Wholesale supplier names, wholesale contact telephone numbers, batch stock volumes, cost prices, and estimated lead times.
            </li>
          </ul>
        </section>

        <section className="pt-4 border-t border-[#EBEFEA]">
          <h2 className="text-[17px] font-bold text-[#003B1B] mb-2">
            3. Strict Non-Monetization & Anti-Brokerage Guarantee
          </h2>
          <p className="text-[#404941]">
            We unequivocally state that customer telephone numbers, ledger balances, and individual grocery purchase histories are <strong>never sold, leased, rented, or brokered</strong> to third-party advertising networks, consumer data aggregates, FMCG marketing agencies, or financial profiling firms. All records remain the confidential business record of Ramesh General Store.
          </p>
        </section>

        <section className="pt-4 border-t border-[#EBEFEA]">
          <h2 className="text-[17px] font-bold text-[#003B1B] mb-2">
            4. Customer Khata & WhatsApp Notifications
          </h2>
          <p className="text-[#404941]">
            WhatsApp payment reminders are sent solely upon manual verification and trigger by the shopkeeper. No automated spam blasts or unsolicited third-party promotions are dispatched. Customers maintain the right to inspect their itemized bahi-khata balance in person at the shop counter or request a printable settlement slip at any time.
          </p>
        </section>

        <section className="pt-4 border-t border-[#EBEFEA]">
          <h2 className="text-[17px] font-bold text-[#003B1B] mb-2">
            5. Data Security & Storage Standards
          </h2>
          <p className="text-[#404941]">
            All digital records are protected in transit utilizing Transport Layer Security (TLS 1.3) cryptographic protocols under our custom domain SSL infrastructure. Database access is restricted strictly to authorized store management personnel.
          </p>
        </section>

        <section className="pt-4 border-t border-[#EBEFEA]">
          <h2 className="text-[17px] font-bold text-[#003B1B] mb-2">
            6. Right of Correction & Erasure
          </h2>
          <p className="text-[#404941]">
            Any registered khata patron may visit the shop counter to review, amend, or demand the full erasure of settled historical ledger entries upon complete reconciliation of outstanding balances.
          </p>
        </section>

        <section className="pt-4 border-t border-[#EBEFEA] bg-[#F0F5F0] p-4 rounded-lg border border-[#DFE4DF]">
          <h2 className="text-[15px] font-bold text-[#181D1A] mb-1">
            7. Grievance Redressal & Store Contact
          </h2>
          <p className="text-[13px] text-[#404941] mb-2">
            For questions, balance audits, or data rights inquiries, please reach out to the designated grievance officer:
          </p>
          <div className="text-[13px] text-[#181D1A] space-y-0.5">
            <div><strong>Grievance Officer:</strong> Ramesh Joshi (Proprietor)</div>
            <div><strong>Store:</strong> Ramesh General Store</div>
            <div><strong>Address:</strong> Shop No. 12, Main Market, Demo Market, Demo Nagar, India</div>
            <div><strong>Telephone:</strong> +91 00000 00000</div>
            <div><strong>Email:</strong> compliance@example.invalid</div>
          </div>
        </section>
      </div>
    </div>
  );
};
