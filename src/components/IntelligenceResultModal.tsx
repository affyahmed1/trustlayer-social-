import React from 'react';
import { IntelligenceReport } from '../types/inventory';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
  Ban,
  AlertOctagon,
  CheckCircle2,
  GitBranch,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileText,
  Copy,
  Info,
} from 'lucide-react';

interface IntelligenceResultModalProps {
  report: IntelligenceReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const IntelligenceResultModal: React.FC<IntelligenceResultModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !report) return null;

  const getStatusBadge = (result: IntelligenceReport['overallResult']) => {
    switch (result) {
      case 'Consistent':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          label: 'Verified Consistency',
        };
      case 'Inconsistency Detected':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
          label: 'Inconsistency Detected',
        };
      case 'Insufficient Evidence':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <HelpCircle className="w-4 h-4 text-amber-600" />,
          label: 'Evidence Insufficient',
        };
      case 'Verification Pending':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Clock className="w-4 h-4 text-blue-600" />,
          label: 'Verification Pending',
        };
      case 'Rejected Transaction':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: <Ban className="w-4 h-4 text-slate-600" />,
          label: 'Rejected Transaction',
        };
      case 'Potential Risk':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: <AlertOctagon className="w-4 h-4 text-orange-600" />,
          label: 'Potential Risk Requiring Investigation',
        };
    }
  };

  const statusConfig = getStatusBadge(report.overallResult);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                TrustLayer Intelligence Layer
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-xs font-mono text-slate-500">{report.runId}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Supply-Chain Reconciliation: {report.invoiceNumber}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Product: <span className="font-semibold text-slate-700">{report.productName}</span> ({report.sku}) &bull; Requested Qty: <span className="font-mono font-bold text-slate-900">{report.requestedQuantity} units</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs">
          {/* Overall Result Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${statusConfig.bg}`}>
            <div className="flex items-center space-x-3">
              {statusConfig.icon}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">
                  Reconciliation Outcome
                </span>
                <span className="text-sm font-bold block">{statusConfig.label}</span>
              </div>
            </div>

            {/* Evidence Completeness Meter */}
            <div className="sm:text-right shrink-0">
              <span className="text-[10px] font-semibold block uppercase tracking-wider opacity-75">
                Evidence Completeness
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <div className="w-24 bg-white/60 rounded-full h-2 overflow-hidden border border-black/5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      report.evidenceCompleteness >= 75
                        ? 'bg-emerald-600'
                        : report.evidenceCompleteness >= 40
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${report.evidenceCompleteness}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-xs">{report.evidenceCompleteness}%</span>
              </div>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Intelligence Analysis
            </span>
            <p className="text-xs text-slate-800 leading-relaxed font-normal">
              {report.explanation}
            </p>
          </div>

          {/* ── MULTI-TIER RECURSIVE PROVENANCE CHAIN ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                <span>Recursive Supply-Chain Provenance Traversal</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Max Depth: 5 Hops</span>
            </div>

            {report.upstreamChain.length > 0 ? (
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/90 space-y-3">
                <div className="space-y-2">
                  {report.upstreamChain.map((hop, idx) => (
                    <div
                      key={hop.recordId}
                      className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] font-mono">
                          T{hop.tierLevel}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{hop.businessName}</span>
                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                              {hop.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            <span>Invoice {hop.invoiceNumber}</span>
                            <span className="text-slate-300 mx-1.5">&bull;</span>
                            <span>{hop.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 sm:text-right">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Volume Transacted</span>
                          <span className="font-mono font-bold text-slate-900">{hop.quantitySupplied} units</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                            hop.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {hop.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                No verified upstream provenance hops registered for this transaction.
              </div>
            )}
          </div>

          {/* ── QUANTITY RECONCILIATION SUMMARY ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Quantity Reconciliation & Warehouse Inventory Audit</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Opening Stock</span>
                <span className="font-mono font-bold text-sm text-slate-800">
                  {report.quantityReconciliation.openingStock}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold text-emerald-600">
                  Approved Purchases (+)
                </span>
                <span className="font-mono font-bold text-sm text-emerald-700">
                  +{report.quantityReconciliation.approvedPurchases}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold text-blue-600">
                  Approved Sales (-)
                </span>
                <span className="font-mono font-bold text-sm text-blue-700">
                  -{report.quantityReconciliation.approvedSales}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current Stock</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {report.quantityReconciliation.currentStock}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-slate-600 font-medium">Supported Available Quantity:</span>
                <span className="font-mono font-bold text-slate-900">
                  {report.quantityReconciliation.supportedQuantity} units
                </span>
              </div>
              {report.quantityReconciliation.unsupportedQuantity > 0 && (
                <div className="flex items-center space-x-1.5 text-rose-600 font-semibold font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Deficit: {report.quantityReconciliation.unsupportedQuantity} units unsupported</span>
                </div>
              )}
            </div>
          </div>

          {/* ── RISK INDICATORS & MISSING EVIDENCE ── */}
          {(report.riskIndicators.length > 0 || report.missingEvidence.length > 0) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 text-amber-600" />
                <span>Risk Factors & Missing Evidence</span>
              </h3>

              {report.riskIndicators.map((risk, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start space-x-2.5 ${
                    risk.severity === 'critical' || risk.severity === 'high'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-xs">{risk.title}</span>
                    <p className="text-[11px] opacity-90 leading-relaxed mt-0.5">{risk.description}</p>
                  </div>
                </div>
              ))}

              {report.missingEvidence.map((missing, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center space-x-2 text-slate-700"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{missing}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recommended Next Action */}
          <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 block">
              Recommended Next Action
            </span>
            <p className="text-xs text-indigo-950 font-medium leading-relaxed">
              {report.recommendedNextAction}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-mono">
            Verified {new Date(report.timestamp).toLocaleString()}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(report, null, 2));
              }}
              className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-700 font-semibold flex items-center space-x-1"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy JSON</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
