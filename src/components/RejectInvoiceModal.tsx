import React, { useState } from 'react';
import { Invoice } from '../types';
import { AlertTriangle } from 'lucide-react';

interface RejectInvoiceModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (invoiceId: string, reason: string) => void;
}

export const RejectInvoiceModal: React.FC<RejectInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onConfirmReject,
}) => {
  if (!isOpen) return null;

  const [reason, setReason] = useState('Incorrect line item quantity or pricing discrepancy.');

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmReject(invoice.id, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 text-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
        <div className="flex items-center space-x-2 text-rose-600 pb-2 border-b border-slate-100">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-bold text-slate-900 text-sm">Reject Invoice Record</h3>
        </div>

        <p className="text-slate-600 leading-relaxed">
          Rejecting invoice <strong>{invoice.invoiceNumber}</strong> (
          <span className="font-mono">{invoice.reference || 'Draft'}</span>) will mark it as rejected in the workflow. The history will be preserved.
        </p>

        <form onSubmit={handleConfirm} className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for Rejection <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              placeholder="State why the invoice is being rejected..."
              required
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
