import React, { useState, useEffect } from 'react';
import { InventoryProduct } from '../types';
import { api } from '../api';

interface InventoryViewProps {
  onInventoryChanged: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onInventoryChanged }) => {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'in_stock'>('all');

  // Action status
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [manualDeltas, setManualDeltas] = useState<Record<string,string>>({});
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formNameHi, setFormNameHi] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formStock, setFormStock] = useState('0');
  const [formUnit, setFormUnit] = useState('piece');
  const [formCP, setFormCP] = useState('0');
  const [formSP, setFormSP] = useState('0');
  const [formThreshold, setFormThreshold] = useState('10');
  const [formDistributor, setFormDistributor] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const categories = ['All', ...new Set(['Dairy','Atta & Dal','Edible Oil','Spices & Salt','Biscuits & Snacks','Cleaning & Household',...products.map((product)=>product.category)])];

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getInventory({
        search: searchTerm || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedCategory, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  // Quick Stock Adjustment (+ / -)
  const handleStockDelta = async (prodId: string, delta: number) => {
    setActionLoadingId(prodId);
    setFeedback(null);
    try {
      await api.updateStock(prodId, { delta });
      setFeedback({ message: 'Stock adjustment saved.', type: 'success' });
      fetchInventory();
      onInventoryChanged();
    } catch (err: any) {
      setFeedback({ message: err.message || 'Stock adjustment failed', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (prod: InventoryProduct) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormNameHi(prod.nameHi);
    setFormBarcode(prod.barcode || '');
    setFormCategory(prod.category);
    setFormStock(String(prod.stock));
    setFormUnit(prod.unit);
    setFormCP(String(prod.costPrice));
    setFormSP(String(prod.sellingPrice));
    setFormThreshold(String(prod.minThreshold));
    setFormDistributor(prod.distributor);
    setFormPhone(prod.distributorPhone);
    setFormError(null);
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormNameHi('');
    setFormBarcode('');
    setFormCategory('General');
    setFormStock('0');
    setFormUnit('piece');
    setFormCP('0');
    setFormSP('0');
    setFormThreshold('10');
    setFormDistributor('');
    setFormPhone('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Product name is required');
      return;
    }

    setFormError(null);
    const payload = {
      name: formName.trim(),
      nameHi: formNameHi.trim() || formName.trim(),
      barcode: formBarcode.trim(),
      category: formCategory,
      stock: parseFloat(formStock) || 0,
      unit: formUnit.trim() || 'piece',
      costPrice: parseFloat(formCP) || 0,
      sellingPrice: parseFloat(formSP) || 0,
      mrp: parseFloat(formSP) || 0,
      minThreshold: parseFloat(formThreshold) || 10,
      distributor: formDistributor.trim() || 'Direct Supplier',
      distributorPhone: formPhone.trim(),
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        setFeedback({ message: `Updated "${payload.name}" in your store.`, type: 'success' });
        setEditingProduct(null);
      } else {
        await api.createProduct(payload);
        setFeedback({ message: `Added "${payload.name}" to your inventory.`, type: 'success' });
        setIsAddModalOpen(false);
      }
      fetchInventory();
      onInventoryChanged();
    } catch (err: any) {
      setFormError(err.message || 'Could not save the product');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Inventory & Stock</h2>
          <p className="text-xs text-gray-500">
            Search products, adjust stock counts in real time, and manage supplier details.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Add New Product</span>
        </button>
      </div>

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-md text-xs font-semibold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} className="cursor-pointer text-gray-500">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Search and Category Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2 text-[18px] text-gray-400">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name or scan barcode, then press Enter..."
              className="w-full pl-9 pr-16 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-emerald-800"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-800 text-white rounded hover:bg-emerald-900 cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('low_stock')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                statusFilter === 'low_stock'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Low Stock
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('out_of_stock')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                statusFilter === 'out_of_stock'
                  ? 'bg-red-700 text-white'
                  : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex-shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800 flex items-center justify-between">
          <span>Error loading inventory: {error}</span>
          <button type="button" onClick={fetchInventory} className="underline font-bold text-red-900 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Product List Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            <div className="w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading live inventory from Supabase...
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            <span className="material-symbols-outlined text-gray-300 text-[36px] mb-1">inventory_2</span>
            <p className="font-semibold text-gray-800 text-sm">No products found</p>
            <p className="text-gray-400 mt-0.5">Try clearing filters or add a new product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Cost Price</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-center">Quick Stock Adjust</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((prod) => {
                  const isBusy = actionLoadingId === prod.id;
                  const isOut = prod.stock <= 0;
                  const isLow = prod.stock <= prod.minThreshold;

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isOut ? 'bg-red-50/20' : isLow ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{prod.name}</span>
                          <span className="text-[11px] text-gray-500">{prod.nameHi}</span>
                          {prod.barcode && <span className="text-[10px] text-gray-400 font-mono">Barcode · {prod.barcode}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                          {prod.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-extrabold text-sm tabular-nums ${
                              isOut ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-emerald-800'
                            }`}
                          >
                            {prod.stock} {prod.unit}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 rounded mt-0.5 uppercase ${
                              isOut
                                ? 'bg-red-100 text-red-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOut ? 'Out of stock' : isLow ? 'Low stock' : 'Sufficient'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-gray-900 tabular-nums">₹{prod.sellingPrice}</td>
                      <td className="py-3 px-4 text-gray-500 tabular-nums">₹{prod.costPrice}</td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{prod.distributor}</span>
                          <span className="text-[10px] text-gray-400">{prod.distributorPhone}</span>
                        </div>
                      </td>

                      {/* Fast Inline Stock Adjustment */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <button
                            type="button"
                            disabled={isBusy || prod.stock <= 0}
                            onClick={() => handleStockDelta(prod.id, -1)}
                            className="w-7 h-7 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 font-bold flex items-center justify-center disabled:opacity-30 cursor-pointer text-xs"
                            title="Decrease stock by 1"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold font-mono text-xs">{prod.stock}</span>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleStockDelta(prod.id, 1)}
                            className="w-7 h-7 rounded border border-gray-300 bg-white hover:bg-gray-100 text-emerald-800 font-bold flex items-center justify-center disabled:opacity-30 cursor-pointer text-xs"
                            title="Increase stock by 1"
                          >
                            +
                          </button>
                          <input type="number" step="0.001" value={manualDeltas[prod.id]||''} onChange={(e)=>setManualDeltas((prev)=>({...prev,[prod.id]:e.target.value}))} placeholder="± qty" aria-label={`Manual stock change for ${prod.name}`} className="w-14 px-1 py-1 border border-gray-300 rounded text-[10px]" />
                          <button type="button" disabled={isBusy||!Number(manualDeltas[prod.id])} onClick={()=>{const delta=Number(manualDeltas[prod.id]);void handleStockDelta(prod.id,delta);setManualDeltas((prev)=>({...prev,[prod.id]:''}));}} className="px-2 py-1 rounded bg-emerald-800 text-white text-[10px] font-bold disabled:opacity-40">Apply</button>
                        </div>
                      </td>

                      {/* Edit & Delete Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => openEditModal(prod)}
                            className="p-1 rounded text-gray-600 hover:text-emerald-800 hover:bg-gray-100 cursor-pointer"
                            title="Edit Product"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <span className="px-1 text-[10px] text-gray-400" title="Products are retained to preserve sales history">History kept</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-lg w-full p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {editingProduct ? `Edit Product (${editingProduct.name})` : 'Add New Inventory Product'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {formError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-800 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProductForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Name (English)</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Fortune Sunflower Oil (1L)"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Name (हिन्दी)</label>
                <input
                  type="text"
                  value={formNameHi}
                  onChange={(e) => setFormNameHi(e.target.value)}
                  placeholder="e.g. फॉर्च्यून सनलाइट रिफाइंड तेल"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Barcode (optional)</label>
                <input type="text" value={formBarcode} onChange={(e) => setFormBarcode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} placeholder="Scan or enter product barcode" className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-emerald-800"
                  >
                    {categories
                      .filter((c) => c !== 'All')
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="packets, pouch, kg"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!editingProduct && <div>
                  <label className="block font-bold text-gray-700 mb-1">Opening Stock</label>
                  <input type="number" min="0" step="0.001" value={formStock} onChange={(e) => setFormStock(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800" />
                </div>}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Cost Price (₹)</label>
                  <input type="number" step="0.01" min="0" value={formCP} onChange={(e) => setFormCP(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Selling Price (₹)</label>
                  <input type="number" step="0.01" min="0" value={formSP} onChange={(e) => setFormSP(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Low-Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Distributor / Supplier</label>
                  <input
                    type="text"
                    value={formDistributor}
                    onChange={(e) => setFormDistributor(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-3.5 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-xs font-bold cursor-pointer shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
