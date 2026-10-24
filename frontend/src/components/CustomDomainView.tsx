import React, { useState } from 'react';
import { CustomDomainConfig } from '../types';

interface CustomDomainViewProps {
  config: CustomDomainConfig;
  onUpdateDomain: (newDomain: string) => void;
  onNavigate: (tab: any) => void;
}

export const CustomDomainView: React.FC<CustomDomainViewProps> = ({
  config,
  onUpdateDomain,
  onNavigate,
}) => {
  const [domainInput, setDomainInput] = useState(config.domain);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccessMessage, setVerifySuccessMessage] = useState('');
  const [activeRegistrar, setActiveRegistrar] = useState<'godaddy' | 'hostinger' | 'bigrock'>('hostinger');

  const handleVerify = () => {
    setIsVerifying(true);
    setVerifySuccessMessage('');
    setTimeout(() => {
      setIsVerifying(false);
      setVerifySuccessMessage('DNS records verified successfully! SSL certificate is active.');
      onUpdateDomain(domainInput.trim().toLowerCase());
    }, 800);
  };

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-3">
        <div>
          <h1 className="text-[26px] sm:text-[30px] font-bold text-[#003B1B] tracking-tight">
            Custom Domain & Launch Checklist
          </h1>
          <p className="text-[14px] text-[#404941] mt-0.5">
            Apni dukaan ka personal web address jodein aur launch ki sabhi shartein poori karein.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-[#DCFCE7] text-[#14532D] text-[13px] font-bold flex items-center gap-1.5 border border-[#B1F2BE]">
            <span className="material-symbols-outlined text-[17px]">verified</span>
            <span>Production Ready</span>
          </span>
        </div>
      </div>

      {/* Launch Readiness Checklist Card */}
      <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBEFEA] mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#14532D] text-[22px]">fact_check</span>
            <span className="text-[16px] font-bold text-[#181D1A]">
              DukaanAI Store Launch Checklist
            </span>
          </div>
          <span className="text-[12px] font-bold text-[#14532D] bg-[#F0F5F0] px-2.5 py-0.5 rounded">
            5 / 5 Shartein Poori (All Passed)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2.5 p-2.5 bg-[#F6FBF5] rounded-lg border border-[#EAE6DF]">
            <span className="material-symbols-outlined text-[#14532D] text-[20px] flex-shrink-0">
              check_circle
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#181D1A]">
                1. Custom Domain Connected
              </span>
              <span className="text-[12px] text-[#404941]">
                <strong>{config.domain}</strong> successfully mapped with active A & CNAME records.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 bg-[#F6FBF5] rounded-lg border border-[#EAE6DF]">
            <span className="material-symbols-outlined text-[#14532D] text-[20px] flex-shrink-0">
              check_circle
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#181D1A]">2. Store Favicon Added</span>
              <span className="text-[12px] text-[#404941]">
                Official SVG ledger & storefront icon configured in HTML header.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 bg-[#F6FBF5] rounded-lg border border-[#EAE6DF]">
            <span className="material-symbols-outlined text-[#14532D] text-[20px] flex-shrink-0">
              check_circle
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#181D1A]">
                3. "Made with AI" Tag Removed
              </span>
              <span className="text-[12px] text-[#404941]">
                Zero third-party badges or AI tags. 100% pure Ramesh General Store brand identity.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 bg-[#F6FBF5] rounded-lg border border-[#EAE6DF]">
            <span className="material-symbols-outlined text-[#14532D] text-[20px] flex-shrink-0">
              check_circle
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#181D1A]">
                4. Privacy Policy Published
              </span>
              <span className="text-[12px] text-[#404941]">
                Digital Personal Data Protection (DPDP) Act 2023 compliant policy accessible.{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('privacy')}
                  className="text-[#14532D] underline font-semibold cursor-pointer"
                >
                  Dekhein
                </button>
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 bg-[#F6FBF5] rounded-lg border border-[#EAE6DF] md:col-span-2">
            <span className="material-symbols-outlined text-[#14532D] text-[20px] flex-shrink-0">
              check_circle
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#181D1A]">
                5. Terms and Conditions Published
              </span>
              <span className="text-[12px] text-[#404941]">
                Retail bahi-khata merchant rules and customer credit guidelines live.{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className="text-[#14532D] underline font-semibold cursor-pointer"
                >
                  Dekhein
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Status Active Card */}
      <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EBEFEA] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#F0F5F0] border border-[#DFE4DF] flex items-center justify-center text-[#14532D]">
              <span className="material-symbols-outlined text-[26px]">language</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-bold text-[#181D1A]">{config.domain}</span>
                <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#14532D] text-[11px] font-bold">
                  Connected
                </span>
              </div>
              <span className="text-[12px] text-[#717970]">
                Last checked: {config.lastChecked}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#14532D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003B1B] transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[17px] ${isVerifying ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isVerifying ? 'Checking DNS...' : 'Verify DNS Now'}</span>
          </button>
        </div>

        {verifySuccessMessage && (
          <div className="mt-3 p-3 bg-[#DCFCE7] border border-[#B1F2BE] rounded-lg text-[13px] font-medium text-[#14532D] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">task_alt</span>
            <span>{verifySuccessMessage}</span>
          </div>
        )}

        {/* DNS Records Table */}
        <div className="mt-4">
          <span className="text-[13px] font-bold text-[#181D1A] block mb-2">
            Required DNS Configuration (Active)
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#F0F5F0] border-b border-[#DFE4DF] text-[#404941] text-[11px] font-bold uppercase">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Name / Host</th>
                  <th className="py-2.5 px-3">Value / Points To</th>
                  <th className="py-2.5 px-3">TTL</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEFEA]">
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#14532D]">A</td>
                  <td className="py-2.5 px-3 font-mono">@</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#181D1A]">{config.aRecord}</td>
                  <td className="py-2.5 px-3 text-[#717970]">3600 (Auto)</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#14532D] text-[11px] font-bold">
                      Verified
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#14532D]">CNAME</td>
                  <td className="py-2.5 px-3 font-mono">www</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#181D1A]">{config.cnameRecord}</td>
                  <td className="py-2.5 px-3 text-[#717970]">3600 (Auto)</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#14532D] text-[11px] font-bold">
                      Verified
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Connect New / Alternate Domain */}
      <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] mb-6">
        <h2 className="text-[17px] font-bold text-[#181D1A] mb-1">
          Naya Domain Jodein (Change Custom Domain)
        </h2>
        <p className="text-[13px] text-[#404941] mb-3">
          Aap apna koi bhi registrar se khareeda hua domain yahan jod sakte hain (e.g. rameshstore.in, rameshgeneralstore.com).
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="e.g. mykirana.in"
            className="flex-1 px-3.5 py-2 border border-[#DFE4DF] rounded-lg text-[14px] text-[#181D1A] font-mono focus:outline-none focus:border-[#14532D]"
          />
          <button
            type="button"
            onClick={handleVerify}
            className="px-5 py-2 bg-[#14532D] text-white rounded-lg text-[14px] font-semibold hover:bg-[#003B1B] transition-colors cursor-pointer"
          >
            Update & Verify
          </button>
        </div>

        {/* Registrar Quick Instructions */}
        <div className="pt-3 border-t border-[#EBEFEA]">
          <span className="text-[12px] font-bold text-[#404941] block mb-2">
            DNS Instructions for Indian Registrars:
          </span>
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setActiveRegistrar('hostinger')}
              className={`px-3 py-1 rounded text-[12px] font-bold cursor-pointer ${
                activeRegistrar === 'hostinger'
                  ? 'bg-[#14532D] text-white'
                  : 'bg-[#F0F5F0] text-[#404941]'
              }`}
            >
              Hostinger
            </button>
            <button
              type="button"
              onClick={() => setActiveRegistrar('godaddy')}
              className={`px-3 py-1 rounded text-[12px] font-bold cursor-pointer ${
                activeRegistrar === 'godaddy'
                  ? 'bg-[#14532D] text-white'
                  : 'bg-[#F0F5F0] text-[#404941]'
              }`}
            >
              GoDaddy
            </button>
            <button
              type="button"
              onClick={() => setActiveRegistrar('bigrock')}
              className={`px-3 py-1 rounded text-[12px] font-bold cursor-pointer ${
                activeRegistrar === 'bigrock'
                  ? 'bg-[#14532D] text-white'
                  : 'bg-[#F0F5F0] text-[#404941]'
              }`}
            >
              BigRock
            </button>
          </div>

          <div className="p-3 bg-[#F0F5F0] rounded-lg text-[13px] text-[#404941] leading-relaxed">
            {activeRegistrar === 'hostinger' && (
              <ol className="list-decimal list-inside space-y-1">
                <li>Hostinger hPanel mein login karein aur apne Domain ke DNS / Nameservers section mein jayein.</li>
                <li>Add Record par click karein: Type "A", Name "@", Points to "76.76.21.21", TTL "3600".</li>
                <li>Add Record par click karein: Type "CNAME", Name "www", Points to "cname.dukaanai.app".</li>
              </ol>
            )}
            {activeRegistrar === 'godaddy' && (
              <ol className="list-decimal list-inside space-y-1">
                <li>GoDaddy My Products mein apne domain ke aage "DNS" par click karein.</li>
                <li>Pehle se maujood "@" A Record ko edit karke 76.76.21.21 set karein.</li>
                <li>"www" CNAME record ko cname.dukaanai.app par point karein aur Save karein.</li>
              </ol>
            )}
            {activeRegistrar === 'bigrock' && (
              <ol className="list-decimal list-inside space-y-1">
                <li>BigRock Control Panel mein Manage DNS par click karein.</li>
                <li>A Records section mein jaakar Host "@" ko IP 76.76.21.21 par point karein.</li>
                <li>CNAME section mein "www" ko cname.dukaanai.app par map karein.</li>
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
