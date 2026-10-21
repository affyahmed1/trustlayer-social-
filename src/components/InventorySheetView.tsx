import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem, InventoryMovement } from '../types/inventory';
import {
  Package,
  Search,
  History,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react';

export const InventorySheetView: React.FC = () => {
  const {
    inventoryItems,
    inventoryMovements,
    adjustStock,
    activeProfile,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedProductMovements, setSelectedProductMovements] = useState<{
    item: InventoryItem;
    movements: InventoryMovement[];
  } | null>(null);

  // Controlled Adjustment Modal State
  const [adjustmentItem, setAdjustmentItem] = useState<InventoryItem | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  // Inventory items owned by the current business profile
  const businessItems = useMemo(() => {
    return inventoryItems.filter(
      item =>
        item.businessUsername === activeProfile.username ||
        item.businessId === activeProfile.id
    );
  }, [inventoryItems, activeProfile.username, activeProfile.id]);

  // Brands associated exclusively with the current business's products
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    businessItems.forEach(item => {
      const b = (item.brand || '').trim();
      if (b) {
        brandsSet.add(b);
      }
    });
    return Array.from(brandsSet).sort((a, b) => a.localeCompare(b));
  }, [businessItems]);

  // Combined Search and Brand filtering
  const filteredItems = useMemo(() => {
    return businessItems.filter(item => {
      // Brand filter
      if (selectedBrand !== 'all') {
        const itemBrand = (item.brand || '').trim().toLowerCase();
        if (itemBrand !== selectedBrand.toLowerCase()) {
          return false;
        }
      }

      // Search query (case-insensitive across Product Name, SKU, and Brand)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const brand = (item.brand || '').toLowerCase();
        const matches =
          item.productName.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          brand.includes(q);
        if (!matches) {
          return false;
        }
      }

      return true;
    });
  }, [businessItems, selectedBrand, searchQuery]);

  // Summary metrics for the filtered view
  const totalStockUnits = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + item.currentStock, 0);
  }, [filteredItems]);

  const totalPurchasesUnits = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + item.totalApprovedPurchases, 0);
  }, [filteredItems]);

  const totalSalesUnits = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + item.totalApprovedSales, 0);
  }, [filteredItems]);

  const handleOpenMovements = (item: InventoryItem) => {
    const movements = inventoryMovements.filter(
      m =>
        m.productId === item.productId &&
        (m.businessUsername === activeProfile.username ||
          m.businessId === activeProfile.id)
    );
    setSelectedProductMovements({ item, movements });
  };

  const handleApplyAdjustment = () => {
    if (!adjustmentItem || adjustmentDelta === 0 || !adjustmentReason.trim()) return;

    adjustStock(
      adjustmentItem.productId,
      adjustmentItem.businessId,
      adjustmentDelta,
      adjustmentReason.trim(),
      `${activeProfile.contactPerson} (${activeProfile.username})`
    );

    setAdjustmentItem(null);
    setAdjustmentDelta(0);
    setAdjustmentReason('');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── SPREADSHEET TOOLBAR: SEARCH, BRAND FILTER & STOCK TOTALS ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search Bar & Brand Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Product Name, SKU, or Brand..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <div className="relative min-w-[170px] shrink-0">
            <select
              id="brand-select"
              aria-label="Filter by Brand"
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Brands ({businessItems.length})</option>
              {availableBrands.map(brand => {
                const count = businessItems.filter(
                  i => (i.brand || '').trim().toLowerCase() === brand.toLowerCase()
                ).length;
                return (
                  <option key={brand} value={brand}>
                    {brand} ({count})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Global Stock Quantities */}
        <div className="flex items-center space-x-2.5 text-xs shrink-0 self-end lg:self-auto">
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total In Stock</span>
            <span className="font-mono font-bold text-slate-900 text-xs">
              {totalStockUnits.toLocaleString()} units
            </span>
          </div>
          <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-right">
            <span className="text-[10px] uppercase font-semibold text-emerald-600 block">Purchases</span>
            <span className="font-mono font-bold text-emerald-800 text-xs">
              +{totalPurchasesUnits.toLocaleString()}
            </span>
          </div>
          <div className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 text-right">
            <span className="text-[10px] uppercase font-semibold text-blue-600 block">Sales</span>
            <span className="font-mono font-bold text-blue-800 text-xs">
              -{totalSalesUnits.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── SPREADSHEET-STYLE INVENTORY TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">No.</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4 text-right">Opening Stock</th>
                <th className="py-3 px-4 text-right text-emerald-700">Purchases</th>
                <th className="py-3 px-4 text-right text-blue-700">Sales</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Current Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  const currentStockValue =
                    item.openingStock +
                    item.totalApprovedPurchases -
                    item.totalApprovedSales +
                    (item.authorizedAdjustments || 0);

                  return (
                    <tr
                      key={item.productId}
                      onClick={() => handleOpenMovements(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      title="Click row to inspect immutable movement ledger & audit trail"
                    >
                      {/* 1. No. - Sequential dynamic numbering */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 group-hover:text-indigo-600 font-medium">
                        {index + 1}
                      </td>

                      {/* 2. SKU */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {item.sku}
                      </td>

                      {/* 3. Product */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.productName}
                      </td>

                      {/* 4. Brand */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {item.brand && item.brand.trim() ? (
                          item.brand
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Not Set
                          </span>
                        )}
                      </td>

                      {/* 5. Opening Stock */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                        {item.openingStock.toLocaleString()}
                      </td>

                      {/* 6. Purchases */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {item.totalApprovedPurchases.toLocaleString()}
                      </td>

                      {/* 7. Sales */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700">
                        {item.totalApprovedSales.toLocaleString()}
                      </td>

                      {/* 8. Current Stock */}
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                        {currentStockValue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No products found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      No products match your current search query or brand selection.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: APPEND-ONLY INVENTORY MOVEMENT LEDGER ── */}
      {selectedProductMovements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <span>Immutable Movement Ledger: {selectedProductMovements.item.productName}</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {selectedProductMovements.item.productId} &bull; SKU: {selectedProductMovements.item.sku} &bull; Brand: {selectedProductMovements.item.brand || 'Not Set'}
                </span>
              </div>
              <button
                onClick={() => setSelectedProductMovements(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 text-xs">
              {selectedProductMovements.movements.length > 0 ? (
                selectedProductMovements.movements.map(m => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            m.type === 'PURCHASE_RECEIPT'
                              ? 'bg-emerald-50 text-emerald-700'
                              : m.type === 'SALE_DISPATCH'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {m.type.replace('_', ' ')}
                        </span>
                        {m.referenceInvoiceNumber && (
                          <span className="font-mono text-slate-700 font-semibold">
                            Ref: {m.referenceInvoiceNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600">{m.notes}</p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(m.timestamp).toLocaleString()} &bull; Actor: {m.actor}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono font-bold text-sm ${
                          m.quantity > 0 ? 'text-emerald-700' : 'text-blue-700'
                        }`}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} units
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400">No movement events logged for this product.</div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const targetItem = selectedProductMovements.item;
                  setSelectedProductMovements(null);
                  setAdjustmentItem(targetItem);
                  setAdjustmentDelta(0);
                  setAdjustmentReason('');
                }}
                className="px-3 py-1.5 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 border border-indigo-200"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Authorize Stock Adjustment</span>
              </button>
              <button
                onClick={() => setSelectedProductMovements(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONTROLLED STOCK ADJUSTMENT ── */}
      {adjustmentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span>Authorized Stock Adjustment</span>
              </h3>
              <button
                onClick={() => setAdjustmentItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Product</span>
                <span className="font-bold text-slate-900 block mt-0.5">{adjustmentItem.productName}</span>
                <span className="font-mono text-slate-500 text-[11px]">Current Stock: {adjustmentItem.currentStock} units</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Adjustment Delta (Positive or Negative):
                </label>
                <input
                  type="number"
                  value={adjustmentDelta}
                  onChange={e => setAdjustmentDelta(parseInt(e.target.value) || 0)}
                  placeholder="e.g. +50 or -20"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  New calculated stock: {adjustmentItem.currentStock + adjustmentDelta} units
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Authorization Rationale (Mandatory Audit Note):
                </label>
                <textarea
                  rows={3}
                  value={adjustmentReason}
                  onChange={e => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Cycle count variance reconciliation approved by Warehouse Ops."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setAdjustmentItem(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyAdjustment}
                disabled={adjustmentDelta === 0 || !adjustmentReason.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Record Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
