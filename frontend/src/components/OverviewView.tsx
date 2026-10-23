import React, { useState } from 'react';
import { InventoryItem, RestockRecommendation, NavTab } from '../types';

interface OverviewViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenOrderNote: (item: RestockRecommendation) => void;
  onCallDistributor: (name: string, phone: string) => void;
  onAddToList: (itemName: string) => void;
  recommendation: RestockRecommendation;
  reorderListCount: number;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onOpenOrderNote,
  onCallDistributor,
  onAddToList,
  recommendation,
  reorderListCount,
}) => {
  const [activeChartPoint, setActiveChartPoint] = useState<number | null>(6);
  const [lastSyncTime, setLastSyncTime] = useState('15 minute pehle');
  const [isSyncing, setIsSyncing] = useState(false);
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setLastSyncTime('Abhi taaza');
      setIsSyncing(false);
    }, 600);
  };

  const handleItemAdd = (name: string) => {
    setAddedItems((prev) => ({ ...prev, [name]: true }));
    onAddToList(name);
  };

  // 7-day sales data points
  const salesHistory = [
    { date: '17 Oct', day: 'Shani', amount: 6800, label: '₹6.8k', x: 50, y: 140 },
    { date: '18 Oct', day: 'Ravi', amount: 9200, label: '₹9.2k', x: 160, y: 35 },
    { date: '19 Oct', day: 'Som', amount: 7100, label: '₹7.1k', x: 275, y: 125 },
    { date: '20 Oct', day: 'Mangal', amount: 7400, label: '₹7.4k', x: 390, y: 112 },
    { date: '21 Oct', day: 'Budh', amount: 8100, label: '₹8.1k', x: 505, y: 82 },
    { date: '22 Oct', day: 'Guru', amount: 7800, label: '₹7.8k', x: 620, y: 96 },
    { date: '23 Oct', day: 'Aaj', amount: 8450, label: '₹8.45k', x: 715, y: 68 },
  ];

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Top Greeting & Sync Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-[#9B4500] uppercase tracking-wider font-bold">
              Ramesh General Store
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C0C9BE]"></span>
            <span className="text-[11px] text-[#404941] font-medium">Bahi-Khata Online</span>
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-bold text-[#003B1B] tracking-tight leading-tight">
            Namaste, Ramesh ji
          </h1>
          <p className="text-[15px] text-[#404941] mt-0.5">
            Yeh raha aaj aapki dukaan ka taaza hisaab-kitaab aur zaroori jaankari.
          </p>
        </div>

        {/* Sync indicator badge with interactive refresh */}
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 self-start md:self-auto px-3.5 py-1.5 bg-[#F0F5F0] hover:bg-[#EBEFEA] rounded-lg border border-[#DFE4DF] text-left transition-colors cursor-pointer"
          title="Click to refresh data"
        >
          <span className={`material-symbols-outlined text-[18px] text-[#14532D] ${isSyncing ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span className="text-[12px] text-[#404941] font-medium">
            Sabhi hisaab <strong className="text-[#181D1A] font-semibold">{lastSyncTime}</strong> update hue
          </span>
        </button>
      </div>

      {/* Primary 3-Metric Summary Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Aaj ki Bikri */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:border-[#14532D]/40">
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-[#404941] font-medium">Aaj ki bikri</span>
            <div className="w-9 h-9 rounded-lg bg-[#EBEFEA] flex items-center justify-center text-[#14532D]">
              <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
            </div>
          </div>
          <div className="mt-4 mb-2">
            <div className="text-[32px] sm:text-[36px] text-[#181D1A] font-extrabold tracking-tight tabular-nums">
              ₹8,450
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-[#F0F5F0]">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-[#E5E9E4] text-[#14532D] text-[11px] font-bold">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              +₹620
            </span>
            <span className="text-[13px] text-[#404941]">kal ke mukable (Kal: ₹7,830)</span>
          </div>
        </div>

        {/* Card 2: Andazee Munafa */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:border-[#14532D]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[15px] text-[#404941] font-medium">Andazee munafa</span>
              <span className="px-2 py-0.5 rounded bg-[#FFDBCA] text-[#763300] text-[11px] font-bold">
                Andaza
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#EBEFEA] flex items-center justify-center text-[#9B4500]">
              <span className="material-symbols-outlined text-[20px]">query_stats</span>
            </div>
          </div>
          <div className="mt-4 mb-2">
            <div className="text-[32px] sm:text-[36px] text-[#14532D] font-extrabold tracking-tight tabular-nums">
              ₹1,920
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-[#F0F5F0]">
            <span className="material-symbols-outlined text-[#003B1B] text-[18px]">verified</span>
            <span className="text-[13px] text-[#404941]">
              Lagbhag <strong className="text-[#181D1A] font-semibold">22.7% margin</strong> sabhi items par
            </span>
          </div>
        </div>

        {/* Card 3: Bik Chuke Items */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:border-[#14532D]/40">
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-[#404941] font-medium">Bik chuke items</span>
            <div className="w-9 h-9 rounded-lg bg-[#EBEFEA] flex items-center justify-center text-[#404941]">
              <span className="material-symbols-outlined text-[20px]">shopping_basket</span>
            </div>
          </div>
          <div className="mt-4 mb-2">
            <div className="text-[32px] sm:text-[36px] text-[#181D1A] font-extrabold tracking-tight tabular-nums">
              67 <span className="text-[18px] font-medium text-[#404941]">packets</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-[#F0F5F0]">
            <span className="material-symbols-outlined text-[#9B4500] text-[18px]">groups</span>
            <span className="text-[13px] text-[#404941]">
              <strong className="text-[#181D1A] font-semibold">28 alag-alag grahakon</strong> dwara khareed
            </span>
          </div>
        </div>
      </div>

      {/* Main Asymmetric 2-Column Split: 8-Col Left, 4-Col Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT MAIN COLUMN (8 cols): Analytics & Core AI Restock Card */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Section A: Sales Trend (7-Day Line Chart) */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-[#EBEFEA] gap-2">
              <div className="flex flex-col">
                <span className="text-[18px] text-[#181D1A] font-bold tracking-tight">
                  Pichhle 7 dinon ki bikri
                </span>
                <span className="text-[13px] text-[#404941]">
                  Dukaan ki dainik maang ka aaklan (Daily sales trend)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#14532D]"></span>
                <span className="text-[12px] text-[#404941]">
                  Kul bikri: <strong className="text-[#181D1A] font-semibold">₹54,650</strong>
                </span>
              </div>
            </div>

            {/* 7-Day Line Chart Graphic (SVG with clean markers & today's badge) */}
            <div className="w-full relative pt-5 pb-2">
              {/* Active / Today Value Tag */}
              {activeChartPoint !== null && (
                <div
                  className="absolute bg-[#14532D] text-white px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5 text-[12px] font-bold z-10 transition-all pointer-events-none"
                  style={{
                    left: `${(salesHistory[activeChartPoint].x / 760) * 100}%`,
                    top: `${salesHistory[activeChartPoint].y - 35}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <span className="material-symbols-outlined text-[13px] text-[#B1F2BE]">trending_up</span>
                  <span>
                    {salesHistory[activeChartPoint].day === 'Aaj'
                      ? `Aaj: ₹${salesHistory[activeChartPoint].amount.toLocaleString('en-IN')}`
                      : `${salesHistory[activeChartPoint].date}: ₹${salesHistory[activeChartPoint].amount.toLocaleString('en-IN')}`}
                  </span>
                </div>
              )}

              <svg
                className="w-full h-48 overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 760 210"
              >
                <defs>
                  <linearGradient id="salesGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#14532d" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#14532d" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid guides */}
                <line stroke="#DFE4DF" strokeDasharray="4 4" strokeWidth="1" x1="20" x2="740" y1="30" y2="30" />
                <line stroke="#DFE4DF" strokeDasharray="4 4" strokeWidth="1" x1="20" x2="740" y1="85" y2="85" />
                <line stroke="#DFE4DF" strokeDasharray="4 4" strokeWidth="1" x1="20" x2="740" y1="140" y2="140" />
                <line stroke="#DFE4DF" strokeWidth="1" x1="20" x2="740" y1="195" y2="195" />

                {/* Area Fill */}
                <path
                  d="M 50 140 
                     C 100 135, 120 40, 160 35 
                     C 200 30, 240 120, 275 125 
                     C 310 130, 350 115, 390 112 
                     C 430 109, 470 85, 505 82 
                     C 540 79, 580 94, 620 96 
                     C 660 98, 680 72, 715 68 
                     L 715 195 L 50 195 Z"
                  fill="url(#salesGradient)"
                />

                {/* Smooth Line Path */}
                <path
                  d="M 50 140 
                     C 100 135, 120 40, 160 35 
                     C 200 30, 240 120, 275 125 
                     C 310 130, 350 115, 390 112 
                     C 430 109, 470 85, 505 82 
                     C 540 79, 580 94, 620 96 
                     C 660 98, 680 72, 715 68"
                  fill="none"
                  stroke="#14532d"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3.5"
                />

                {/* Interactive Data Point Circles */}
                {salesHistory.map((pt, idx) => {
                  const isSelected = activeChartPoint === idx;
                  const isToday = idx === 6;
                  return (
                    <g
                      key={pt.date}
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveChartPoint(idx)}
                      onClick={() => setActiveChartPoint(idx)}
                    >
                      {isToday && (
                        <>
                          <circle cx={pt.x} cy={pt.y} fill="#14532d" opacity="0.25" r="10" />
                          <circle cx={pt.x} cy={pt.y} fill="#14532d" r="6" />
                        </>
                      )}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        fill={isSelected ? '#14532D' : '#ffffff'}
                        r={isSelected ? '6' : '4.5'}
                        stroke="#14532d"
                        strokeWidth="2.5"
                      />
                      {/* Generous touch target */}
                      <circle cx={pt.x} cy={pt.y} fill="transparent" r="20" />
                    </g>
                  );
                })}
              </svg>

              {/* Day Labels + Clean Value Tickers Below X-Axis */}
              <div className="grid grid-cols-7 pt-2 text-center">
                {salesHistory.map((item, idx) => {
                  const isToday = item.day === 'Aaj';
                  const isSelected = activeChartPoint === idx;
                  return (
                    <button
                      key={item.date}
                      type="button"
                      onClick={() => setActiveChartPoint(idx)}
                      className={`flex flex-col items-center py-1 rounded transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#F0F5F0]' : 'hover:bg-[#F6FBF5]'
                      }`}
                    >
                      <span className={`text-[12px] ${isToday ? 'font-bold text-[#003B1B]' : 'text-[#404941]'}`}>
                        {item.date}
                      </span>
                      <span className={`text-[11px] ${isToday ? 'font-bold text-[#003B1B]' : 'text-[#717970]'}`}>
                        {item.day}
                      </span>
                      <span
                        className={`text-[12px] mt-0.5 tabular-nums ${
                          isToday
                            ? 'font-extrabold text-[#14532D]'
                            : isSelected
                            ? 'font-bold text-[#181D1A]'
                            : 'font-semibold text-[#181D1A]'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section B: Explainable AI Restock Recommendation */}
          <div className="bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Top AI Banner Band */}
            <div className="bg-[#14532D] text-white px-5 sm:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#B1F2BE]">auto_awesome</span>
                <span className="text-[16px] font-bold">AI Sahayak ki Salah</span>
              </div>
              <span className="px-2 py-0.5 bg-white/15 rounded text-[11px] font-bold tracking-wider uppercase text-[#B1F2BE]">
                Zaroori Reorder Sifaarish
              </span>
            </div>

            <div className="p-5 sm:p-6">
              {/* Product Title + Visual Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EBEFEA]">
                <div className="flex items-start gap-3.5">
                  <div className="w-13 h-13 rounded-lg bg-[#F0F5F0] border border-[#DFE4DF] flex items-center justify-center flex-shrink-0 text-[#14532D]">
                    <span className="material-symbols-outlined text-[30px]">water_bottle</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[19px] font-bold text-[#181D1A] leading-snug">
                      {recommendation.itemName}
                    </span>
                    <span className="text-[13px] text-[#404941]">{recommendation.subtitle}</span>
                  </div>
                </div>

                {/* Recommended Quantity Pill */}
                <div className="bg-[#F0F5F0] border border-[#DFE4DF] px-4 py-2 rounded-lg flex items-center gap-3 self-start sm:self-auto">
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] text-[#404941] font-medium">Sifarish ki gayi maang</span>
                    <span className="text-[18px] font-extrabold text-[#14532D]">
                      {recommendation.recommendedOrder} packets
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#14532D] text-[24px]">
                    shopping_cart_checkout
                  </span>
                </div>
              </div>

              {/* Quick Parameter Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4">
                <div className="bg-[#F0F5F0] p-3 rounded-lg border border-[#DFE4DF] flex flex-col">
                  <span className="text-[11px] text-[#404941] font-medium">Bacha hua stock</span>
                  <span className="text-[15px] font-bold text-[#181D1A] mt-0.5">
                    {recommendation.currentStock} packets
                  </span>
                  <span className="text-[11px] text-[#717970] mt-0.5">Dukan ke fridge mein</span>
                </div>
                <div className="bg-[#F0F5F0] p-3 rounded-lg border border-[#DFE4DF] flex flex-col">
                  <span className="text-[11px] text-[#404941] font-medium">Ausat dainik bikri</span>
                  <span className="text-[15px] font-bold text-[#181D1A] mt-0.5">
                    {recommendation.dailyAvgSales} packets / din
                  </span>
                  <span className="text-[11px] text-[#717970] mt-0.5">Pichhle 14 dinon ka</span>
                </div>
                <div className="bg-[#F0F5F0] p-3 rounded-lg border border-[#DFE4DF] flex flex-col">
                  <span className="text-[11px] text-[#404941] font-medium">Distributor ka time</span>
                  <span className="text-[15px] font-bold text-[#181D1A] mt-0.5">
                    {recommendation.leadTimeDays} din lagenge
                  </span>
                  <span className="text-[11px] text-[#717970] mt-0.5">Subah 7:30 delivery</span>
                </div>
                <div className="bg-[#F0F5F0] p-3 rounded-lg border border-[#DFE4DF] flex flex-col">
                  <span className="text-[11px] text-[#404941] font-medium">Suraksha stock (Buffer)</span>
                  <span className="text-[15px] font-bold text-[#14532D] mt-0.5">
                    +{recommendation.bufferStock} packets
                  </span>
                  <span className="text-[11px] text-[#717970] mt-0.5">Aapatkaal ke liye</span>
                </div>
              </div>

              {/* Conversational Math / Explainability Box */}
              <div className="bg-[#F0F5F0] border border-[#DFE4DF] rounded-lg p-3.5 mb-3.5">
                <div className="flex items-center gap-1.5 text-[#14532D] mb-1.5">
                  <span className="material-symbols-outlined text-[18px]">calculate</span>
                  <span className="text-[13px] font-bold">Yeh hisaab kaise lagaya gaya?</span>
                </div>
                <p className="text-[14px] text-[#181D1A] leading-relaxed">
                  "Delivery aane tak lagbhag <strong>24 packets</strong> (12 x 2 din) bik sakte hain. Dukaan mein 5 packets safety stock rakhkar, <strong>9 aur mangwana sahi rahega</strong> taaki koi grahak khali haath na laute."
                </p>

                {/* Visual Math Step Flow */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-[#DFE4DF]">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#404941]">1. Sambhavit Bikri</span>
                    <span className="text-[13px] font-bold text-[#181D1A]">2 din × 12 = 24 pkt</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#404941]">2. Maujuda Stock</span>
                    <span className="text-[13px] font-bold text-[#181D1A]">- 20 pkt</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#404941]">3. Safety Stock</span>
                    <span className="text-[13px] font-bold text-[#181D1A]">+ 5 pkt</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#14532D] font-semibold">Khareedne ki Salah</span>
                    <span className="text-[13px] font-extrabold text-[#14532D]">= 9 packets</span>
                  </div>
                </div>
              </div>

              {/* Confidence Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#E5E9E4]/60 p-2.5 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#FFDBCA] text-[#763300] text-[11px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">tune</span>
                    Bharosa: Madhyam
                  </span>
                  <span className="text-[12px] text-[#404941]">
                    Pichhle kuch dinon mein doodh ki bikri mein thoda utaar-chadhaav raha hai (Navratri aur mausam ke chalte).
                  </span>
                </div>
                <span className="text-[11px] text-[#717970] flex-shrink-0">Updated 10m pehle</span>
              </div>

              {/* Bottom Action Button & Clear Kirana Microcopy - NO pill-shaped button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#404941]">
                    (Yeh note banakar aap WhatsApp par distributor ko bhej sakte hain. <strong>Seedha order place nahi hoga.</strong>)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenOrderNote(recommendation)}
                  className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#14532D] text-white rounded-lg text-[15px] font-semibold hover:bg-[#003B1B] transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                  <span>Order note banayein</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN (4 cols): Stock Alerts & Fast Movers */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Section C: Actionable Stock Alerts */}
          <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEFEA]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#9B4500] text-[22px]">notification_important</span>
                <span className="text-[17px] text-[#181D1A] font-bold">Stock par dhyaan dein</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#FFDBCA] text-[#763300] text-[11px] font-bold">
                3 items par asar
              </span>
            </div>

            <div className="flex flex-col gap-3.5 mt-3.5">
              {/* Alert Item 1: Aashirvaad Atta */}
              <div className="bg-[#F0F5F0] p-3.5 rounded-lg border border-[#DFE4DF] flex flex-col gap-1 transition-colors hover:bg-[#EBEFEA]">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[15px] font-bold text-[#181D1A] leading-tight">
                    Aashirvaad Shuddh Chakki Atta (5kg)
                  </span>
                </div>
                <div className="flex items-center gap-2 my-0.5">
                  <span className="px-2 py-0.5 rounded bg-[#FFDBCA] text-[#763300] text-[11px] font-bold">
                    Kewal 3 packets bache
                  </span>
                </div>
                <p className="text-[13px] text-[#404941]">
                  Shaam ko zyaada bikta hai. Kal dopahar tak khatam hone ki aashanka hai.
                </p>
                <div className="pt-2 mt-1 border-t border-[#DFE4DF] flex items-center justify-between">
                  <span className="text-[11px] text-[#717970]">Shri Balaji Traders</span>
                  <button
                    type="button"
                    onClick={() => onCallDistributor('Shri Balaji Traders', '+91 00000 00000')}
                    className="flex items-center gap-1 text-[12px] font-bold text-[#14532D] hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">call</span>
                    <span>Distributor ko call karein</span>
                  </button>
                </div>
              </div>

              {/* Alert Item 2: Fortune Oil */}
              <div className="bg-[#F0F5F0] p-3.5 rounded-lg border border-[#DFE4DF] flex flex-col gap-1 transition-colors hover:bg-[#EBEFEA]">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[15px] font-bold text-[#181D1A] leading-tight">
                    Fortune Sunlite Sunflower Oil (1L)
                  </span>
                </div>
                <div className="flex items-center gap-2 my-0.5">
                  <span className="px-2 py-0.5 rounded bg-[#FFDBCA] text-[#763300] text-[11px] font-bold">
                    4 pouch bache
                  </span>
                </div>
                <p className="text-[13px] text-[#404941]">
                  Weekend par maang badh jaati hai. Stock filhaal kam hai.
                </p>
                <div className="pt-2 mt-1 border-t border-[#DFE4DF] flex items-center justify-between">
                  <span className="text-[11px] text-[#717970]">Garg Agency</span>
                  <button
                    type="button"
                    onClick={() => handleItemAdd('Fortune Sunlite Sunflower Oil (1L)')}
                    className="flex items-center gap-1 text-[12px] font-bold text-[#14532D] hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {addedItems['Fortune Sunlite Sunflower Oil (1L)'] ? 'check_circle' : 'add_circle'}
                    </span>
                    <span>
                      {addedItems['Fortune Sunlite Sunflower Oil (1L)'] ? 'Jod diya gaya' : 'List mein jodein'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Alert Item 3: Tata Salt */}
              <div className="bg-[#F0F5F0] p-3.5 rounded-lg border border-[#DFE4DF] flex flex-col gap-1 transition-colors hover:bg-[#EBEFEA]">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[15px] font-bold text-[#181D1A] leading-tight">Tata Salt (1kg)</span>
                </div>
                <div className="flex items-center gap-2 my-0.5">
                  <span className="px-2 py-0.5 rounded bg-[#FFDAD6] text-[#93000A] text-[11px] font-bold">
                    0 packet (Khatam ho chuka)
                  </span>
                </div>
                <p className="text-[13px] text-[#404941]">
                  Aaj 2 grahak bina namak liye wapas gaye. Turant reorder ki zaroorat hai.
                </p>
                <div className="pt-2 mt-1 border-t border-[#DFE4DF] flex items-center justify-between">
                  <span className="text-[11px] text-[#717970]">Local Wholesale</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('inventory')}
                    className="flex items-center gap-1 text-[12px] font-bold text-[#BA1A1A] hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">priority_high</span>
                    <span>Reorder list mein dekhein</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Fast-Selling Items */}
          <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col">
            <div className="flex flex-col pb-3 border-b border-[#EBEFEA]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#14532D] text-[20px]">trending_up</span>
                <span className="text-[16px] text-[#181D1A] font-bold">Jaldi bikne wale</span>
              </div>
              <span className="text-[13px] text-[#404941]">Aaj sabse zyada maang wale items</span>
            </div>

            <div className="flex flex-col divide-y divide-[#EBEFEA]">
              {/* Item 1 */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-[#EBEFEA] text-[#181D1A] text-[12px] font-bold flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-bold text-[#181D1A] truncate">
                      Maggi 2-Minute Noodles (70g)
                    </span>
                    <span className="text-[11px] text-[#404941]">Nestlé • ₹14 packet</span>
                  </div>
                </div>
                <span className="text-[13px] font-bold text-[#14532D] flex-shrink-0">18 bika</span>
              </div>

              {/* Item 2 */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-[#EBEFEA] text-[#181D1A] text-[12px] font-bold flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-bold text-[#181D1A] truncate">
                      Parle-G Gold Biscuit (100g)
                    </span>
                    <span className="text-[11px] text-[#404941]">Parle • ₹10 packet</span>
                  </div>
                </div>
                <span className="text-[13px] font-bold text-[#14532D] flex-shrink-0">14 bika</span>
              </div>

              {/* Item 3 */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-[#EBEFEA] text-[#181D1A] text-[12px] font-bold flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-bold text-[#181D1A] truncate">
                      Surf Excel Easy Wash (500g)
                    </span>
                    <span className="text-[11px] text-[#404941]">HUL • ₹72 pack</span>
                  </div>
                </div>
                <span className="text-[13px] font-bold text-[#14532D] flex-shrink-0">9 bika</span>
              </div>
            </div>

            {/* Quick View All Link */}
            <button
              type="button"
              onClick={() => onNavigate('sales')}
              className="mt-3 pt-2 text-center text-[12px] font-bold text-[#003B1B] hover:underline flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Sabhi 67 bikri ki suchi dekhein</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          {/* Quick Helpful Tip Card */}
          <div className="bg-[#EBEFEA] p-4 rounded-xl border border-[#DFE4DF] flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#14532D] text-[20px] flex-shrink-0 mt-0.5">
              lightbulb
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#181D1A]">
                Kirana Nuskha: Shaniwar ki taiyari
              </span>
              <span className="text-[13px] text-[#404941] mt-0.5 leading-snug">
                Shaniwar subah dahi aur bakery items ki maang 30% badh jati hai. Kal dopahar 2 baje se pehle distributor ko order bhej dein.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
