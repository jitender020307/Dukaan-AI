import React from 'react';

export const TermsView: React.FC = () => {
  return (
    <div className="flex flex-col w-full pb-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="pb-6 border-b border-[#EAE6DF] mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded bg-[#DCFCE7] text-[#14532D] text-[11px] font-bold uppercase tracking-wider">
            Terms of Operation
          </span>
          <span className="text-[12px] text-[#717970]">Effective date: 23 October 2026</span>
        </div>
        <h1 className="text-[28px] sm:text-[32px] font-bold text-[#003B1B] tracking-tight">
          Terms & Conditions (Niyam aur Shartein)
        </h1>
        <p className="text-[14px] text-[#404941] mt-1">
          Store terms of service and trade guidelines for Ramesh General Store & DukaanAI Kirana Sahayak.
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col gap-6 text-[14px] text-[#181D1A] leading-relaxed">
        <section>
          <h2 className="text-[17px] font-bold text-[#003B1B] mb-2">
            1. Commercial Scope & Merchant Relationship
          </h2>
          <p className="text-[#404941]">
            These Terms and Conditions govern the retail sale of groceries, daily essentials, packaged foodstuffs, and dairy products at Ramesh General Store, Demo Market, Demo Nagar, as well as the digital record-keeping features provided by the DukaanAI Kirana Sahayak software.
          </p>
        </section>

        <section className="pt-4 border-t border-[#EBEFEA]">
          <h2 className="text-[17px] font-bold text-[#003B1B] mb-2">
            2. Retail Pricing & Maximum Retail Price (MRP) Compliance
          </h2>
          <p className="text-[#404941]">
            In strict compliance with the Legal Metrology Act, 2009 and the Packaged Commodities Rules, all packaged goods (such as Amul Milk, Aashirvaad Atta, Fortune Oil, Tata Salt, Parle-G, and Maggi) are sold at or below the Maximum Retail Price (MRP) printed by the manufacturer. Discounts and promotional offers are applied transparently at the counter.
          </p>
        </section>

        <section className="pt-4 border-t border-[#EBEFEA]">
          <h2 className="text-[17px] font-bold text-[#003B1B] mb-2">
            3. Customer Khata (Credit Facility) Guidelines
          </h2>
          <p className="text-[#404941] mb-2">
            The provision of store credit (Udhaar) is an informal courtesy extended solely at the discretion of the store proprietor based on mutual trust and local standing:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#404941] pl-2">
            <li>Each customer account is assigned a credit threshold (standard ₹3,000 unless modified).</li>
            <li>Balances are expected to be settled within 30 days or upon monthly payday reconciliation.</li>
            <li>All credit transactions are recorded in the digital ledger and can be verified by the customer upon request.</li>
          </ul>
        </section>

        <section className="pt-4 border-t border-[#EBEFEA]">
          <h2 className="text-[17px] font-bold text-[#003B1B] mb-2">
            4. Returns, Replacements & Perishables
          </h2>
          <p className="text-[#404941]">
            Packaged dry goods with manufacturer packaging defects or past-expiry stamps will be replaced immediately upon presentation of the physical packet within 48 hours. Perishable dairy items (such as milk pouches) must be reported on the same calendar date of purchase to ensure proper cold-chain investigation with the distributor.
          </p>
        </section>

        <section className="pt-4 border-t border-[#EBEFEA]">
          <h2 className="text-[17px] font-bold text-[#003B1B] mb-2">
            5. Inventory AI Recommendations Disclaimer
          </h2>
          <p className="text-[#404941]">
            Stock reorder recommendations (such as calculated distributor orders and buffer stock warnings) are generated as an advisory tool for the store manager. Final order quantities and purchase commitments to distributors remain entirely under the human discretion of the shop proprietor. No automated orders are placed without manual verification.
          </p>
        </section>

        <section className="pt-4 border-t border-[#EBEFEA]">
          <h2 className="text-[17px] font-bold text-[#003B1B] mb-2">
            6. Governing Law & Jurisdiction
          </h2>
          <p className="text-[#404941]">
            These Terms shall be construed and governed in accordance with the laws of the Republic of India. Any disputes arising out of retail operations or ledger accounts shall be subject to the exclusive jurisdiction of the competent courts in Gurugram, Haryana.
          </p>
        </section>
      </div>
    </div>
  );
};
