import React from 'react';

interface DistributorModalProps {
  distributorName: string;
  distributorPhone: string;
  onClose: () => void;
  onOpenOrderNote: () => void;
}

export const DistributorModal: React.FC<DistributorModalProps> = ({
  distributorName,
  distributorPhone,
  onClose,
  onOpenOrderNote,
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#EAE6DF] max-w-sm w-full p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBEFEA] mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#14532D] text-[22px]">contact_phone</span>
            <h2 className="text-[17px] font-bold text-[#181D1A]">Distributor Sampark</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#404941] hover:text-[#181D1A] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 py-2">
          <div className="bg-[#F0F5F0] p-3.5 rounded-lg border border-[#DFE4DF]">
            <span className="text-[11px] text-[#404941] uppercase tracking-wider font-bold block">
              Agency Name
            </span>
            <span className="text-[16px] font-bold text-[#181D1A]">{distributorName}</span>
            <span className="text-[14px] text-[#14532D] font-bold block mt-1">
              {distributorPhone}
            </span>
            <span className="text-[12px] text-[#717970] mt-1 block">
              Delivery Time: Subah 7:30 AM tak
            </span>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <a
              href={`tel:${distributorPhone.replace(/\s+/g, '')}`}
              className="w-full py-2.5 px-4 bg-[#14532D] text-white rounded-lg font-bold text-[14px] hover:bg-[#003B1B] text-center flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>Direct Call Lagayein</span>
            </a>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOrderNote();
              }}
              className="w-full py-2.5 px-4 border border-[#14532D] text-[#14532D] rounded-lg font-bold text-[14px] hover:bg-[#F0F5F0] text-center flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              <span>Order Note Banakar Bhejein</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
