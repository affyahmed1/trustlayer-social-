import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem, InventoryMovement } from '../types/inventory';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  History,
  SlidersHorizontal,
  X,
  FileText,
  Clock,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export const InventorySheetView: React.FC = () => {
  const {
    inventoryItems,
    inventoryMovements,
    adjustStock,
    activeProfile,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'investigation_required'>('all');
  const [selectedProductMovements, setSelectedProductMovements] = useState<{
    item: InventoryItem;
    movements: InventoryMovement[];
  } | null>(null);

  // Controlled Adjustment Modal State
  const [adjustmentItem, setAdjustmentItem] = useState<InventoryItem | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  // Filter inventory items for the active business
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      // Must belong to current profile (or match fallback)
      const belongs = item.businessUsername === activeProfile.username || item.businessId === activeProfile.id;
      if (!belongs) return false;

      // Status filter
      if (statusFilter !== 'all' && item.stockVerificationStatus !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.productName.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.productId.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [inventoryItems, activeProfile.username, activeProfile.id, statusFilter, searchQuery]);

  // Overall metrics
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
      m => m.productId === item.productId && (m.businessUsername === activeProfile.username || m.businessId === activeProfile.id)
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER & KPI STRIP ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Sheet A
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Product Inventory Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            One current record per product with immutable append-only provenance tracking.
          </p>
        </div>

        {/* Global Stock Stats */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total In Stock</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{totalStockUnits.toLocaleString()} units</span>
          </div>
          <div className="bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 text-right">
            <span className="text-[10px] uppercase font-semibold text-emerald-600 block">Approved Purchases</span>
            <span className="font-mono font-bold text-emerald-800 text-sm">+{totalPurchasesUnits.toLocaleString()}</span>
          </div>
          <div className="bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 text-right">
            <span className="text-[10px] uppercase font-semibold text-blue-600 block">Approved Sales</span>
            <span className="font-mono font-bold text-blue-800 text-sm">-{totalSalesUnits.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product, SKU, or brand..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 shadow-2xs"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-semibold">
            {(['all', 'verified', 'unverified', 'investigation_required'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-lg capitalize transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── SHEET A: SPREADSHEET-STYLE INVENTORY TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4 text-right">Opening Stock</th>
                <th className="py-3 px-4 text-right text-emerald-700">Approved Purchases (+)</th>
                <th className="py-3 px-4 text-right text-blue-700">Approved Sales (-)</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Current Stock</th>
                <th className="py-3 px-4 text-center">Verification Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr key={item.productId} className="hover:bg-slate-50/60 transition-colors">
                    {/* SKU */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {item.sku}
                    </td>

                    {/* Product Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.productName}
                    </td>

                    {/* Brand */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                        {item.brand}
                      </span>
                    </td>

                    {/* Opening Stock */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className="font-bold text-slate-700">{item.openingStock.toLocaleString()}</span>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px] ml-auto" title={item.openingStockSource}>
                        {item.openingStockVerified ? '✓ Verified Audit' : '⚠ Intake Declared'}
                      </div>
                    </td>

                    {/* Total Approved Purchases */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      +{item.totalApprovedPurchases.toLocaleString()}
                    </td>

                    {/* Total Approved Sales */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700">
                      -{item.totalApprovedSales.toLocaleString()}
                    </td>

                    {/* Current Stock */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="text-sm font-extrabold text-slate-900">
                        {item.currentStock.toLocaleString()} {item.unit}
                      </div>
                      {item.authorizedAdjustments !== 0 && (
                        <div className="text-[10px] text-amber-600 font-semibold">
                          Adj: {item.authorizedAdjustments > 0 ? `+${item.authorizedAdjustments}` : item.authorizedAdjustments}
                        </div>
                      )}
                    </td>

                    {/* Verification Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          item.stockVerificationStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.stockVerificationStatus === 'unverified'
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.stockVerificationStatus === 'verified' && <ShieldCheck className="w-3 h-3 mr-1" />}
                        {item.stockVerificationStatus.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="py-3.5 px-4 text-[11px] font-mono text-slate-500">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenMovements(item)}
                          className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1"
                          title="View Append-Only Movement Ledger"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Ledger</span>
                        </button>

                        <button
                          onClick={() => {
                            setAdjustmentItem(item);
                            setAdjustmentDelta(0);
                            setAdjustmentReason('');
                          }}
                          className="px-2.5 py-1 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1"
                          title="Controlled Stock Adjustment"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No inventory records found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search criteria or status filter.</p>
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
                  {selectedProductMovements.item.productId} &bull; SKU: {selectedProductMovements.item.sku}
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

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedProductMovements(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
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
