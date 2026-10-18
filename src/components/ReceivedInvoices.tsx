import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/finance';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  CreditCard,
  ShieldCheck,
  Download,
  AlertCircle,
  Clock,
  ArrowUpDown,
} from 'lucide-react';

interface ReceivedInvoicesProps {
  onOpenPaymentEvidenceModal?: (invoice: Invoice) => void;
  onOpenRejectModal?: (invoice: Invoice) => void;
}

export const ReceivedInvoices: React.FC<ReceivedInvoicesProps> = ({
  onOpenPaymentEvidenceModal,
  onOpenRejectModal,
}) => {
  const {
    invoices,
    receivedFilter,
    setReceivedFilter,
    setSelectedInvoice,
    acceptReceivedInvoice,
    setCurrentTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  // Received invoices where active profile is the buyer
  const receivedInvoices = useMemo(() => {
    return invoices.filter(inv => inv.buyer.username === '@apexsupply');
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return receivedInvoices
      .filter(inv => {
        if (receivedFilter === 'pending_review') return inv.status === 'pending_review';
        if (receivedFilter === 'accepted') return inv.status === 'accepted';
        if (receivedFilter === 'rejected') return inv.status === 'rejected';
        if (receivedFilter === 'paid') return inv.status === 'paid';
        return true;
      })
      .filter(inv => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          inv.reference?.toLowerCase().includes(q) ||
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.issuer.name.toLowerCase().includes(q) ||
          inv.issuer.username?.toLowerCase().includes(q)
        );
      });
  }, [receivedInvoices, receivedFilter, searchQuery]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Received Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial bills and supplier records delivered to your TrustLayer business account.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('verification')}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verify Incoming Reference</span>
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex space-x-1 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto">
            {[
              { id: 'all', label: 'All Received' },
              { id: 'pending_review', label: 'Pending Review' },
              { id: 'accepted', label: 'Accepted' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'paid', label: 'Paid' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setReceivedFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all whitespace-nowrap ${
                  receivedFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search incoming records..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Supplier / Issuer</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Total Due</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Verification</th>
                <th className="py-2.5 px-3 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map(inv => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {inv.reference || 'UNREGISTERED'}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700 font-medium">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{inv.issuer.name}</div>
                      <div className="text-[11px] text-slate-400">{inv.issuer.username}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-800 font-medium">{inv.dueDate}</td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(inv.financials.total, inv.currency)}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.status === 'accepted'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : inv.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : inv.status === 'pending_review'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                        Verified
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        {inv.status !== 'accepted' && inv.status !== 'paid' && (
                          <button
                            onClick={() => acceptReceivedInvoice(inv.id)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold"
                            title="Accept invoice record"
                          >
                            Accept
                          </button>
                        )}

                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => {
                              if (onOpenPaymentEvidenceModal) onOpenPaymentEvidenceModal(inv);
                            }}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[11px] font-semibold flex items-center space-x-1"
                            title="Submit payment evidence"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Remit Evidence</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Inspect document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    No received invoices matching current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
