import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VerificationResult } from '../utils/reference';
import { formatCurrency } from '../utils/finance';
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Key,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const VerificationView: React.FC = () => {
  const { verifyReference, invoices, setSelectedInvoice } = useApp();

  const [referenceInput, setReferenceInput] = useState('TL-2026-8812-9014');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [tamperSimulation, setTamperSimulation] = useState(false);

  const handleVerify = (customRef?: string, isTampered: boolean = false) => {
    const ref = customRef || referenceInput;
    if (!ref.trim()) return;

    let inspectPayload = undefined;
    if (isTampered) {
      // Find the base record and simulate a changed total amount and due date
      const found = invoices.find(i => i.reference.toUpperCase() === ref.trim().toUpperCase());
      if (found) {
        inspectPayload = {
          ...found,
          dueDate: '2026-12-31',
          financials: {
            ...found.financials,
            total: (found.financials?.total || 1000) + 500, // Altered!
          },
        };
      }
    }

    const verification = verifyReference(ref, inspectPayload);
    setResult(verification);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-2.5 mb-1">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Record Verification</h1>
            <p className="text-xs text-slate-500">
              Verify document integrity, SHA-256 fingerprint, and registered issuer record.
            </p>
          </div>
        </div>

        {/* Reference Input Bar */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={referenceInput}
              onChange={e => setReferenceInput(e.target.value.toUpperCase())}
              placeholder="e.g. TL-2026-8812-9014"
              className="w-full pl-9 pr-4 py-2.5 text-xs font-mono border border-slate-300 rounded-xl uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => handleVerify(referenceInput, tamperSimulation)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 active:scale-98 transition-all shadow-xs flex items-center justify-center space-x-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verify Reference</span>
          </button>
        </div>

        {/* Quick Test References */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Test examples:</span>

          <button
            onClick={() => {
              setReferenceInput('TL-2026-8812-9014');
              setTamperSimulation(false);
              handleVerify('TL-2026-8812-9014', false);
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-mono text-[11px]"
          >
            TL-2026-8812-9014 (Valid)
          </button>

          <button
            onClick={() => {
              setReferenceInput('TL-2026-8812-9014');
              setTamperSimulation(true);
              handleVerify('TL-2026-8812-9014', true);
            }}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-700 font-semibold text-[11px] flex items-center space-x-1"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Simulate Altered Payload (Mismatch Test)</span>
          </button>

          <button
            onClick={() => {
              setReferenceInput('TL-2026-UNKNOWN');
              setTamperSimulation(false);
              handleVerify('TL-2026-UNKNOWN', false);
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-mono text-[11px]"
          >
            TL-2026-UNKNOWN (Not Found)
          </button>
        </div>
      </div>

      {/* Verification Result Card */}
      {result && (
        <div className="space-y-4">
          {/* Status Header */}
          <div
            className={`p-5 rounded-xl border shadow-xs transition-all ${
              result.status === 'NOT_FOUND'
                ? 'bg-slate-50 border-slate-200'
                : result.integrity === 'MATCH'
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-rose-50/70 border-rose-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {result.status === 'NOT_FOUND' ? (
                  <div className="p-2 bg-slate-200 rounded-lg text-slate-700">
                    <XCircle className="w-6 h-6" />
                  </div>
                ) : result.integrity === 'MATCH' ? (
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-extrabold text-slate-900">
                      {result.status === 'NOT_FOUND'
                        ? 'Record Not Found'
                        : result.integrity === 'MATCH'
                        ? 'Integrity Verified'
                        : 'Integrity Mismatch Detected'}
                    </h2>
                    <span className="font-mono text-xs px-2 py-0.5 bg-white/80 rounded border border-slate-200 font-semibold">
                      {result.reference}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{result.explanation}</p>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex flex-col items-end space-y-1">
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    result.integrity === 'MATCH'
                      ? 'bg-emerald-600 text-white'
                      : result.integrity === 'MISMATCH'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-600 text-white'
                  }`}
                >
                  {result.integrity}
                </span>

                {result.status === 'FOUND' && (
                  <span className="text-[10px] font-semibold text-slate-500">
                    Issuer: <strong className="text-slate-800">{result.issuerVerification}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Mismatch Details */}
            {result.integrity === 'MISMATCH' && result.tamperedFields && (
              <div className="mt-4 p-3 bg-white/90 rounded-lg border border-rose-200 text-xs space-y-1.5">
                <span className="font-bold text-rose-800 block">
                  Discrepancies identified against registered canonical hash:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-rose-700 text-[11px]">
                  {result.tamperedFields.map((f, i) => (
                    <li key={i}>
                      Field altered: <strong>{f}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Registered Record Details (if found) */}
          {result.registeredRecord && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Registered Record Metadata</span>
                </h3>

                <button
                  onClick={() => setSelectedInvoice(result.registeredRecord)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <span>Open Full Invoice</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {result.registeredRecord.invoiceNumber}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Registered Timestamp:</span>
                  <span className="font-mono text-slate-800">
                    {result.registeredRecord.registeredAt || '2026-10-02 08:30:00 UTC'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Issuer:</span>
                  <div className="font-semibold text-slate-900">
                    {result.registeredRecord.issuer.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {result.registeredRecord.issuer.username} &bull; {result.registeredRecord.issuer.id}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Buyer:</span>
                  <div className="font-semibold text-slate-900">
                    {result.registeredRecord.buyer.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {result.registeredRecord.buyer.username || 'Direct Counterparty'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Registered Total Amount:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(
                      result.registeredRecord.financials?.total,
                      result.registeredRecord.currency
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Maturity / Due Date:</span>
                  <span className="font-medium text-slate-800">
                    {result.registeredRecord.dueDate}
                  </span>
                </div>
              </div>

              {/* Cryptographic Fingerprint Hash Details */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Cryptographic Fingerprint Inspection
                </span>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1.5 font-mono">
                  <div>
                    <span className="text-slate-400">Registered Fingerprint:</span>
                    <div className="text-slate-800 break-all select-all">
                      {result.expectedFingerprint || '—'}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400">Computed Document Hash:</span>
                    <div
                      className={`break-all select-all font-semibold ${
                        result.integrity === 'MATCH' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {result.computedFingerprint || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
