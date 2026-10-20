import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { IssuedInvoiceRecord } from '../types/inventory';
import { formatCurrency } from '../utils/finance';
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
  RotateCcw,
  Eye,
  X,
} from 'lucide-react';

export const IssuedInvoicesSheetView: React.FC = () => {
  const {
    issuedInvoices,
    approveIssuedInvoice,
    rejectInvoiceRecord,
    reverseInvoiceRecord,
    runIntelligenceCheck,
    activeProfile,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Rejection Dialog State
  const [rejectingInvoice, setRejectingInvoice] = useState<IssuedInvoiceRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Reversal Dialog State
  const [reversingInvoice, setReversingInvoice] = useState<IssuedInvoiceRecord | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Feedback Notification Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredInvoices = useMemo(() => {
    return issuedInvoices.filter(inv => {
      // Must belong to active business as issuer
      const isIssuer =
        inv.issuingBusinessUsername === activeProfile.username ||
        inv.issuingBusinessId === activeProfile.id;
      if (!isIssuer) return false;

      // Product filter
      if (productFilter !== 'all' && inv.productId !== productFilter) return false;

      // Decision filter
      if (decisionFilter !== 'all' && inv.decisionStatus !== decisionFilter) return false;

      // Verification filter
      if (verificationFilter !== 'all' && inv.verificationStatus !== verificationFilter) return false;

      // Payment filter
      if (paymentFilter !== 'all' && inv.paymentStatus !== paymentFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          inv.id.toLowerCase().includes(q) ||
          inv.originalInvoiceNumber.toLowerCase().includes(q) ||
          inv.buyerBusinessName.toLowerCase().includes(q) ||
          inv.productName.toLowerCase().includes(q) ||
          inv.sku.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [issuedInvoices, activeProfile.username, activeProfile.id, productFilter, decisionFilter, verificationFilter, paymentFilter, searchQuery]);

  const uniqueProducts = useMemo(() => {
    const map = new Map<string, string>();
    issuedInvoices.forEach(i => map.set(i.productId, i.productName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [issuedInvoices]);

  const handleApprove = (invoiceId: string) => {
    const result = approveIssuedInvoice(invoiceId, `${activeProfile.contactPerson} (${activeProfile.username})`);
    if (result.error) {
      setNotification({ type: 'error', message: result.error });
    } else {
      setNotification({
        type: 'success',
        message: `Invoice approved! Stock decreased and recursive intelligence verification updated.`,
      });
    }
  };

  const handleConfirmReject = () => {
    if (!rejectingInvoice || !rejectionReason.trim()) return;
    rejectInvoiceRecord('issued', rejectingInvoice.id, rejectionReason.trim(), `${activeProfile.contactPerson} (${activeProfile.username})`);
    setRejectingInvoice(null);
    setRejectionReason('');
    setNotification({ type: 'success', message: 'Invoice transaction marked Rejected. Inventory remains untouched.' });
  };

  const handleConfirmReversal = () => {
    if (!reversingInvoice || !reversalReason.trim()) return;
    reverseInvoiceRecord('issued', reversingInvoice.id, reversalReason.trim(), `${activeProfile.contactPerson} (${activeProfile.username})`);
    setReversingInvoice(null);
    setReversalReason('');
    setNotification({ type: 'success', message: 'Invoice reversed with compensating inventory movement recorded in ledger.' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Sheet B
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Issued Invoices (Outgoing Sales)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Every outgoing sale has a permanent immutable record. Never overwritten.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Issued Invoices</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{filteredInvoices.length} historical records</span>
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
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice #, record ID, or buyer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* Product selector */}
          <select
            value={productFilter}
            onChange={e => setProductFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700"
          >
            <option value="all">All Products</option>
            {uniqueProducts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11px]">
          <span className="text-slate-400 font-semibold mr-1">Decision:</span>
          {(['all', 'Approved', 'Pending', 'Rejected'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDecisionFilter(d)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                decisionFilter === d ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d}
            </button>
          ))}

          <span className="text-slate-400 font-semibold ml-3 mr-1">Verification:</span>
          {(['all', 'Consistent', 'Inconsistency Detected', 'Insufficient Evidence', 'Verification Pending'] as const).map(v => (
            <button
              key={v}
              onClick={() => setVerificationFilter(v)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                verificationFilter === v ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── SHEET B: ISSUED INVOICES SPREADSHEET TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Record ID & Invoice #</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Buyer Entity</th>
                <th className="py-3 px-4">Product & SKU</th>
                <th className="py-3 px-4 text-right">Quantity Sold</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Decision Status</th>
                <th className="py-3 px-4 text-center">Verification Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Record ID & Invoice # */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{inv.originalInvoiceNumber}</div>
                      <div className="text-[10px] font-mono text-slate-400">{inv.id}</div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {inv.issueDate}
                    </td>

                    {/* Buyer */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inv.buyerBusinessName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.buyerBusinessUsername}</div>
                    </td>

                    {/* Product */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{inv.productName}</div>
                      <div className="text-[10px] text-indigo-600 font-mono">{inv.sku}</div>
                    </td>

                    {/* Quantity Sold */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {inv.quantitySold} {inv.unitOfMeasure}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>

                    {/* Decision Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          inv.decisionStatus === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.decisionStatus === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {inv.decisionStatus}
                      </span>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          inv.verificationStatus === 'Consistent'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.verificationStatus === 'Inconsistency Detected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {inv.verificationStatus === 'Consistent' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {inv.verificationStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {inv.decisionStatus === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(inv.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-2xs"
                              title="Approve sale and deduct inventory"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectingInvoice(inv);
                                setRejectionReason('');
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded text-[11px] font-semibold"
                              title="Reject transaction"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {inv.decisionStatus === 'Approved' && (
                          <button
                            onClick={() => {
                              setReversingInvoice(inv);
                              setReversalReason('');
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium"
                            title="Controlled return reversal"
                          >
                            Reverse
                          </button>
                        )}

                        <button
                          onClick={() => runIntelligenceCheck(inv.id, 'issued')}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-bold flex items-center space-x-1"
                          title="Run Recursive Supply-Chain Intelligence"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Audit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No issued invoice records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: REJECTION REASON ── */}
      {rejectingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Reject Invoice {rejectingInvoice.originalInvoiceNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Rejecting this sale will decline inventory movement and mark the transaction as rejected.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="State reason for invoice rejection..."
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setRejectingInvoice(null)} className="px-3 py-1.5 text-xs text-slate-600">
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REVERSAL REASON ── */}
      {reversingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Reverse Invoice {reversingInvoice.originalInvoiceNumber}
            </h3>
            <p className="text-xs text-slate-500">
              This controlled reversal will create a linked RETURN_INWARD movement in the inventory ledger to restore stock.
            </p>
            <textarea
              rows={3}
              value={reversalReason}
              onChange={e => setReversalReason(e.target.value)}
              placeholder="State reason for invoice reversal (e.g. customer return, billing error)..."
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setReversingInvoice(null)} className="px-3 py-1.5 text-xs text-slate-600">
                Cancel
              </button>
              <button
                onClick={handleConfirmReversal}
                disabled={!reversalReason.trim()}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
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
