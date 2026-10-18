import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/finance';
import {
  Plus,
  Search,
  Filter,
  Download,
  Copy,
  Share2,
  Check,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileEdit,
  ArrowUpDown,
  ShieldCheck,
} from 'lucide-react';

export const IssuedInvoices: React.FC = () => {
  const {
    invoices,
    issuedFilter,
    setIssuedFilter,
    setCurrentTab,
    setSelectedInvoice,
    setEditingInvoice,
    shareInvoiceInThread,
    threads,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'date' | 'amount' | 'number'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter invoices where active profile is the issuer
  const issuedInvoices = useMemo(() => {
    return invoices.filter(inv => inv.issuer.username === '@apexsupply');
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return issuedInvoices
      .filter(inv => {
        // Tab filter
        if (issuedFilter === 'paid') return inv.status === 'paid';
        if (issuedFilter === 'unpaid')
          return ['registered', 'sent', 'pending_review', 'due_today', 'overdue'].includes(
            inv.status
          );
        if (issuedFilter === 'due_today') return inv.status === 'due_today';
        if (issuedFilter === 'overdue') return inv.status === 'overdue';
        return true;
      })
      .filter(inv => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          inv.reference?.toLowerCase().includes(q) ||
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.buyer.name.toLowerCase().includes(q) ||
          inv.buyer.username?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortField === 'amount') {
          return sortAsc
            ? a.financials.total - b.financials.total
            : b.financials.total - a.financials.total;
        }
        if (sortField === 'number') {
          return sortAsc
            ? a.invoiceNumber.localeCompare(b.invoiceNumber)
            : b.invoiceNumber.localeCompare(a.invoiceNumber);
        }
        // Date
        return sortAsc
          ? new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
          : new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
      });
  }, [issuedInvoices, issuedFilter, searchQuery, sortField, sortAsc]);

  const handleCopyRef = (ref: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleShareToChat = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (threads.length > 0) {
      shareInvoiceInThread(threads[0].id, inv);
      setCurrentTab('messages');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Issued Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial invoices issued by your business with verifiable cryptographic signatures.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingInvoice(null);
            setCurrentTab('create');
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 active:scale-98 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Filter Tabs and Controls */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          {/* Subnav Tabs */}
          <div className="flex space-x-1 p-1 bg-slate-100 rounded-lg text-xs">
            {[
              { id: 'all', label: 'All Issued' },
              { id: 'paid', label: 'Paid' },
              { id: 'unpaid', label: 'Unpaid' },
              { id: 'due_today', label: 'Due Today' },
              { id: 'overdue', label: 'Overdue' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setIssuedFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  issuedFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar & Sort */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, buyer, or #..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={() => {
                if (sortField === 'date') setSortAsc(!sortAsc);
                else {
                  setSortField('date');
                  setSortAsc(false);
                }
              }}
              className="p-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center space-x-1"
              title="Sort by date"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Buyer</th>
                <th className="py-2.5 px-3">Issue Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Verification</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
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
                      <div className="flex items-center space-x-1.5">
                        <span>{inv.reference || 'UNREGISTERED'}</span>
                        {inv.reference && (
                          <button
                            onClick={e => handleCopyRef(inv.reference, e)}
                            className="text-slate-400 hover:text-slate-700"
                            title="Copy TrustLayer reference"
                          >
                            {copiedRef === inv.reference ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700 font-medium">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{inv.buyer.name}</div>
                      <div className="text-[11px] text-slate-400">{inv.buyer.username}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">{inv.issueDate}</td>

                    <td className="py-3 px-3 text-slate-800 font-medium">{inv.dueDate}</td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(inv.financials.total, inv.currency)}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.status === 'overdue'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : inv.status === 'due_today'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : inv.status === 'pending_review'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {inv.reference ? (
                        <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Draft Record</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Inspect Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={e => handleShareToChat(inv, e)}
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                          title="Share in Chat"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                    No issued invoices matching the current filter.
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
