import React, { useState } from 'react';
import {
  IssuedInvoiceRecord,
  ReceivedInvoiceRecord,
  InventoryMovement,
  IntelligenceReport,
} from '../types/inventory';
import { useApp } from '../context/AppContext';
import { runRecursiveIntelligenceReconciliation } from '../services/intelligenceService';
import { formatCurrency } from '../utils/finance';
import {
  X,
  FileText,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
  AlertOctagon,
  Ban,
  Package,
  Layers,
  FileCheck,
  Eye,
  Download,
  Copy,
  ExternalLink,
  Sparkles,
  GitBranch,
} from 'lucide-react';

interface InvoiceSheetDetailModalProps {
  invoice: IssuedInvoiceRecord | ReceivedInvoiceRecord | null;
  type: 'issued' | 'received';
  isOpen: boolean;
  onClose: () => void;
  onOpenUpload?: (invoice: IssuedInvoiceRecord | ReceivedInvoiceRecord) => void;
}

export const InvoiceSheetDetailModal: React.FC<InvoiceSheetDetailModalProps> = ({
  invoice,
  type,
  isOpen,
  onClose,
  onOpenUpload,
}) => {
  const {
    inventoryMovements,
    inventoryItems,
    issuedInvoices,
    receivedInvoices,
    activeProfile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'details' | 'document' | 'ledger' | 'intelligence'>('details');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const isIssued = type === 'issued';
  const issuedInv = isIssued ? (invoice as IssuedInvoiceRecord) : null;
  const receivedInv = !isIssued ? (invoice as ReceivedInvoiceRecord) : null;

  const quantity = isIssued ? issuedInv!.quantitySold : receivedInv!.quantityPurchased;
  const issuingName = isIssued ? issuedInv!.issuingBusinessName : receivedInv!.supplierBusinessName;
  const issuingUsername = isIssued ? issuedInv!.issuingBusinessUsername : receivedInv!.supplierBusinessUsername;
  const receivingName = isIssued ? issuedInv!.buyerBusinessName : receivedInv!.receivingBusinessName;
  const receivingUsername = isIssued ? issuedInv!.buyerBusinessUsername : receivedInv!.receivingBusinessUsername;
  const linkedRef = isIssued ? issuedInv!.linkedReceivedInvoiceRef : receivedInv!.linkedIssuedInvoiceRef;

  // Filter linked inventory movements for this invoice
  const relatedMovements = inventoryMovements.filter(
    m =>
      m.referenceInvoiceId === invoice.id ||
      m.referenceInvoiceNumber === invoice.originalInvoiceNumber ||
      m.idempotencyKey.includes(invoice.id)
  );

  // Run or preview intelligence report
  const userRole = activeProfile.username === '@nexusglobal' ? 'Seller' : 'Supplier';
  const intelligenceReport: IntelligenceReport = runRecursiveIntelligenceReconciliation(
    invoice.id,
    type,
    {
      inventory: inventoryItems,
      movements: inventoryMovements,
      issuedInvoices,
      receivedInvoices,
    },
    userRole
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: string, category: 'payment' | 'decision' | 'verification') => {
    if (category === 'payment') {
      switch (status) {
        case 'Paid':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'Unpaid':
          return 'bg-slate-100 text-slate-700 border-slate-200';
        case 'Payment Pending':
          return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Partially Paid':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Refunded':
          return 'bg-purple-50 text-purple-700 border-purple-200';
        default:
          return 'bg-slate-100 text-slate-700 border-slate-200';
      }
    }
    if (category === 'decision') {
      switch (status) {
        case 'Approved':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'Pending':
          return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Rejected':
          return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'Reversed':
          return 'bg-purple-50 text-purple-700 border-purple-200';
        default:
          return 'bg-slate-100 text-slate-700 border-slate-200';
      }
    }
    // verification
    switch (status) {
      case 'Consistent':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Inconsistency Detected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Insufficient Evidence':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Verification Pending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Investigation':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/60">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {isIssued ? 'Outgoing Sales Invoice' : 'Incoming Purchase Invoice'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] font-mono font-medium text-slate-500">Record ID: {invoice.id}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Invoice {invoice.originalInvoiceNumber}</span>
              <button
                onClick={() => copyToClipboard(invoice.originalInvoiceNumber, 'invNum')}
                title="Copy Invoice Number"
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {copiedField === 'invNum' && (
                <span className="text-[10px] font-sans font-medium text-emerald-600">Copied!</span>
              )}
            </h2>
            <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono">
              <span>Issued: {invoice.issueDate}</span>
              <span className="text-slate-300">·</span>
              <span>Updated: {new Date(invoice.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenUpload && (
              <button
                onClick={() => onOpenUpload(invoice)}
                className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs"
              >
                <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>{invoice.documentAttachment ? 'Replace Doc' : 'Attach Doc'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200/80 px-5 text-xs font-semibold bg-white shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoice Details</span>
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'document'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Document Preview</span>
            {invoice.documentAttachment && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'ledger'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Ledger Movements ({relatedMovements.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'intelligence'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Supply-Chain Intelligence</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs flex-1">
          {/* TAB 1: INVOICE DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Orthogonal 3-Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Payment Status Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Payment Status
                  </span>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusBadge(invoice.paymentStatus, 'payment')}`}>
                      {invoice.paymentStatus}
                    </span>
                    {invoice.paymentDate && (
                      <span className="text-[11px] font-mono text-slate-500">Paid: {invoice.paymentDate}</span>
                    )}
                  </div>
                </div>

                {/* Decision Status Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Decision Status
                  </span>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusBadge(invoice.decisionStatus, 'decision')}`}>
                      {invoice.decisionStatus}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {invoice.inventoryMovementApplied ? 'Stock Applied' : 'Stock Unaltered'}
                    </span>
                  </div>
                  {invoice.decisionBy && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      By {invoice.decisionBy}
                    </div>
                  )}
                  {invoice.rejectionReason && (
                    <div className="text-[10px] text-rose-600 mt-0.5">
                      Reason: {invoice.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Verification Status Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Verification Status
                  </span>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusBadge(invoice.verificationStatus, 'verification')}`}>
                      {invoice.verificationStatus}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Score: {intelligenceReport.evidenceCompleteness}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Commercial Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Supplier / Issuer */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    {isIssued ? 'Issuing Business (Seller)' : 'Supplier Entity'}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {issuingName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                        <span>{issuingName}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <div className="text-xs font-mono text-slate-500">{issuingUsername}</div>
                    </div>
                  </div>
                </div>

                {/* Buyer / Receiver */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    {isIssued ? 'Buyer Business (Customer)' : 'Receiving Business'}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {receivingName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                        <span>{receivingName}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <div className="text-xs font-mono text-slate-500">{receivingUsername}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items & Product Decoupling */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-semibold text-xs text-slate-700">
                  <span>Product Specifications & Financial Terms</span>
                  <span className="font-mono text-slate-400">1 Item Line</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Product Name</span>
                      <span className="font-bold text-slate-900 text-sm">{invoice.productName}</span>
                    </div>
                    <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Product SKU</span>
                      <span className="font-mono font-bold text-indigo-600 text-sm">{invoice.sku}</span>
                    </div>
                    <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Volume Transacted</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {quantity} {invoice.unitOfMeasure}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Unit Price / Total</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        ({formatCurrency(invoice.unitPrice, invoice.currency)} / unit)
                      </span>
                    </div>
                  </div>

                  {/* Cryptographic & Linkage References */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">TrustLayer Record ID:</span>
                      <span className="font-bold text-slate-900">{invoice.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Invoice Document Reference:</span>
                      <span className="text-slate-700">{invoice.invoiceDocRef}</span>
                    </div>
                    {linkedRef && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Linked Counterpart Transaction:</span>
                        <span className="font-bold text-indigo-600">{linkedRef}</span>
                      </div>
                    )}
                    {invoice.fingerprint && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">SHA-256 Fingerprint:</span>
                        <span className="text-[11px] text-slate-500 truncate max-w-xs">{invoice.fingerprint}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENT PREVIEW */}
          {activeTab === 'document' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">
                    {invoice.documentAttachment?.fileName || `${invoice.originalInvoiceNumber}_doc.pdf`}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {invoice.documentAttachment
                      ? `${invoice.documentAttachment.fileType} · ${(invoice.documentAttachment.fileSize / 1024).toFixed(1)} KB · Uploaded ${new Date(invoice.documentAttachment.uploadedAt).toLocaleDateString()}`
                      : 'Commercial document registered in TrustLayer digital registry'}
                  </span>
                </div>
                {onOpenUpload && (
                  <button
                    onClick={() => onOpenUpload(invoice)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Upload Document
                  </button>
                )}
              </div>

              {/* Document Display Canvas */}
              {invoice.documentAttachment?.dataUrl ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center p-4 min-h-[360px]">
                  {invoice.documentAttachment.fileType.includes('image') ? (
                    <img
                      src={invoice.documentAttachment.dataUrl}
                      alt="Invoice Attachment"
                      className="max-h-[500px] max-w-full rounded-lg shadow-md object-contain"
                    />
                  ) : (
                    <iframe
                      src={invoice.documentAttachment.dataUrl}
                      title="Invoice Document"
                      className="w-full h-[500px] rounded-lg border border-slate-200"
                    />
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3 bg-slate-50/50">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">No Document File Uploaded</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Attach an official commercial invoice PDF or high-resolution delivery receipt image to link physical evidence with this digital transaction.
                    </p>
                  </div>
                  {onOpenUpload && (
                    <button
                      onClick={() => onOpenUpload(invoice)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                    >
                      Attach Invoice File
                    </button>
                  )}
                </div>
              )}

              {/* Environmental Storage Transparency Banner */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 text-amber-900 rounded-xl text-[11px] leading-relaxed">
                <span className="font-bold block">Environmental Storage Disclosure:</span>
                Uploaded documents are maintained in active browser session storage for test verification. Connect Cloud SQL or GCS object storage for permanent tamper-proof regulatory archival.
              </div>
            </div>
          )}

          {/* TAB 3: LEDGER MOVEMENTS */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Immutable Inventory Movement Ledger
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Chronological audit movements written to the append-only ledger for this invoice transaction.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {relatedMovements.length} Record{relatedMovements.length === 1 ? '' : 's'}
                </span>
              </div>

              {relatedMovements.length > 0 ? (
                <div className="space-y-2">
                  {relatedMovements.map(m => (
                    <div
                      key={m.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                              m.type === 'PURCHASE_RECEIPT'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : m.type === 'SALE_DISPATCH'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {m.type.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">{m.id}</span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium">{m.notes}</p>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Recorded by {m.actor} · {new Date(m.timestamp).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block uppercase">Stock Delta</span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            m.quantity > 0 ? 'text-emerald-700' : 'text-blue-700'
                          }`}
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} units
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-600">No Inventory Movements Applied</p>
                  <p className="text-[11px] text-slate-400">
                    This invoice is currently in {invoice.decisionStatus} state. Only Approved transactions create movement records in the inventory ledger.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RECURSIVE INTELLIGENCE */}
          {activeTab === 'intelligence' && (
            <div className="space-y-4">
              {/* Outcome Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  intelligenceReport.overallResult === 'Consistent'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : intelligenceReport.overallResult === 'Inconsistency Detected'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">
                    Supply-Chain Provenance Outcome
                  </span>
                  <span className="text-sm font-bold block">{intelligenceReport.overallResult}</span>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] font-semibold block uppercase tracking-wider opacity-75">
                    Evidence Completeness
                  </span>
                  <span className="font-mono font-bold text-sm">{intelligenceReport.evidenceCompleteness}%</span>
                </div>
              </div>

              {/* Intelligence Explanation */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Reconciliation Analysis
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-normal">
                  {intelligenceReport.explanation}
                </p>
              </div>

              {/* Provenance Hops */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Recursive Provenance Traversal (Brand → Wholesaler → Supplier → Seller)
                </span>
                {intelligenceReport.upstreamChain.length > 0 ? (
                  <div className="space-y-2">
                    {intelligenceReport.upstreamChain.map(hop => (
                      <div
                        key={hop.recordId}
                        className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] font-mono">
                            T{hop.tierLevel}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{hop.businessName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {hop.role} · Invoice {hop.invoiceNumber}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {hop.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                    No upstream hops recorded for this specific product SKU.
                  </div>
                )}
              </div>

              {/* Recommended Action */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950">
                <span className="font-bold block text-[10px] uppercase tracking-wider text-indigo-700 mb-0.5">
                  Recommended Operational Action
                </span>
                {intelligenceReport.recommendedNextAction}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-mono">
            TrustLayer Document Integrity Protocol v2.4
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
