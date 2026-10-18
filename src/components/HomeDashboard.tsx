import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/finance';
import {
  Plus,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const HomeDashboard: React.FC = () => {
  const {
    invoices,
    activities,
    setCurrentTab,
    setIssuedFilter,
    setReceivedFilter,
    setSelectedInvoice,
  } = useApp();

  // Summary Metrics computed from actual records
  const stats = useMemo(() => {
    // Issued invoices (where issuer is current business)
    const issued = invoices.filter(i => i.issuer.username === '@apexsupply' && i.status !== 'draft');
    const received = invoices.filter(i => i.buyer.username === '@apexsupply');

    const totalIssuedAmt = issued.reduce((acc, i) => acc + (i.financials?.total || 0), 0);
    const totalReceivedAmt = received.reduce((acc, i) => acc + (i.financials?.total || 0), 0);

    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const paidAmt = paidInvoices.reduce((acc, i) => acc + (i.financials?.total || 0), 0);

    const unpaidInvoices = invoices.filter(
      i => ['registered', 'sent', 'pending_review', 'due_today', 'overdue'].includes(i.status)
    );
    const unpaidAmt = unpaidInvoices.reduce((acc, i) => acc + (i.financials?.amountDue || 0), 0);

    const dueToday = invoices.filter(i => i.status === 'due_today');
    const dueTodayAmt = dueToday.reduce((acc, i) => acc + (i.financials?.amountDue || 0), 0);

    const overdue = invoices.filter(i => i.status === 'overdue');
    const overdueAmt = overdue.reduce((acc, i) => acc + (i.financials?.amountDue || 0), 0);

    const pendingReview = invoices.filter(i => i.status === 'pending_review');
    const pendingReviewAmt = pendingReview.reduce((acc, i) => acc + (i.financials?.total || 0), 0);

    return {
      totalIssued: { count: issued.length, amount: totalIssuedAmt },
      totalReceived: { count: received.length, amount: totalReceivedAmt },
      paid: { count: paidInvoices.length, amount: paidAmt },
      unpaid: { count: unpaidInvoices.length, amount: unpaidAmt },
      dueToday: { count: dueToday.length, amount: dueTodayAmt },
      overdue: { count: overdue.length, amount: overdueAmt },
      pendingReview: { count: pendingReview.length, amount: pendingReviewAmt },
    };
  }, [invoices]);

  // Actionable Attention Items
  const attentionItems = useMemo(() => {
    const list: {
      id: string;
      title: string;
      subtitle: string;
      type: 'due_today' | 'overdue' | 'pending_review';
      invoice: (typeof invoices)[0];
    }[] = [];

    invoices.forEach(inv => {
      if (inv.status === 'due_today') {
        list.push({
          id: `att-dt-${inv.id}`,
          title: `Invoice Due Today: ${inv.invoiceNumber}`,
          subtitle: `${inv.buyer.name} • ${formatCurrency(inv.financials.amountDue, inv.currency)}`,
          type: 'due_today',
          invoice: inv,
        });
      } else if (inv.status === 'overdue') {
        list.push({
          id: `att-od-${inv.id}`,
          title: `Overdue Invoice: ${inv.invoiceNumber}`,
          subtitle: `${inv.buyer.name} • ${formatCurrency(inv.financials.amountDue, inv.currency)}`,
          type: 'overdue',
          invoice: inv,
        });
      } else if (inv.status === 'pending_review') {
        list.push({
          id: `att-pr-${inv.id}`,
          title: `Payment Claim Awaiting Review`,
          subtitle: `${inv.reference || inv.invoiceNumber} • ${formatCurrency(inv.financials.total, inv.currency)}`,
          type: 'pending_review',
          invoice: inv,
        });
      }
    });

    return list;
  }, [invoices]);

  // Recent invoices list (up to 5)
  const recentInvoices = useMemo(() => {
    return invoices.slice(0, 5);
  }, [invoices]);

  const handleCardClick = (target: string) => {
    if (target === 'issued') {
      setIssuedFilter('all');
      setCurrentTab('issued');
    } else if (target === 'received') {
      setReceivedFilter('all');
      setCurrentTab('received');
    } else if (target === 'paid') {
      setIssuedFilter('paid');
      setCurrentTab('issued');
    } else if (target === 'due_today') {
      setIssuedFilter('due_today');
      setCurrentTab('issued');
    } else if (target === 'overdue') {
      setIssuedFilter('overdue');
      setCurrentTab('issued');
    } else if (target === 'pending_review') {
      setReceivedFilter('pending_review');
      setCurrentTab('received');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Hero Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Financial Records Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified invoice exchange and payment evidence registry.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setCurrentTab('verification')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verify Record</span>
          </button>

          <button
            onClick={() => setCurrentTab('create')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 active:scale-98 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Issued */}
        <div
          onClick={() => handleCardClick('issued')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Issued</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-base font-bold text-slate-900">
            {formatCurrency(stats.totalIssued.amount, 'USD')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.totalIssued.count} {stats.totalIssued.count === 1 ? 'record' : 'records'}
          </div>
        </div>

        {/* Total Received */}
        <div
          onClick={() => handleCardClick('received')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Received</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-base font-bold text-slate-900">
            {formatCurrency(stats.totalReceived.amount, 'USD')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.totalReceived.count} {stats.totalReceived.count === 1 ? 'record' : 'records'}
          </div>
        </div>

        {/* Paid */}
        <div
          onClick={() => handleCardClick('paid')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Paid</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-emerald-600">
            {formatCurrency(stats.paid.amount, 'USD')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.paid.count} {stats.paid.count === 1 ? 'invoice' : 'invoices'}
          </div>
        </div>

        {/* Unpaid */}
        <div
          onClick={() => handleCardClick('issued')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-400 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Unpaid</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-base font-bold text-slate-900">
            {formatCurrency(stats.unpaid.amount, 'USD')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.unpaid.count} outstanding
          </div>
        </div>

        {/* Due Today */}
        <div
          onClick={() => handleCardClick('due_today')}
          className={`p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all ${
            stats.dueToday.count > 0
              ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Due Today</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-base font-bold text-amber-700">
            {formatCurrency(stats.dueToday.amount, 'USD')}
          </div>
          <div className="text-[11px] text-amber-600 mt-1">
            {stats.dueToday.count} requiring action
          </div>
        </div>

        {/* Overdue */}
        <div
          onClick={() => handleCardClick('overdue')}
          className={`p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all ${
            stats.overdue.count > 0
              ? 'bg-rose-50/60 border-rose-200 hover:border-rose-400'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Overdue</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-base font-bold text-rose-700">
            {formatCurrency(stats.overdue.amount, 'USD')}
          </div>
          <div className="text-[11px] text-rose-600 mt-1">
            {stats.overdue.count} past maturity
          </div>
        </div>

        {/* Pending Review */}
        <div
          onClick={() => handleCardClick('pending_review')}
          className={`p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all ${
            stats.pendingReview.count > 0
              ? 'bg-indigo-50/60 border-indigo-200 hover:border-indigo-400'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-600 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Review</span>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-base font-bold text-indigo-900">
            {formatCurrency(stats.pendingReview.amount, 'USD')}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1">
            {stats.pendingReview.count} payment claim
          </div>
        </div>
      </div>

      {/* Action Items Alert Section */}
      {attentionItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Attention Required ({attentionItems.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Actionable items requiring review</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {attentionItems.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedInvoice(item.invoice);
                }}
                className="p-3 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50/60 hover:bg-white cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800">{item.title}</div>
                  <div className="text-[11px] text-slate-500">{item.subtitle}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Split: Recent Invoices & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Invoices Table: 8 cols */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Invoices</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Latest commercial records registered and exchanged.
              </p>
            </div>
            <button
              onClick={() => setCurrentTab('issued')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Reference / ID</th>
                  <th className="py-2.5 px-4">Counterparty</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map(inv => {
                  const isIssuer = inv.issuer.username === '@apexsupply';
                  const counterparty = isIssuer ? inv.buyer : inv.issuer;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">
                          {inv.reference || 'DRAFT'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {inv.invoiceNumber}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{counterparty.name}</div>
                        <div className="text-[11px] text-slate-400">{counterparty.username}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {inv.dueDate}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(inv.financials.total, inv.currency)}
                      </td>

                      <td className="py-3 px-4">
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

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedInvoice(inv);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Feed: 4 cols */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
            <button
              onClick={() => setCurrentTab('activity')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Full Log
            </button>
          </div>

          <div className="space-y-3.5">
            {activities.slice(0, 5).map(act => (
              <div key={act.id} className="flex items-start space-x-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-slate-800 font-medium leading-snug">{act.details}</p>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>&bull;</span>
                    <span className="font-mono">{act.invoiceRef || act.invoiceNumber || 'System'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
