import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  FileText,
  Filter,
  ArrowRight,
  Info,
} from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const { activities, decisionRecords, reassessmentEvents, activeProfile } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'decisions' | 'reassessments' | 'activities'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combined audit events list
  const combinedLog = useMemo(() => {
    const list: Array<{
      id: string;
      category: 'DECISION' | 'REASSESSMENT' | 'ACTIVITY';
      title: string;
      description: string;
      actor: string;
      timestamp: string;
      invoiceNumber?: string;
      status?: string;
      details?: string;
    }> = [];

    // 1. Reassessment events (Highest priority)
    reassessmentEvents.forEach(re => {
      list.push({
        id: re.id,
        category: 'REASSESSMENT',
        title: `Downstream Reassessment: ${re.targetInvoiceNumber}`,
        description: re.reason,
        actor: re.actor,
        timestamp: re.timestamp,
        invoiceNumber: re.targetInvoiceNumber,
        status: re.newStatus,
        details: re.evidenceNotes,
      });
    });

    // 2. Decision records
    decisionRecords.forEach(dec => {
      list.push({
        id: dec.id,
        category: 'DECISION',
        title: `Transaction Decision: ${dec.invoiceNumber} (${dec.decisionStatus})`,
        description: dec.reason,
        actor: dec.actor,
        timestamp: dec.timestamp,
        invoiceNumber: dec.invoiceNumber,
        status: dec.decisionStatus,
        details: dec.evidenceSummary,
      });
    });

    // 3. System activities
    activities.forEach(act => {
      list.push({
        id: act.id,
        category: 'ACTIVITY',
        title: act.type.toUpperCase().replace('_', ' '),
        description: act.details,
        actor: act.actor,
        timestamp: act.timestamp,
        invoiceNumber: act.invoiceNumber,
      });
    });

    // Sort descending by timestamp
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities, decisionRecords, reassessmentEvents]);

  const filteredLog = useMemo(() => {
    return combinedLog.filter(item => {
      if (filterType === 'decisions' && item.category !== 'DECISION') return false;
      if (filterType === 'reassessments' && item.category !== 'REASSESSMENT') return false;
      if (filterType === 'activities' && item.category !== 'ACTIVITY') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.actor.toLowerCase().includes(q) ||
          (item.invoiceNumber || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [combinedLog, filterType, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Audit Trail
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Activity Log & Decision History
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only chronological audit trail of all transaction decisions, reassessments, and inventory movements.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Events</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{combinedLog.length}</span>
          </div>
          <div className="bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-right">
            <span className="text-[10px] uppercase font-semibold text-amber-700 block">Reassessments</span>
            <span className="font-mono font-bold text-amber-900 text-sm">{reassessmentEvents.length}</span>
          </div>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search audit trail by invoice number, actor, or reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 shadow-2xs"
          />
        </div>

        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-semibold self-start sm:self-auto">
          {(['all', 'decisions', 'reassessments', 'activities'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1 rounded-lg capitalize transition-all ${
                filterType === tab
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── AUDIT EVENTS TIMELINE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        {filteredLog.length > 0 ? (
          <div className="space-y-4">
            {filteredLog.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        item.category === 'REASSESSMENT'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.category === 'DECISION'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.category}
                    </span>
                    {item.invoiceNumber && (
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {item.invoiceNumber}
                      </span>
                    )}
                    {item.status && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                  {item.details && (
                    <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded-lg border border-slate-200/60 mt-1">
                      {item.details}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0 space-y-0.5 self-end sm:self-auto text-[11px] font-mono text-slate-400">
                  <div>{new Date(item.timestamp).toLocaleString()}</div>
                  <div className="text-slate-600 font-sans font-medium">Actor: {item.actor}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <ClipboardList className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No audit log records found</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Try adjusting your search criteria or filter tabs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
