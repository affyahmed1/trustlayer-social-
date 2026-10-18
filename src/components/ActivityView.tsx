import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Activity,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Send,
  FileText,
  CreditCard,
  ShieldCheck,
  Eye,
} from 'lucide-react';

export const ActivityView: React.FC = () => {
  const { activities, invoices, setSelectedInvoice } = useApp();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivities = useMemo(() => {
    return activities
      .filter(act => {
        if (filterType === 'all') return true;
        if (filterType === 'registration')
          return ['registered', 'draft_created', 'corrected'].includes(act.type);
        if (filterType === 'payment')
          return ['payment_evidence_submitted', 'payment_confirmed', 'payment_rejected'].includes(
            act.type
          );
        if (filterType === 'verification')
          return ['verified', 'mismatch_detected'].includes(act.type);
        if (filterType === 'exchange') return ['sent', 'received', 'accepted', 'rejected'].includes(act.type);
        return true;
      })
      .filter(act => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          act.details.toLowerCase().includes(q) ||
          act.actor.toLowerCase().includes(q) ||
          act.invoiceRef?.toLowerCase().includes(q) ||
          act.invoiceNumber?.toLowerCase().includes(q)
        );
      });
  }, [activities, filterType, searchQuery]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'registered':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'payment_confirmed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'payment_evidence_submitted':
        return <CreditCard className="w-4 h-4 text-indigo-600" />;
      case 'sent':
        return <Send className="w-4 h-4 text-blue-600" />;
      case 'mismatch_detected':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Activity Audit Log</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological timeline of all registration, verification, and payment events.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
          {activities.length} Recorded Events
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex space-x-1 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'registration', label: 'Registration' },
              { id: 'payment', label: 'Payment Workflow' },
              { id: 'verification', label: 'Verification' },
              { id: 'exchange', label: 'Exchange & Status' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all whitespace-nowrap ${
                  filterType === tab.id
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
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Timeline List */}
        <div className="pt-2 divide-y divide-slate-100">
          {filteredActivities.length > 0 ? (
            filteredActivities.map(act => (
              <div
                key={act.id}
                className="py-3.5 px-2 flex items-start space-x-3 hover:bg-slate-50/60 rounded-lg transition-colors"
              >
                <div className="p-2 bg-slate-100 rounded-lg shrink-0 mt-0.5">
                  {getEventIcon(act.type)}
                </div>

                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 capitalize">
                      {act.type.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-slate-700 mt-1 leading-relaxed">{act.details}</p>

                  <div className="mt-2 flex items-center space-x-3 text-[11px] text-slate-500">
                    <span>
                      Actor: <strong className="text-slate-700">{act.actor}</strong>
                    </span>

                    {(act.invoiceRef || act.invoiceNumber) && (
                      <button
                        onClick={() => {
                          const found = invoices.find(
                            i => i.reference === act.invoiceRef || i.id === act.invoiceId
                          );
                          if (found) setSelectedInvoice(found);
                        }}
                        className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                      >
                        <span>{act.invoiceRef || act.invoiceNumber}</span>
                        <Eye className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No activity matching the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
