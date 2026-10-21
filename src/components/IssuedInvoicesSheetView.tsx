import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { IssuedInvoiceRecord, InvoiceDocumentAttachment } from '../types/inventory';
import { formatCurrency } from '../utils/finance';
import { InvoiceSheetDetailModal } from './InvoiceSheetDetailModal';
import { InvoiceUploadModal } from './InvoiceUploadModal';
import {
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Eye,
  X,
  CreditCard,
  UploadCloud,
  FileCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Ban,
  FileText,
} from 'lucide-react';

export const IssuedInvoicesSheetView: React.FC = () => {
  const {
    issuedInvoices,
    approveIssuedInvoice,
    rejectInvoiceRecord,
    reverseInvoiceRecord,
    runIntelligenceCheck,
    attachDocumentToInvoice,
    activeProfile,
  } = useApp();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('all');
  const [productNameFilter, setProductNameFilter] = useState('all');
  const [skuFilter, setSkuFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals State
  const [inspectInvoice, setInspectInvoice] = useState<IssuedInvoiceRecord | null>(null);
  const [uploadTargetInvoice, setUploadTargetInvoice] = useState<IssuedInvoiceRecord | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Rejection & Reversal State
  const [rejectingInvoice, setRejectingInvoice] = useState<IssuedInvoiceRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reversingInvoice, setReversingInvoice] = useState<IssuedInvoiceRecord | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Notification Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reset pagination when any filter changes
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPaymentFilter('all');
    setDecisionFilter('all');
    setVerificationFilter('all');
    setStartDate('');
    setEndDate('');
    setBuyerFilter('all');
    setProductNameFilter('all');
    setSkuFilter('all');
    setCurrentPage(1);
  };

  // Base list belonging to active entity as issuer
  const myIssuedInvoices = useMemo(() => {
    return issuedInvoices.filter(
      inv =>
        inv.issuingBusinessUsername === activeProfile.username ||
        inv.issuingBusinessId === activeProfile.id
    );
  }, [issuedInvoices, activeProfile.username, activeProfile.id]);

  // Dynamic filter dropdown options
  const uniqueBuyers = useMemo(() => {
    const map = new Map<string, string>();
    myIssuedInvoices.forEach(i => map.set(i.buyerBusinessId, i.buyerBusinessName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [myIssuedInvoices]);

  const uniqueProductNames = useMemo(() => {
    const set = new Set<string>();
    myIssuedInvoices.forEach(i => set.add(i.productName));
    return Array.from(set);
  }, [myIssuedInvoices]);

  const uniqueSkus = useMemo(() => {
    const set = new Set<string>();
    myIssuedInvoices.forEach(i => set.add(i.sku));
    return Array.from(set);
  }, [myIssuedInvoices]);

  // Filtered dataset
  const filteredInvoices = useMemo(() => {
    return myIssuedInvoices.filter(inv => {
      // Payment Status
      if (paymentFilter !== 'all' && inv.paymentStatus !== paymentFilter) return false;

      // Decision Status
      if (decisionFilter !== 'all' && inv.decisionStatus !== decisionFilter) return false;

      // Verification Status
      if (verificationFilter !== 'all' && inv.verificationStatus !== verificationFilter) return false;

      // Date Range
      if (startDate && inv.issueDate < startDate) return false;
      if (endDate && inv.issueDate > endDate) return false;

      // Buyer
      if (buyerFilter !== 'all' && inv.buyerBusinessId !== buyerFilter) return false;

      // Product Name
      if (productNameFilter !== 'all' && inv.productName !== productNameFilter) return false;

      // SKU
      if (skuFilter !== 'all' && inv.sku !== skuFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          inv.id.toLowerCase().includes(q) ||
          inv.originalInvoiceNumber.toLowerCase().includes(q) ||
          inv.buyerBusinessName.toLowerCase().includes(q) ||
          inv.productName.toLowerCase().includes(q) ||
          inv.sku.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [
    myIssuedInvoices,
    paymentFilter,
    decisionFilter,
    verificationFilter,
    startDate,
    endDate,
    buyerFilter,
    productNameFilter,
    skuFilter,
    searchQuery,
  ]);

  // Paginated Slice
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / rowsPerPage));
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredInvoices.slice(start, start + rowsPerPage);
  }, [filteredInvoices, currentPage, rowsPerPage]);

  const handleApprove = (invoiceId: string) => {
    const result = approveIssuedInvoice(
      invoiceId,
      `${activeProfile.contactPerson} (${activeProfile.username})`
    );
    if (result.error) {
      setNotification({ type: 'error', message: result.error });
    } else {
      setNotification({
        type: 'success',
        message: `Outgoing sales invoice approved! Inventory decreased by ${result.updatedInvoice?.quantitySold} units and movement ledger recorded.`,
      });
    }
  };

  const handleConfirmReject = () => {
    if (!rejectingInvoice || !rejectionReason.trim()) return;
    rejectInvoiceRecord(
      'issued',
      rejectingInvoice.id,
      rejectionReason.trim(),
      `${activeProfile.contactPerson} (${activeProfile.username})`
    );
    setNotification({
      type: 'success',
      message: `Invoice ${rejectingInvoice.originalInvoiceNumber} rejected. Stock was not modified.`,
    });
    setRejectingInvoice(null);
    setRejectionReason('');
  };

  const handleConfirmReversal = () => {
    if (!reversingInvoice || !reversalReason.trim()) return;
    reverseInvoiceRecord(
      'issued',
      reversingInvoice.id,
      reversalReason.trim(),
      `${activeProfile.contactPerson} (${activeProfile.username})`
    );
    setNotification({
      type: 'success',
      message: `Invoice ${reversingInvoice.originalInvoiceNumber} reversed. Compensating return inward recorded and inventory restored.`,
    });
    setReversingInvoice(null);
    setReversalReason('');
  };

  const getStatusBadge = (status: string, category: 'payment' | 'decision' | 'verification') => {
    if (category === 'payment') {
      switch (status) {
        case 'Paid':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'Unpaid':
          return 'bg-slate-100 text-slate-700 border-slate-200';
        case 'Payment Pending':
          return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Partially Paid':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Refunded':
          return 'bg-purple-50 text-purple-700 border-purple-200';
        default:
          return 'bg-slate-100 text-slate-700 border-slate-200';
      }
    }
    if (category === 'decision') {
      switch (status) {
        case 'Approved':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'Pending':
          return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Rejected':
          return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'Reversed':
          return 'bg-purple-50 text-purple-700 border-purple-200';
        default:
          return 'bg-slate-100 text-slate-700 border-slate-200';
      }
    }
    // verification
    switch (status) {
      case 'Consistent':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Inconsistency Detected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Insufficient Evidence':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Verification Pending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Investigation':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── HEADER & KPI ACTION STRIP ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Sheet B
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Issued Invoices (Sales)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated sales table storing permanent records of outgoing customer invoices.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              setUploadTargetInvoice(null);
              setIsUploadModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all active:scale-98"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Invoice</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* ── INDEPENDENT SEARCH & COMBINABLE FILTERS MATRIX ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Row 1: Search & Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Invoice No, Buyer, Product..."
              value={searchQuery}
              onChange={e => handleFilterChange(setSearchQuery, e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Buyer Entity Dropdown */}
          <div>
            <select
              value={buyerFilter}
              onChange={e => handleFilterChange(setBuyerFilter, e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-700"
            >
              <option value="all">All Buyers ({uniqueBuyers.length})</option>
              {uniqueBuyers.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range: Start Date */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => handleFilterChange(setStartDate, e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-700"
            />
          </div>

          {/* Date Range: End Date */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => handleFilterChange(setEndDate, e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-700"
            />
          </div>
        </div>

        {/* Row 2: Status & Product Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Payment Status Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Payment</label>
            <select
              value={paymentFilter}
              onChange={e => handleFilterChange(setPaymentFilter, e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700"
            >
              <option value="all">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Payment Pending">Payment Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          {/* Decision Status Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Decision</label>
            <select
              value={decisionFilter}
              onChange={e => handleFilterChange(setDecisionFilter, e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700"
            >
              <option value="all">All Decisions</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Reversed">Reversed</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Verification</label>
            <select
              value={verificationFilter}
              onChange={e => handleFilterChange(setVerificationFilter, e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700"
            >
              <option value="all">All Verification</option>
              <option value="Not Checked">Not Checked</option>
              <option value="Verification Pending">Verification Pending</option>
              <option value="Consistent">Consistent</option>
              <option value="Inconsistency Detected">Inconsistency Detected</option>
              <option value="Insufficient Evidence">Insufficient Evidence</option>
              <option value="Under Investigation">Under Investigation</option>
            </select>
          </div>

          {/* Product Name Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Product Name</label>
            <select
              value={productNameFilter}
              onChange={e => handleFilterChange(setProductNameFilter, e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700"
            >
              <option value="all">All Products</option>
              {uniqueProductNames.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* SKU Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">SKU</label>
            <select
              value={skuFilter}
              onChange={e => handleFilterChange(setSkuFilter, e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700"
            >
              <option value="all">All SKUs</option>
              {uniqueSkus.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-1.5 px-3 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── DEDICATED SALES TABLE (Exact 11 Columns) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                {/* 1. Invoice No. */}
                <th className="py-3 px-4 whitespace-nowrap">1. Invoice No.</th>
                {/* 2. Issue Date */}
                <th className="py-3 px-4 whitespace-nowrap">2. Issue Date</th>
                {/* 3. Buyer Entity */}
                <th className="py-3 px-4 whitespace-nowrap">3. Buyer Entity</th>
                {/* 4. Product Name */}
                <th className="py-3 px-4 whitespace-nowrap">4. Product Name</th>
                {/* 5. SKU */}
                <th className="py-3 px-4 whitespace-nowrap">5. SKU</th>
                {/* 6. Quantity Sold */}
                <th className="py-3 px-4 whitespace-nowrap text-right">6. Quantity Sold</th>
                {/* 7. Total Amount */}
                <th className="py-3 px-4 whitespace-nowrap text-right">7. Total Amount</th>
                {/* 8. Payment Status */}
                <th className="py-3 px-4 whitespace-nowrap">8. Payment</th>
                {/* 9. Decision Status */}
                <th className="py-3 px-4 whitespace-nowrap">9. Decision</th>
                {/* 10. Verification Status */}
                <th className="py-3 px-4 whitespace-nowrap">10. Verification</th>
                {/* 11. Actions */}
                <th className="py-3 px-4 whitespace-nowrap text-center">11. Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 1. Clickable Invoice Number */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setInspectInvoice(inv)}
                        className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-1"
                        title="Click to view deep invoice details, document, and reconciliation"
                      >
                        <span>{inv.originalInvoiceNumber}</span>
                        {inv.documentAttachment && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Document attached" />
                        )}
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono block">{inv.id}</span>
                    </td>

                    {/* 2. Issue Date */}
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {inv.issueDate}
                    </td>

                    {/* 3. Buyer Entity */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{inv.buyerBusinessName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.buyerBusinessUsername}</div>
                    </td>

                    {/* 4. Product Name */}
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {inv.productName}
                    </td>

                    {/* 5. SKU */}
                    <td className="py-3 px-4 font-mono text-indigo-700 whitespace-nowrap font-semibold">
                      {inv.sku}
                    </td>

                    {/* 6. Quantity Sold */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right whitespace-nowrap">
                      {inv.quantitySold.toLocaleString()} {inv.unitOfMeasure}
                    </td>

                    {/* 7. Total Amount */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right whitespace-nowrap">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </td>

                    {/* 8. Payment Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(
                          inv.paymentStatus,
                          'payment'
                        )}`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>

                    {/* 9. Decision Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(
                          inv.decisionStatus,
                          'decision'
                        )}`}
                      >
                        {inv.decisionStatus}
                      </span>
                    </td>

                    {/* 10. Verification Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(
                          inv.verificationStatus,
                          'verification'
                        )}`}
                      >
                        {inv.verificationStatus}
                      </span>
                    </td>

                    {/* 11. Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Inspect Details */}
                        <button
                          onClick={() => setInspectInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Attach/View Upload */}
                        <button
                          onClick={() => {
                            setUploadTargetInvoice(inv);
                            setIsUploadModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title={inv.documentAttachment ? 'Replace Document' : 'Upload Document'}
                        >
                          <FileCheck className={`w-4 h-4 ${inv.documentAttachment ? 'text-emerald-600' : ''}`} />
                        </button>

                        {/* Run Intelligence Check */}
                        <button
                          onClick={() => runIntelligenceCheck(inv.id, 'issued')}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Run Recursive Supply-Chain Intelligence"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        {/* Approve Button */}
                        {inv.decisionStatus === 'Pending' && (
                          <button
                            onClick={() => handleApprove(inv.id)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] shadow-2xs transition-colors"
                          >
                            Approve
                          </button>
                        )}

                        {/* Reject Button */}
                        {inv.decisionStatus === 'Pending' && (
                          <button
                            onClick={() => setRejectingInvoice(inv)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-[10px] transition-colors"
                          >
                            Reject
                          </button>
                        )}

                        {/* Reversal Button */}
                        {inv.decisionStatus === 'Approved' && (
                          <button
                            onClick={() => setReversingInvoice(inv)}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-lg text-[10px] transition-colors"
                            title="Reverse approved sale"
                          >
                            Reverse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-600">No issued invoices match the active filters.</p>
                      <p className="text-[11px]">Try clearing search parameters or adjusting date ranges.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS ── */}
        <div className="p-3.5 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={e => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-slate-500">
              Showing {filteredInvoices.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–
              {Math.min(currentPage * rowsPerPage, filteredInvoices.length)} of {filteredInvoices.length} records
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {/* 1. Deep Invoice Details Modal */}
      <InvoiceSheetDetailModal
        invoice={inspectInvoice}
        type="issued"
        isOpen={Boolean(inspectInvoice)}
        onClose={() => setInspectInvoice(null)}
        onOpenUpload={inv => {
          setInspectInvoice(null);
          setUploadTargetInvoice(inv as IssuedInvoiceRecord);
          setIsUploadModalOpen(true);
        }}
      />

      {/* 2. Upload Invoice Modal */}
      <InvoiceUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadTargetInvoice(null);
        }}
        targetInvoice={uploadTargetInvoice}
        sheetType="issued"
        availableInvoices={myIssuedInvoices}
        onSaveAttachment={(type, id, doc) => {
          attachDocumentToInvoice(type, id, doc);
          setNotification({
            type: 'success',
            message: `Document ${doc.fileName} successfully attached to transaction ${id}.`,
          });
        }}
      />

      {/* 3. Rejection Modal */}
      {rejectingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                Reject Sales Dispatch
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Reject Invoice {rejectingInvoice.originalInvoiceNumber}
              </h3>
              <p className="text-xs text-slate-500">
                Formal rejection stops the sale from deducting warehouse inventory.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700 block">Rejection Audit Reason (Required):</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Customer cancelled purchase order, credit check failure..."
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-rose-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 text-xs pt-2">
              <button
                onClick={() => setRejectingInvoice(null)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Reversal Modal */}
      {reversingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                Controlled Reversal Workflow
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Reverse Invoice {reversingInvoice.originalInvoiceNumber}
              </h3>
              <p className="text-xs text-slate-500">
                Appends a compensating RETURN INWARD movement to the ledger and restores warehouse inventory.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700 block">Reversal Reason (Required):</label>
              <textarea
                rows={3}
                value={reversalReason}
                onChange={e => setReversalReason(e.target.value)}
                placeholder="e.g. Customer returned shipment, amended invoice issued, RMA return..."
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 text-xs pt-2">
              <button
                onClick={() => setReversingInvoice(null)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReversal}
                disabled={!reversalReason.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
