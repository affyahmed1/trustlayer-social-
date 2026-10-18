import React, { useState, useMemo } from 'react';
import { NetworkNode, NetworkEdge, InventoryFlowItem } from '../utils/network';
import { Invoice, ActivityEvent } from '../types';
import { formatCurrency } from '../utils/finance';
import {
  X,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Lock,
  ArrowRight,
  Package,
  Layers,
  ExternalLink,
  CreditCard,
  Truck,
  Info,
  Clock,
  Filter,
  Search,
  Users,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface NetworkDetailsPanelProps {
  selectedNode: NetworkNode | null;
  selectedEdge: NetworkEdge | null;
  inventoryFlows: InventoryFlowItem[];
  invoices: Invoice[];
  activities: ActivityEvent[];
  onClose: () => void;
  onOpenInvoice: (invoice: Invoice) => void;
  onSelectNodeById: (nodeId: string) => void;
}

export const NetworkDetailsPanel: React.FC<NetworkDetailsPanelProps> = ({
  selectedNode,
  selectedEdge,
  inventoryFlows,
  invoices,
  activities,
  onClose,
  onOpenInvoice,
  onSelectNodeById,
}) => {
  // Navigation tabs for Node view
  const [activeTab, setActiveTab] = useState<
    'overview' | 'invoices' | 'transactions' | 'activity' | 'related' | 'inventory' | 'privacy'
  >('overview');

  // Filters for Node invoice history
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');

  // Filters for Edge connection history
  const [edgeStatusFilter, setEdgeStatusFilter] = useState<string>('all');
  const [edgeDateRange, setEdgeDateRange] = useState<string>('all');
  const [edgeVerificationFilter, setEdgeVerificationFilter] = useState<string>('all');

  // Filter invoices for selected node
  const nodeInvoices = useMemo(() => {
    if (!selectedNode) return [];
    return invoices.filter(inv => {
      const isRelated =
        inv.issuer?.username === selectedNode.username ||
        inv.buyer?.username === selectedNode.username ||
        inv.issuer?.name === selectedNode.name ||
        inv.buyer?.name === selectedNode.name;

      if (!isRelated) return false;

      // Status filter
      if (invoiceStatusFilter !== 'all' && inv.status !== invoiceStatusFilter) {
        return false;
      }

      // Search query
      if (invoiceSearch.trim()) {
        const q = invoiceSearch.toLowerCase();
        const ref = (inv.reference || '').toLowerCase();
        const num = (inv.invoiceNumber || '').toLowerCase();
        return ref.includes(q) || num.includes(q);
      }

      return true;
    });
  }, [selectedNode, invoices, invoiceStatusFilter, invoiceSearch]);

  // Filter activities for selected node
  const nodeActivities = useMemo(() => {
    if (!selectedNode) return [];
    const nameMatch = selectedNode.name.toLowerCase();
    const userMatch = selectedNode.username.toLowerCase();
    return activities.filter(act => {
      const details = (act.details || '').toLowerCase();
      const actor = (act.actor || '').toLowerCase();
      const entity = (act.entityName || '').toLowerCase();
      return (
        details.includes(nameMatch) ||
        details.includes(userMatch) ||
        actor.includes(nameMatch) ||
        actor.includes(userMatch) ||
        entity.includes(nameMatch) ||
        entity.includes(userMatch)
      );
    });
  }, [selectedNode, activities]);

  // Filter invoices for selected edge
  const edgeFilteredInvoices = useMemo(() => {
    if (!selectedEdge) return [];
    return selectedEdge.invoices.filter(inv => {
      // Status filter
      if (edgeStatusFilter !== 'all' && inv.status !== edgeStatusFilter) {
        return false;
      }

      // Verification filter
      if (edgeVerificationFilter !== 'all') {
        const isVer = inv.verificationStatus === 'verified';
        if (edgeVerificationFilter === 'verified' && !isVer) return false;
        if (edgeVerificationFilter === 'unverified' && isVer) return false;
      }

      // Date range filter
      if (edgeDateRange !== 'all' && inv.issueDate) {
        const invTime = new Date(inv.issueDate).getTime();
        const now = new Date('2026-10-18').getTime();
        const diffDays = (now - invTime) / (1000 * 3600 * 24);

        if (edgeDateRange === '30' && diffDays > 30) return false;
        if (edgeDateRange === '90' && diffDays > 90) return false;
      }

      return true;
    });
  }, [selectedEdge, edgeStatusFilter, edgeVerificationFilter, edgeDateRange]);

  if (!selectedNode && !selectedEdge) return null;

  return (
    <aside className="w-96 bg-white border-l border-slate-200/90 shadow-xl flex flex-col h-full shrink-0 z-30 select-none overflow-hidden text-xs">
      {/* Panel Top Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0">
          {selectedNode ? (
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {selectedNode.name.charAt(0)}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ArrowRight className="w-4 h-4 text-indigo-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-900 block truncate text-xs">
              {selectedNode ? selectedNode.name : 'Commercial Relationship'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono truncate block">
              {selectedNode ? selectedNode.trustlayerId : selectedEdge?.relationshipType}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs for Node View (Milestone 4 Sections) */}
      {selectedNode && (
        <div className="flex border-b border-slate-100 bg-white text-[11px] font-semibold text-slate-600 shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: '1. Overview' },
            { id: 'transactions', label: '2. Summary' },
            { id: 'invoices', label: `3. Invoices (${selectedNode.stats.invoiceCount})` },
            { id: 'activity', label: '4. Activity' },
            { id: 'related', label: '5. Network' },
            { id: 'inventory', label: '6. Line Items' },
            { id: 'privacy', label: '7. Access' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2.5 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700 font-bold bg-indigo-50/40'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ======================================================== */}
        {/* CASE 1: NODE / BUSINESS SELECTED                          */}
        {/* ======================================================== */}
        {selectedNode && (
          <>
            {/* SECTION 1: BUSINESS OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Identification Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Network Tier
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white font-mono">
                      {selectedNode.tier === 0 ? 'TIER 0 (FOCAL)' : `TIER ${selectedNode.tier}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600 font-medium">Business Role</span>
                    <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {selectedNode.businessType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">TrustLayer ID</span>
                    <span className="font-mono text-slate-800 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                      {selectedNode.trustlayerId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Relationship Status</span>
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                      {selectedNode.tier === 0
                        ? 'Focal Organization'
                        : selectedNode.isDirectConnection
                        ? 'Direct Counterparty'
                        : 'Tier-2 Extended Partner'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Identity Verification</span>
                    {selectedNode.verified ? (
                      <span className="inline-flex items-center text-emerald-600 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        TrustLayer Verified
                      </span>
                    ) : (
                      <span className="text-slate-400">Unverified</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Jurisdiction</span>
                    <span className="text-slate-800 font-semibold">{selectedNode.country}</span>
                  </div>
                </div>

                {/* Transaction Date Bounds */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Documented Transaction Timeline
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">First Recorded</span>
                      <span className="font-semibold text-slate-800">
                        {selectedNode.firstTransactionDate || 'None recorded'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Most Recent</span>
                      <span className="font-semibold text-slate-800">
                        {selectedNode.lastTransactionDate || 'None recorded'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connection Details Section */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Connection Details & Address
                  </span>
                  {selectedNode.isAuthorized ? (
                    <div className="space-y-1.5 text-[11px] text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Contact:</span>
                        <span className="font-semibold">{selectedNode.entity.contactPerson || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-mono">{selectedNode.entity.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Address:</span>
                        <span className="text-right max-w-[200px] truncate">{selectedNode.entity.address || 'N/A'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Contact details restricted under least-privilege policy.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 2: TRANSACTION SUMMARY (Grouped by Currency) */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                {/* Volumes Grouped by Currency - Never mix currencies! */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Documented Commercial Volume
                  </span>

                  {/* Sales by Currency */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block mb-1">
                      Total Documented Sales (Outward)
                    </span>
                    {Object.keys(selectedNode.stats.salesByCurrency).length > 0 ? (
                      Object.entries(selectedNode.stats.salesByCurrency).map(([curr, val]) => (
                        <div key={curr} className="flex justify-between items-baseline py-1 border-b border-slate-200/50">
                          <span className="font-mono text-slate-500 text-xs">{curr}</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {formatCurrency(val, curr)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No sales recorded</span>
                    )}
                  </div>

                  {/* Purchases by Currency */}
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-1">
                      Total Documented Purchases (Inward)
                    </span>
                    {Object.keys(selectedNode.stats.purchasesByCurrency).length > 0 ? (
                      Object.entries(selectedNode.stats.purchasesByCurrency).map(([curr, val]) => (
                        <div key={curr} className="flex justify-between items-baseline py-1 border-b border-slate-200/50">
                          <span className="font-mono text-slate-500 text-xs">{curr}</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {formatCurrency(val, curr)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No procurement recorded</span>
                    )}
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Invoice Status Breakdown ({selectedNode.stats.invoiceCount} Total)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                      <span className="text-emerald-700 font-semibold block">Paid Invoices</span>
                      <span className="font-mono font-bold text-emerald-900 text-sm">
                        {selectedNode.stats.paidCount}
                      </span>
                    </div>
                    <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-lg">
                      <span className="text-blue-700 font-semibold block">Pending / Unpaid</span>
                      <span className="font-mono font-bold text-blue-900 text-sm">
                        {selectedNode.stats.unpaidCount}
                      </span>
                    </div>
                    <div className="p-2.5 bg-rose-50/60 border border-rose-200 rounded-lg">
                      <span className="text-rose-700 font-semibold block">Overdue Invoices</span>
                      <span className="font-mono font-bold text-rose-900 text-sm">
                        {selectedNode.stats.overdueCount}
                      </span>
                    </div>
                    <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg">
                      <span className="text-amber-700 font-semibold block">Disputed / Rejected</span>
                      <span className="font-mono font-bold text-amber-900 text-sm">
                        {selectedNode.stats.disputedCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Line Item Quantities */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Documented Physical Quantities
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Units Purchased</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {selectedNode.stats.totalQuantityPurchased} units
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Units Sold</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {selectedNode.stats.totalQuantitySold} units
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: INVOICE HISTORY (Filterable) */}
            {activeTab === 'invoices' && (
              <div className="space-y-3">
                {/* Search & Filter Header */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter invoices by reference..."
                      value={invoiceSearch}
                      onChange={e => setInvoiceSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex space-x-1 overflow-x-auto pb-1 text-[10px]">
                    {['all', 'paid', 'registered', 'pending_review', 'overdue', 'rejected'].map(st => (
                      <button
                        key={st}
                        onClick={() => setInvoiceStatusFilter(st)}
                        className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                          invoiceStatusFilter === st
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Invoices List */}
                {nodeInvoices.length > 0 ? (
                  <div className="space-y-2">
                    {nodeInvoices.map(inv => (
                      <div
                        key={inv.id}
                        onClick={() => onOpenInvoice(inv)}
                        className="p-3 bg-white hover:bg-indigo-50/40 rounded-xl border border-slate-200 hover:border-indigo-400 cursor-pointer transition-all space-y-1.5 group shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900 flex items-center space-x-1">
                            <span>{inv.reference || inv.invoiceNumber}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                          </span>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              inv.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'overdue'
                                ? 'bg-rose-100 text-rose-800'
                                : inv.status === 'rejected'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {inv.status?.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">{inv.issueDate}</span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(inv.financials?.total || 0, inv.currency || 'USD')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 space-y-1">
                    <FileText className="w-6 h-6 mx-auto text-slate-300" />
                    <p>No invoices match the selected filter criteria.</p>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: RECENT ACTIVITY */}
            {activeTab === 'activity' && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Documented Audit Trail ({nodeActivities.length} Events)
                </span>

                {nodeActivities.length > 0 ? (
                  <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                    {nodeActivities.map(act => (
                      <div key={act.id} className="relative pb-2 space-y-0.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 absolute -left-[17px] top-1" />
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-800 uppercase">{act.type.replace('_', ' ')}</span>
                          <span className="text-slate-400">{act.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{act.details}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 space-y-1">
                    <Clock className="w-6 h-6 mx-auto text-slate-300" />
                    <p>No logged activity events for this business.</p>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 5: RELATED BUSINESSES */}
            {activeTab === 'related' && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Direct Connected Businesses
                </span>

                {selectedNode.childrenIds && selectedNode.childrenIds.length > 0 ? (
                  <div className="space-y-2">
                    {selectedNode.childrenIds.map(childId => (
                      <button
                        key={childId}
                        onClick={() => onSelectNodeById(childId)}
                        className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left flex items-center justify-between text-slate-800 font-semibold transition-all group"
                      >
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                          <span className="truncate">{childId}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 space-y-1">
                    <Users className="w-6 h-6 mx-auto text-slate-300" />
                    <p>No direct downstream counterparties linked to this node.</p>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 6: INVENTORY RECONCILIATION */}
            {activeTab === 'inventory' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>Documented Line-Item Inventory</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Calculated strictly from registered commercial invoices. Does not represent unverified physical count.
                </p>

                <div className="space-y-2.5">
                  {inventoryFlows.length > 0 ? (
                    inventoryFlows.map(flow => (
                      <div
                        key={flow.sku}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{flow.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{flow.sku}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Purchased</span>
                            <span className="font-mono font-semibold text-slate-800">
                              {flow.quantityPurchased} {flow.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Sold</span>
                            <span className="font-mono font-semibold text-slate-800">
                              {flow.quantitySold} {flow.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Doc. Balance</span>
                            <span
                              className={`font-mono font-bold ${
                                flow.estimatedBalance < 0 ? 'text-amber-600' : 'text-emerald-700'
                              }`}
                            >
                              {flow.estimatedBalance} {flow.unit}
                            </span>
                          </div>
                        </div>

                        {flow.hasDiscrepancy && (
                          <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[10px] flex items-start space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                            <span>{flow.reviewNotice}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400">
                      No line item product data recorded.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 7: ACCESS & PRIVACY CONTROLS */}
            {activeTab === 'privacy' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>Least-Privilege Access Control</span>
                </div>

                <div
                  className={`p-3 rounded-xl border text-[11px] space-y-2 ${
                    selectedNode.isAuthorized
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="font-bold">
                    {selectedNode.isAuthorized
                      ? 'Direct Authorized Relationship'
                      : 'Masked Tier-2 Secondary Node'}
                  </div>
                  <p className="leading-relaxed">
                    {selectedNode.isAuthorized
                      ? 'Full commercial records, contacts, and invoice line items are authorized for exchange under mutual trade agreement.'
                      : 'Least-privilege policy active: Private contacts, tax details, and upstream supplier relationships are confidential to protect business relationships.'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-600 text-[11px]">
                  <span className="font-bold text-slate-800 block">Confidentiality Safeguards</span>
                  <p className="leading-relaxed">
                    In enterprise TrustLayer deployments, non-direct counterparty identities are segregated. Downstream brands can verify upstream origin compliance without exposing sensitive wholesale pricing or component supplier commercial terms.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* CASE 2: EDGE / CONNECTION SELECTED (Milestone 5)          */}
        {/* ======================================================== */}
        {selectedEdge && (
          <div className="space-y-4">
            {/* Commercial Relationship Summary */}
            <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">
                Commercial Relationship
              </span>
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                <span className="truncate">{selectedEdge.sourceName}</span>
                <ArrowRight className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">{selectedEdge.targetName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block text-[10px] font-semibold text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  {selectedEdge.relationshipType}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {selectedEdge.isDirect ? 'Direct Relationship' : 'Tier-2 Extended'}
                </span>
              </div>
            </div>

            {/* Verification Status Badges */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-emerald-700 font-semibold block text-[10px]">Data Integrity</span>
                <span className="inline-flex items-center font-bold text-emerald-900 text-xs mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  SHA-256 Verified
                </span>
              </div>
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-blue-700 font-semibold block text-[10px]">Issuer Identity</span>
                <span className="inline-flex items-center font-bold text-blue-900 text-xs mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Verified Registry
                </span>
              </div>
            </div>

            {/* Commercial Metrics */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Documented Invoices</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {selectedEdge.invoiceCount}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Units Transacted</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {selectedEdge.totalQuantity}
                </span>
              </div>
            </div>

            {/* Documented Volume (By Currency - Never combine!) */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Total Documented Volume
              </span>
              {Object.entries(selectedEdge.totalsByCurrency).map(([curr, val]) => (
                <div key={curr} className="flex justify-between items-baseline">
                  <span className="font-mono text-slate-500 text-xs">{curr}</span>
                  <span className="font-mono font-bold text-slate-900 text-base">
                    {formatCurrency(val, curr)}
                  </span>
                </div>
              ))}
            </div>

            {/* Dates */}
            <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex justify-between">
                <span>First Transaction:</span>
                <span className="font-semibold text-slate-800">{selectedEdge.firstTransactionDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Latest Transaction:</span>
                <span className="font-semibold text-slate-800">{selectedEdge.lastTransactionDate}</span>
              </div>
            </div>

            {/* Interactive Filters for Connection Invoices (Milestone 5 Requirement) */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Filter Related Invoices ({edgeFilteredInvoices.length})
              </span>

              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {/* Status Filter */}
                <select
                  value={edgeStatusFilter}
                  onChange={e => setEdgeStatusFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="registered">Registered</option>
                  <option value="pending_review">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="rejected">Disputed</option>
                </select>

                {/* Date Range */}
                <select
                  value={edgeDateRange}
                  onChange={e => setEdgeDateRange(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-700"
                >
                  <option value="all">All Time</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>

                {/* Verification */}
                <select
                  value={edgeVerificationFilter}
                  onChange={e => setEdgeVerificationFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-700"
                >
                  <option value="all">All Records</option>
                  <option value="verified">Verified Only</option>
                  <option value="unverified">Unverified Only</option>
                </select>
              </div>

              {/* Invoices List */}
              <div className="space-y-2 pt-1">
                {edgeFilteredInvoices.length > 0 ? (
                  edgeFilteredInvoices.map((inv, idx) => (
                    <div
                      key={inv.id || idx}
                      onClick={() => onOpenInvoice(inv)}
                      className="p-3 bg-white hover:bg-indigo-50/40 rounded-xl border border-slate-200 hover:border-indigo-400 cursor-pointer transition-all space-y-1.5 group shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 flex items-center space-x-1">
                          <span>{inv.reference || inv.invoiceNumber}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : inv.status === 'rejected'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.status?.replace('_', ' ') || 'ACTIVE'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">{inv.issueDate}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(inv.financials?.total || 0, inv.currency || 'USD')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400">
                    No invoices match the selected connection filter.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
