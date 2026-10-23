import React, { useState } from 'react';
import { RestockRecommendation, InventoryItem } from '../types';

interface OrderNoteModalProps {
  recommendation: RestockRecommendation;
  lowStockItems: InventoryItem[];
  onClose: () => void;
}

export const OrderNoteModal: React.FC<OrderNoteModalProps> = ({
  recommendation,
  lowStockItems,
  onClose,
}) => {
  const [milkQuantity, setMilkQuantity] = useState(recommendation.recommendedOrder);
  const [selectedExtraItems, setSelectedExtraItems] = useState<{ [id: string]: number }>({
    'inv-2': 5, // Aashirvaad Atta
    'inv-3': 6, // Fortune Oil
    'inv-4': 20, // Tata Salt
  });
  const [distributorContact, setDistributorContact] = useState('Amul Supply / Shri Balaji Traders');
  const [copied, setCopied] = useState(false);

  const toggleItem = (id: string, defaultQty: number) => {
    setSelectedExtraItems((prev) => {
      const copy = { ...prev };
      if (copy[id] !== undefined) {
        delete copy[id];
      } else {
        copy[id] = defaultQty;
      }
      return copy;
    });
  };

  const updateExtraQty = (id: string, delta: number) => {
    setSelectedExtraItems((prev) => {
      const curr = prev[id] || 1;
      const next = Math.max(1, curr + delta);
      return { ...prev, [id]: next };
    });
  };

  const generateNoteText = () => {
    let text = `*ORDER NOTE - RAMESH GENERAL STORE*\nDemo Market, Demo Nagar (Phone: +91 00000 00000)\nDate: 23 October 2026\n\nPranam Bhaiji, kripya kal subah tak yeh maal dukaan par deliver karwa dein:\n\n`;
    text += `1. *${recommendation.itemName}* : ${milkQuantity} packets\n`;

    let counter = 2;
    lowStockItems.forEach((item) => {
      if (selectedExtraItems[item.id] !== undefined) {
        text += `${counter}. *${item.name}* : ${selectedExtraItems[item.id]} ${item.unit}\n`;
        counter++;
      }
    });

    text += `\nDelivery subah 7:30 se 8:30 ke beech bhejein.\nPayment bill aate hi UPI/Cash se kar di jayegi.\n- Ramesh Joshi`;
    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateNoteText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#EAE6DF] max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBEFEA] mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#14532D] text-[22px]">edit_note</span>
            <h2 className="text-[18px] font-bold text-[#181D1A]">Distributor Order Note Banayein</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#404941] hover:text-[#181D1A] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-[13px] text-[#404941] mb-3">
          Yeh note banakar aap WhatsApp par distributor ko bhej sakte hain. <strong>Seedha order place nahi hoga.</strong>
        </p>

        {/* Primary Recommended Item */}
        <div className="p-3 bg-[#F0F5F0] rounded-lg border border-[#DFE4DF] mb-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#14532D] uppercase tracking-wider block">
                AI Recommendation (Primary)
              </span>
              <span className="font-bold text-[#181D1A] text-[15px]">{recommendation.itemName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMilkQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded border border-[#DFE4DF] bg-white font-bold flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="w-12 text-center font-bold text-[15px] tabular-nums">
                {milkQuantity} pkt
              </span>
              <button
                type="button"
                onClick={() => setMilkQuantity((q) => q + 1)}
                className="w-8 h-8 rounded border border-[#DFE4DF] bg-white font-bold text-[#14532D] flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Other Low Stock Items to Add */}
        <div className="mb-4">
          <span className="text-[12px] font-bold text-[#404941] uppercase tracking-wider block mb-2">
            Dusre Kam Stock Wale Items Shamil Karein:
          </span>
          <div className="flex flex-col gap-2">
            {lowStockItems.map((item) => {
              const isSelected = selectedExtraItems[item.id] !== undefined;
              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-white border-[#14532D]' : 'bg-[#F0F5F0] border-[#DFE4DF] opacity-75'
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(item.id, item.stock === 0 ? 20 : 5)}
                      className="w-4 h-4 text-[#14532D] rounded accent-[#14532D]"
                    />
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-[#181D1A]">{item.name}</span>
                      <span className="text-[11px] text-[#717970]">
                        Bacha stock: {item.stock} {item.unit} ({item.distributor})
                      </span>
                    </div>
                  </label>

                  {isSelected && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        type="button"
                        onClick={() => updateExtraQty(item.id, -1)}
                        className="w-7 h-7 rounded border border-[#DFE4DF] bg-[#F0F5F0] text-[12px] font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-[13px] tabular-nums">
                        {selectedExtraItems[item.id]} {item.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateExtraQty(item.id, 1)}
                        className="w-7 h-7 rounded border border-[#DFE4DF] bg-[#F0F5F0] text-[12px] font-bold text-[#14532D] flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* WhatsApp Preview Text */}
        <div className="mb-4">
          <span className="text-[12px] font-bold text-[#404941] block mb-1">
            Note Preview (WhatsApp Text Format):
          </span>
          <pre className="p-3 bg-[#F0F5F0] border border-[#DFE4DF] rounded-lg text-[12px] text-[#181D1A] font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {generateNoteText()}
          </pre>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EBEFEA]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#DFE4DF] rounded-lg text-[13px] font-semibold text-[#404941] hover:bg-[#F0F5F0] cursor-pointer"
          >
            Band Karein
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 border border-[#14532D] text-[#14532D] rounded-lg text-[13px] font-bold hover:bg-[#F0F5F0] cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copy Ho Gaya' : 'Copy Text'}</span>
          </button>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(generateNoteText())}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-[#14532D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003B1B] cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            <span>WhatsApp Par Bhejein</span>
          </a>
        </div>
      </div>
    </div>
  );
};
