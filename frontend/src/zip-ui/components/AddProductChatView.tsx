import React, { useState } from 'react';
import { api } from '../api';
import type { ChatProductDraft, ChatProductResult } from '../types';

import type { NavTab } from '../types';
interface AddProductChatViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const AddProductChatView: React.FC<AddProductChatViewProps> = ({ onNavigate }) => {
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState<ChatProductDraft | null>(null);
  const [editedDraft, setEditedDraft] = useState<Partial<ChatProductDraft>>({});
  const [currentMissing, setCurrentMissing] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<ChatProductResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!message.trim()) return;
    setIsParsing(true);
    setError(null);
    setResult(null);
    try {
      const parsed = await api.parseAddProduct(message.trim());
      setDraft(parsed);
      setEditedDraft({});
      setCurrentMissing(parsed.missingFields.slice());
    } catch (err: any) {
      setError(err.message || 'Could not parse the product message.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreate = async () => {
    if (!draft) return;
    setIsCreating(true);
    setError(null);
    try {
      const finalDraft = { ...draft, ...editedDraft } as ChatProductDraft;
      const result = await api.createProductFromChat(finalDraft);
      setResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to create the product.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setMessage('');
    setDraft(null);
    setEditedDraft({});
    setResult(null);
    setError(null);
  };

  const handleFieldChange = (field: keyof ChatProductDraft, value: string) => {
    setEditedDraft(prev => ({ ...prev, [field]: value }));
    if (!draft) return;
    // Re‑compute which required fields are still missing after this edit.
    const newMissing = draft.missingFields.filter((f) => {
      const existing = editedDraft[f as keyof ChatProductDraft] ?? draft[f as keyof ChatProductDraft];
      if (typeof existing === 'number') return existing === 0;
      if (typeof existing === 'string') return existing.trim() === '';
      return true;
    });
    setCurrentMissing(newMissing);
  };

  const sampleMessages = [
    'Add new product: 5kg Basmati rice, cost price ₹120, selling price ₹150, MRP ₹180, distributor: Shreeji Traders',
    'Create product: 100g Amul Butter, stock 20, unit piece, cost ₹50, selling ₹60',
    'Add to inventory: 1L Sunflower oil, stock 15, cost ₹100, selling ₹120, distributor: Patel Oil Mills',
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Add Product via Chat</h2>
        <p className="text-xs text-gray-500">
          Type a natural-language message describing the product to add, and we'll parse it into product fields.
        </p>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            1. Product Description Text
          </label>
          <span className="text-xs text-gray-400">Parses into product fields</span>
        </div>

        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type or paste a description of the product to add..."
          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-emerald-800"
        />

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-gray-500">Quick samples:</span>
          {sampleMessages.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setMessage(sample)}
              className="text-[11px] px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer truncate max-w-xs"
            >
              "{sample.slice(0, 36)}..."
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={isParsing || !message.trim()}
            onClick={handleParse}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <span className={`material-symbols-outlined text-[16px] ${isParsing ? 'animate-spin' : ''}`}>
              {isParsing ? 'sync' : 'auto_fix_high'}
            </span>
            <span>{isParsing ? 'Parsing Message...' : 'Parse Product Description'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {draft && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
              <h3 className="text-sm font-bold text-gray-900">2. Product Preview</h3>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Draft Only (Not saved)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(draft).map((key) => {
                const isMissing = draft.missingFields.includes(key);
                const fieldValue = editedDraft[key as keyof ChatProductDraft] ?? draft[key as keyof ChatProductDraft];

                return (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      {isMissing && <span className="text-red-500"> (required)</span>}
                    </label>
                    {isMissing ? (
                      <input
                        type="text"
                        value={fieldValue as string}
                        onChange={(e) => handleFieldChange(key as keyof ChatProductDraft, e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                        placeholder="Enter value"
                      />
                    ) : (
                      <div className="p-2 bg-gray-50 rounded-md text-xs text-gray-700">
                        {JSON.stringify(fieldValue)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                {currentMissing.length > 0 && (
                  <span className="text-amber-700">
                    Please fill required fields: {currentMissing.map(f => f.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', ')}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded cursor-pointer"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  disabled={isCreating || currentMissing.length > 0}
                  onClick={handleCreate}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded disabled:opacity-50 cursor-pointer"
                >
                  {isCreating ? 'Creating Product...' : 'Confirm & Add Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-lg text-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <span className="material-symbols-outlined text-[20px] text-emerald-700">check_circle</span>
            <span>Product Officially Added</span>
          </div>
          <p className="text-emerald-800">
            Product <strong>{result.name}</strong> has been added with stock <strong>{result.stock}</strong>.
            Product ID: <strong>{result.productId}</strong>
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded cursor-pointer"
            >
              View in Inventory
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded cursor-pointer"
            >
              Add Another Product
            </button>
          </div>
        </div>
      )}
    </div>
  );
};