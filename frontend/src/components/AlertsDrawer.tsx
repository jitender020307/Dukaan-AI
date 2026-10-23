import React from 'react';
import { NavTab } from '../types';

interface AlertsDrawerProps {
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({ onClose, onNavigate }) => {
  const alerts = [
    {
      id: 'alt-1',
      title: 'Tata Salt (1kg) Khatam Ho Chuka Hai',
      desc: 'Aaj 2 grahak bina namak liye wapas gaye. Turant reorder ki zaroorat hai.',
      time: '15m pehle',
      type: 'urgent',
      tab: 'inventory' as NavTab,
    },
    {
      id: 'alt-2',
      title: 'Aashirvaad Chakki Atta (5kg) Low Stock',
      desc: 'Kewal 3 packets bache hain. Kal dopahar tak khatam ho sakta hai.',
      time: '45m pehle',
      type: 'warning',
      tab: 'inventory' as NavTab,
    },
    {
      id: 'alt-3',
      title: 'Santosh Masterji ka Udhaar Limit ke Paas',
      desc: 'Baaki rakam ₹3,450 ho chuki hai (Limit ₹3,500). Kripya reminder bhejein.',
      time: '2h pehle',
      type: 'warning',
      tab: 'customers' as NavTab,
    },
    {
      id: 'alt-4',
      title: 'Custom Domain SSL Verified & Active',
      desc: 'demo-store.example par SSL security sakriy ho chuki hai.',
      time: '3h pehle',
      type: 'info',
      tab: 'domain' as NavTab,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col justify-between border-l border-[#EAE6DF]">
        <div className="flex flex-col">
          <div className="p-4 border-b border-[#EBEFEA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#14532D] text-[20px]">notifications</span>
              <h2 className="text-[16px] font-bold text-[#181D1A]">Dukaan Alert & Soochana</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#404941] hover:text-[#181D1A] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="p-3 divide-y divide-[#EBEFEA] overflow-y-auto max-h-[85vh]">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                onClick={() => {
                  onNavigate(alt.tab);
                  onClose();
                }}
                className="py-3 px-2 hover:bg-[#F6FBF5] rounded-lg transition-colors cursor-pointer flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                      alt.type === 'urgent'
                        ? 'bg-[#FFDAD6] text-[#93000A]'
                        : alt.type === 'warning'
                        ? 'bg-[#FFDBCA] text-[#763300]'
                        : 'bg-[#DCFCE7] text-[#14532D]'
                    }`}
                  >
                    {alt.type}
                  </span>
                  <span className="text-[11px] text-[#717970]">{alt.time}</span>
                </div>
                <span className="text-[13px] font-bold text-[#181D1A] leading-snug">
                  {alt.title}
                </span>
                <p className="text-[12px] text-[#404941] leading-relaxed">{alt.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#EBEFEA]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-[#F0F5F0] hover:bg-[#EBEFEA] rounded-lg text-[13px] font-semibold text-[#181D1A] cursor-pointer"
          >
            Band Karein
          </button>
        </div>
      </div>
    </div>
  );
};
