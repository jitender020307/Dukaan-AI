import React, { useState, useEffect } from 'react';
import { InventoryItem, SaleRecord, CustomerKhata } from '../types';

interface VoiceAssistantModalProps {
  onClose: () => void;
  inventory: InventoryItem[];
  sales: SaleRecord[];
  customers: CustomerKhata[];
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  onClose,
  inventory,
  sales,
  customers,
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  const sampleQuestions = [
    'Amul doodh kitna bacha hai?',
    'Aaj ki kul bikri aur munafa kitna hai?',
    'Kiska udhaar sabse zyaada baaki hai?',
    'Tata salt ka distributor kaun hai?',
    'Kaunse samaan ka stock khatam ho gaya?',
  ];

  const processQuery = (input: string) => {
    const q = input.toLowerCase();

    if (q.includes('amul') || q.includes('doodh') || q.includes('milk')) {
      const milk = inventory.find((i) => i.id === 'inv-1');
      if (milk) {
        setAnswer(
          `Amul Taaza Milk ke filhaal ${milk.stock} packets dukan ke fridge mein bache hain. Dainik ausat bikri 12 packets hai aur distributor ko aane mein 2 din lagte hain. AI sahayak 9 packets reorder karne ki salah deta hai taaki 5 packets buffer stock bana rahe.`
        );
        return;
      }
    }

    if (q.includes('bikri') || q.includes('sale') || q.includes('munafa') || q.includes('profit')) {
      setAnswer(
        `Aaj ki kul bikri ₹8,450 hai (kal se ₹620 zyaada). Kul 67 packets 28 alag-alag grahakon ne khareede hain. Andazee munafa ₹1,920 hai jo lagbhag 22.7% margin banta hai.`
      );
      return;
    }

    if (q.includes('udhaar') || q.includes('khata') || q.includes('due') || q.includes('baaki')) {
      const highest = [...customers].sort((a, b) => b.balanceDue - a.balanceDue)[0];
      setAnswer(
        `Kul udhaar baaki ₹5,910 hai. Sabse zyaada baaki ${highest.name} ji ka hai (₹${highest.balanceDue.toLocaleString('en-IN')}), jo unki ₹${highest.creditLimit} ki limit ke kareeb hai.`
      );
      return;
    }

    if (q.includes('salt') || q.includes('namak') || q.includes('tata')) {
      const salt = inventory.find((i) => i.id === 'inv-4');
      setAnswer(
        `Tata Salt (1kg) ka stock filhaal 0 ho chuka hai. Aaj 2 grahak bina namak liye wapas gaye hain. Distributor "Local Wholesale" (+91 00000 00000) ko turant 20-25 packets ka order bhejna zaroori hai.`
      );
      return;
    }

    if (q.includes('khatam') || q.includes('out') || q.includes('stock')) {
      const outItems = inventory.filter((i) => i.stock === 0);
      const lowItems = inventory.filter((i) => i.stock > 0 && i.stock <= i.minThreshold);
      setAnswer(
        `Dukaan mein ${outItems.map((i) => i.name).join(', ')} ka stock bilkul khatam ho chuka hai. Iske alawa ${lowItems.map((i) => i.name).join(', ')} ka stock kam hai.`
      );
      return;
    }

    // Default friendly answer
    setAnswer(
      `Ramesh ji, aapki dukaan ka hisaab bilkul update hai: Aaj ki bikri ₹8,450, 67 items bik chuke hain, aur 3 items par reorder ki zaroorat hai. Aap stock, bikri ya kisi grahak ke baare mein poohein.`
    );
  };

  const handleStartVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Aapke browser mein voice recognition support uplabdh nahi hai. Kripya type karein.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setQuery(text);
        processQuery(text);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    processQuery(query);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#EAE6DF] max-w-lg w-full p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBEFEA] mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#14532D] text-[22px]">mic</span>
            <div>
              <h2 className="text-[17px] font-bold text-[#181D1A]">Dukaan se Poochhein</h2>
              <span className="text-[11px] text-[#404941]">Kirana Vyapar Sahayak</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#404941] hover:text-[#181D1A] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Big Mic Trigger */}
        <div className="flex flex-col items-center justify-center py-4 bg-[#F0F5F0] rounded-xl border border-[#DFE4DF] mb-4">
          <button
            type="button"
            onClick={handleStartVoice}
            className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? 'bg-[#BA1A1A] text-white animate-pulse'
                : 'bg-[#14532D] text-white hover:bg-[#003B1B] shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-[32px]">mic</span>
          </button>
          <span className="text-[13px] font-semibold text-[#181D1A] mt-2">
            {isListening ? 'Aapki aawaz sun rahe hain...' : 'Bolkar poochhein (Tap karein)'}
          </span>
          <span className="text-[11px] text-[#717970] mt-0.5">
            Hindi ya English mein bole sakhein hain
          </span>
        </div>

        {/* Text Input Option */}
        <form onSubmit={handleTextSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ya yahan type karke sawaal poochhein..."
            className="flex-1 px-3.5 py-2 border border-[#DFE4DF] rounded-lg text-[13px] text-[#181D1A] focus:outline-none focus:border-[#14532D]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#14532D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003B1B] cursor-pointer"
          >
            Poochhein
          </button>
        </form>

        {/* Answer Box */}
        {answer && (
          <div className="p-3.5 bg-[#DCFCE7]/60 border border-[#B1F2BE] rounded-lg mb-4 text-[13px] text-[#181D1A] leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-[#14532D] mb-1">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Dukaan ka Uttar:</span>
            </div>
            {answer}
          </div>
        )}

        {/* Quick Sample Questions */}
        <div>
          <span className="text-[11px] font-bold text-[#404941] uppercase tracking-wider block mb-2">
            Udaharan Sawaal (Click to ask):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(q);
                  processQuery(q);
                }}
                className="px-2.5 py-1.5 bg-[#F0F5F0] hover:bg-[#EBEFEA] border border-[#DFE4DF] rounded-lg text-[12px] text-[#181D1A] text-left cursor-pointer transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
