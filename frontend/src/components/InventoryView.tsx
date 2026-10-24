import React, { useState } from 'react';
import { InventoryItem } from '../types';

interface InventoryViewProps {
  items: InventoryItem[];
  onUpdateStock: (id: string, delta: number) => void;
  onAddItem: (newItem: Omit<InventoryItem, 'id'>) => void;
  onOpenOrderNoteForDistributor: (distributor: string, items: InventoryItem[]) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  onUpdateStock,
  onAddItem,
  onOpenOrderNoteForDistributor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for adding new item
  const [newItemName, setNewItemName] = useState('');
  const [newItemNameHi, setNewItemNameHi] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<InventoryItem['category']>('Atta & Dal');
  const [newItemStock, setNewItemStock] = useState('10');
  const [newItemUnit, setNewItemUnit] = useState('packets');
  const [newItemCP, setNewItemCP] = useState('40');
  const [newItemSP, setNewItemSP] = useState('50');
  const [newItemDistributor, setNewItemDistributor] = useState('Shri Balaji Traders');

  const categories = [
    'All',
    'Dairy',
    'Atta & Dal',
    'Edible Oil',
    'Spices & Salt',
    'Biscuits & Snacks',
    'Cleaning & Household',
  ];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameHi.includes(searchTerm) ||
      item.distributor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'low' && (item.status === 'low_stock' || item.status === 'out_of_stock')) ||
      (filterStatus === 'out' && item.status === 'out_of_stock');
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockCount = items.filter((i) => i.status === 'low_stock').length;
  const outOfStockCount = items.filter((i) => i.status === 'out_of_stock').length;

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const stockNum = parseInt(newItemStock, 10) || 0;
    const cp = parseFloat(newItemCP) || 0;
    const sp = parseFloat(newItemSP) || 0;

    onAddItem({
      name: newItemName.trim(),
      nameHi: newItemNameHi.trim() || newItemName.trim(),
      category: newItemCategory,
      stock: stockNum,
      unit: newItemUnit,
      minThreshold: 10,
      costPrice: cp,
      sellingPrice: sp,
      mrp: sp,
      distributor: newItemDistributor,
      distributorPhone: '+91 00000 00000',
      distributorLeadDays: 1,
      dailyAvgSales: 5,
      status: stockNum === 0 ? 'out_of_stock' : stockNum < 10 ? 'low_stock' : 'in_stock',
    });

    setIsAddModalOpen(false);
    setNewItemName('');
    setNewItemNameHi('');
  };

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-3">
        <div>
          <h1 className="text-[26px] sm:text-[30px] font-bold text-[#003B1B] tracking-tight">
            Inventory (Dukaan ka Stock)
          </h1>
          <p className="text-[14px] text-[#404941] mt-0.5">
            Samaano ki ginti, khareed daam, bikri daam aur distributor se reorder list.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg text-[14px] font-semibold hover:bg-[#003B1B] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px]">add</span>
            <span>Naya Samaan Jodein</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-white border-[#14532D] ring-1 ring-[#14532D]'
              : 'bg-white border-[#EAE6DF] hover:border-[#14532D]/40'
          }`}
        >
          <span className="text-[12px] text-[#404941] font-medium">Kul Listed Items</span>
          <div className="text-[24px] font-bold text-[#181D1A] mt-1 tabular-nums">
            {items.length} items
          </div>
          <span className="text-[11px] text-[#717970] mt-0.5 block">Sabhi categories shamil</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('low')}
          className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
            filterStatus === 'low'
              ? 'bg-[#FFDBCA]/30 border-[#9B4500] ring-1 ring-[#9B4500]'
              : 'bg-white border-[#EAE6DF] hover:border-[#9B4500]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#404941] font-medium">Kam Stock (Low)</span>
            <span className="px-2 py-0.5 rounded bg-[#FFDBCA] text-[#763300] text-[10px] font-bold">
              Zaroorat
            </span>
          </div>
          <div className="text-[24px] font-bold text-[#9B4500] mt-1 tabular-nums">
            {lowStockCount} items
          </div>
          <span className="text-[11px] text-[#404941] mt-0.5 block">Turant order ki sifarish</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('out')}
          className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
            filterStatus === 'out'
              ? 'bg-[#FFDAD6]/30 border-[#BA1A1A] ring-1 ring-[#BA1A1A]'
              : 'bg-white border-[#EAE6DF] hover:border-[#BA1A1A]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#404941] font-medium">Khatam Ho Chuka (0)</span>
            <span className="px-2 py-0.5 rounded bg-[#FFDAD6] text-[#93000A] text-[10px] font-bold">
              Khatam
            </span>
          </div>
          <div className="text-[24px] font-bold text-[#BA1A1A] mt-1 tabular-nums">
            {outOfStockCount} item
          </div>
          <span className="text-[11px] text-[#404941] mt-0.5 block">Grahak khali haath laute</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] mb-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-[#404941]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Samaan ya distributor ka naam khojein (e.g. Atta, Amul, Parle)..."
            className="w-full pl-10 pr-4 py-2 bg-[#F0F5F0] border border-[#DFE4DF] rounded-lg text-[14px] text-[#181D1A] placeholder-[#717970] focus:outline-none focus:border-[#14532D]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex-shrink-0 cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#14532D] text-white'
                  : 'bg-[#F0F5F0] text-[#404941] hover:bg-[#EBEFEA] hover:text-[#181D1A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F0F5F0] border-b border-[#DFE4DF] text-[12px] font-bold text-[#404941] uppercase tracking-wider">
                <th className="py-3 px-4">Samaan / Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Maujuda Stock</th>
                <th className="py-3 px-4">Khareed / Bikri</th>
                <th className="py-3 px-4">Margin %</th>
                <th className="py-3 px-4">Distributor</th>
                <th className="py-3 px-4 text-right">Quick Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEFEA] text-[14px]">
              {filteredItems.map((item) => {
                const marginPercent = Math.round(
                  ((item.sellingPrice - item.costPrice) / item.costPrice) * 100
                );
                return (
                  <tr key={item.id} className="hover:bg-[#F6FBF5] transition-colors">
                    {/* Item Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#181D1A]">{item.name}</span>
                        <span className="text-[12px] text-[#404941]">{item.nameHi}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#EBEFEA] text-[#404941] text-[11px] font-semibold">
                        {item.category}
                      </span>
                    </td>

                    {/* Stock Status */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`font-extrabold text-[15px] tabular-nums ${
                            item.stock === 0
                              ? 'text-[#BA1A1A]'
                              : item.stock <= item.minThreshold
                              ? 'text-[#9B4500]'
                              : 'text-[#14532D]'
                          }`}
                        >
                          {item.stock} {item.unit}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                            item.stock === 0
                              ? 'bg-[#FFDAD6] text-[#93000A]'
                              : item.stock <= item.minThreshold
                              ? 'bg-[#FFDBCA] text-[#763300]'
                              : 'bg-[#DCFCE7] text-[#14532D]'
                          }`}
                        >
                          {item.stock === 0 ? 'Khatam' : item.stock <= item.minThreshold ? 'Kam' : 'Pura'}
                        </span>
                      </div>
                    </td>

                    {/* Cost / Selling Price */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col tabular-nums">
                        <span className="font-bold text-[#181D1A]">₹{item.sellingPrice} bikri</span>
                        <span className="text-[11px] text-[#717970]">CP: ₹{item.costPrice}</span>
                      </div>
                    </td>

                    {/* Margin */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#14532D] tabular-nums">+{marginPercent}%</span>
                    </td>

                    {/* Distributor */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-[#181D1A]">{item.distributor}</span>
                        <span className="text-[11px] text-[#717970]">{item.distributorPhone}</span>
                      </div>
                    </td>

                    {/* Quick Stock Controls */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => onUpdateStock(item.id, -1)}
                          disabled={item.stock === 0}
                          title="Kam karein"
                          className="w-8 h-8 rounded-lg border border-[#DFE4DF] bg-white hover:bg-[#F0F5F0] text-[#181D1A] flex items-center justify-center font-bold disabled:opacity-30 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold tabular-nums text-[13px]">
                          {item.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateStock(item.id, 1)}
                          title="Badhayein"
                          className="w-8 h-8 rounded-lg border border-[#DFE4DF] bg-white hover:bg-[#F0F5F0] text-[#14532D] flex items-center justify-center font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EAE6DF] max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEFEA] mb-4">
              <h2 className="text-[18px] font-bold text-[#181D1A]">Dukaan mein Naya Samaan Jodein</h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#404941] hover:text-[#181D1A] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[12px] font-bold text-[#404941] block mb-1">
                  Item Name (English)
                </label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Haldiram Bhujia (400g)"
                  className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#404941] block mb-1">
                  Item Name (हिन्दी)
                </label>
                <input
                  type="text"
                  value={newItemNameHi}
                  onChange={(e) => setNewItemNameHi(e.target.value)}
                  placeholder="e.g. हल्दीराम भुजिया (400g)"
                  className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-bold text-[#404941] block mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                  >
                    <option value="Atta & Dal">Atta & Dal</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Edible Oil">Edible Oil</option>
                    <option value="Spices & Salt">Spices & Salt</option>
                    <option value="Biscuits & Snacks">Biscuits & Snacks</option>
                    <option value="Cleaning & Household">Cleaning & Household</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-bold text-[#404941] block mb-1">Unit</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="packets, pouch, kg, bottle"
                    className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[12px] font-bold text-[#404941] block mb-1">Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-[#404941] block mb-1">Khareed Daam (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newItemCP}
                    onChange={(e) => setNewItemCP(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-[#404941] block mb-1">Bikri Daam (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newItemSP}
                    onChange={(e) => setNewItemSP(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#404941] block mb-1">Distributor</label>
                <input
                  type="text"
                  value={newItemDistributor}
                  onChange={(e) => setNewItemDistributor(e.target.value)}
                  placeholder="Distributor Name"
                  className="w-full px-3 py-2 border border-[#DFE4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#14532D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EBEFEA] mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#DFE4DF] rounded-lg text-[14px] font-semibold text-[#404941] hover:bg-[#F0F5F0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#14532D] text-white rounded-lg text-[14px] font-semibold hover:bg-[#003B1B] transition-colors cursor-pointer"
                >
                  Save Samaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
