import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';
import { InvoiceDocument } from './InvoiceDocument';
import { formatCurrency } from '../utils/finance';
import {
  X,
  FileDown,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileEdit,
  ArrowRight,
  CreditCard,
  Clock,
} from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPaymentEvidenceModal?: (inv: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onOpenPaymentEvidenceModal,
}) => {
  if (!isOpen || !invoice) return null;

  const {
    reviewPaymentEvidence,
    correctInvoice,
    setEditingInvoice,
    setCurrentTab,
    activeProfile,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctedDueDate, setCorrectedDueDate] = useState(invoice.dueDate);
  const [correctedNotes, setCorrectedNotes] = useState(invoice.additionalInfo.notes || '');

  const handleCopy = () => {
    const invNum = invoice.invoiceNumber || invoice.reference;
    if (invNum) {
      navigator.clipboard?.writeText(invNum);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateCorrection = () => {
    const updated = correctInvoice(invoice, {
      dueDate: correctedDueDate,
      additionalInfo: {
        ...invoice.additionalInfo,
        notes: `${correctedNotes} (Amended correction of ${invoice.invoiceNumber || invoice.reference})`,
      },
    });
    setShowCorrectionForm(false);
    onClose();
  };

  const isIssuer = invoice.issuer.username === activeProfile.username;
  const isBuyer = invoice.buyer.username === activeProfile.username;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-slate-800 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm tracking-wide">
                  Invoice {invoice.invoiceNumber || invoice.reference}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {invoice.status.replace('_', ' ')}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Single Invoice Identity · {invoice.issueDate}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center space-x-1"
              title="Copy Invoice Number"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Number'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center space-x-1"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {isIssuer && invoice.status !== 'draft' && (
              <button
                onClick={() => setShowCorrectionForm(!showCorrectionForm)}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-semibold text-white flex items-center space-x-1"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Correct Invoice</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Correction Bar if active */}
        {showCorrectionForm && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs space-y-2">
            <div className="font-bold text-amber-900">
              Create Amended Correction (Preserves original record history)
            </div>
            <p className="text-amber-800 text-[11px]">
              Registered records cannot be silently modified. Submitting creates a successor record (
              <span className="font-mono">{invoice.invoiceNumber}-REV</span>) cryptographically linking
              back to <span className="font-mono">{invoice.reference}</span>.
            </p>
            <div className="flex items-center space-x-3 pt-1">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600">New Due Date</label>
                <input
                  type="date"
                  value={correctedDueDate}
                  onChange={e => setCorrectedDueDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-slate-600">Amendment Note</label>
                <input
                  type="text"
                  value={correctedNotes}
                  onChange={e => setCorrectedNotes(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                />
              </div>
              <button
                onClick={handleCreateCorrection}
                className="px-3 py-1.5 bg-amber-700 text-white rounded font-bold hover:bg-amber-800 text-xs mt-3.5"
              >
                Issue Amended Version
              </button>
            </div>
          </div>
        )}

        {/* Review Payment Claims Alert (if any claims pending) */}
        {invoice.paymentEvidence && invoice.paymentEvidence.length > 0 && (
          <div className="p-4 bg-indigo-50/70 border-b border-indigo-100 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Payment Evidence History ({invoice.paymentEvidence.length})</span>
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold">
                Audit Status: {invoice.paymentEvidence[0].status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2">
              {invoice.paymentEvidence.map(ev => (
                <div
                  key={ev.id}
                  className="p-3 bg-white rounded-lg border border-indigo-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{ev.paymentMethod}</span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        Ref: {ev.transactionId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Amount: <strong>{formatCurrency(ev.amount, ev.currency)}</strong> &bull; Date:{' '}
                      {ev.paymentDate} &bull; Submitted by: {ev.submittedBy}
                    </div>
                    {ev.notes && <p className="text-[11px] text-slate-600 italic">{ev.notes}</p>}
                  </div>

                  {/* Decision Actions for Issuer if pending */}
                  {isIssuer && ev.status === 'pending_review' && (
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => reviewPaymentEvidence(ev.id, 'confirmed', 'Approved in banking audit.')}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Payment</span>
                      </button>
                      <button
                        onClick={() => reviewPaymentEvidence(ev.id, 'rejected', 'Remittance not received in operating account.')}
                        className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-semibold hover:bg-rose-100"
                      >
                        Reject Claim
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          <InvoiceDocument invoice={invoice} showVerificationHeader={false} />
        </div>
      </div>
    </div>
  );
};
