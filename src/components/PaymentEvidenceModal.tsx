import React, { useState } from 'react';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/finance';
import { CreditCard, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface PaymentEvidenceModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    invoiceId: string;
    invoiceRef: string;
    paymentMethod: 'Bank Transfer' | 'Credit/Debit Card' | 'PayPal' | 'Stripe' | 'Other';
    transactionId: string;
    amount: number;
    currency: string;
    paymentDate: string;
    submittedBy: string;
    notes?: string;
    attachmentName?: string;
  }) => void;
}

export const PaymentEvidenceModal: React.FC<PaymentEvidenceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Credit/Debit Card' | 'PayPal' | 'Stripe' | 'Other'>('Bank Transfer');
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState<number>(invoice.financials.amountDue || invoice.financials.total);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [attachmentName, setAttachmentName] = useState('wire_transmission_slip.pdf');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setError('Transaction reference or wire confirmation code is required.');
      return;
    }
    if (amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    onSubmit({
      invoiceId: invoice.id,
      invoiceRef: invoice.reference,
      paymentMethod,
      transactionId: transactionId.trim(),
      amount: Number(amount),
      currency: invoice.currency,
      paymentDate,
      submittedBy: `${invoice.buyer.contactPerson || 'Authorized Buyer'} (${invoice.buyer.username || '@buyer'})`,
      notes: notes.trim() || undefined,
      attachmentName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Submit Payment Evidence</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {invoice.reference || invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-base">
            &times;
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="Bank Transfer">Bank Transfer (Fedwire / SEPA / ACH)</option>
              <option value="Credit/Debit Card">Credit/Debit Card</option>
              <option value="PayPal">PayPal</option>
              <option value="Stripe">Stripe</option>
              <option value="Other">Other Electronic Remittance</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Transaction ID / Wire Reference <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={e => setTransactionId(e.target.value)}
              placeholder="e.g. WT-20261018-99201"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Remitted Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-right"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Receipt / Attachment</label>
            <div className="flex items-center space-x-2 p-2 border border-dashed border-slate-300 rounded-lg bg-slate-50">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="font-mono text-[11px] text-slate-600 truncate">{attachmentName}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Optional Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Remittance memo or bank transit details..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-xs"
            >
              Submit Evidence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
