import React, { useState, useEffect } from 'react';
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
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Package,
  Clock,
  Lock,
  Boxes,
  FileCheck2,
  HelpCircle,
  Share2,
} from 'lucide-react';

export const VerificationView: React.FC = () => {
  const {
    verifyReference,
    invoices,
    issuedInvoices,
    receivedInvoices,
    inventoryItems,
    inventoryMovements,
    businessRoles,
    setSelectedInvoice,
  } = useApp();

  // Search by single Invoice Number (default to representative approved trade invoice)
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('INV-2026-0042');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [tamperSimulation, setTamperSimulation] = useState(false);

  const handleVerify = (customNumber?: string, isTampered: boolean = false) => {
    const targetNum = (customNumber || invoiceNumberInput).trim();
    if (!targetNum) return;

    let inspectPayload: any = undefined;
    if (isTampered) {
      // Find the base record and simulate a changed total amount and due date
      const all: any[] = [...invoices, ...issuedInvoices, ...receivedInvoices];
      const found = all.find(
        (i: any) =>
          (i.invoiceNumber || i.originalInvoiceNumber || i.reference || '').toUpperCase() ===
          targetNum.toUpperCase()
      );
      if (found) {
        const baseTotal = found.financials?.total ?? found.totalAmount ?? 1000;
        inspectPayload = {
          ...found,
          dueDate: '2026-12-31',
          financials: found.financials
            ? {
                ...found.financials,
                total: baseTotal + 500, // Altered!
              }
            : undefined,
          totalAmount: baseTotal + 500,
        };
      }
    }

    const verification = verifyReference(targetNum, inspectPayload);
    setResult(verification);
  };

  // Perform initial verification on mount
  useEffect(() => {
    handleVerify('INV-2026-0042', false);
  }, []);

  // Associated stock position lookup
  const matchedInventory = result?.sku
    ? inventoryItems.find(i => i.sku === result.sku)
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100/80">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Source-Based Invoice Verification
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluates the invoice directly through its issuer, bilateral counterpart corroboration, SHA-256 document fingerprint, and multi-source stock provenance.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Single Invoice Identity
            </span>
          </div>
        </div>

        {/* Invoice Number Input Form */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <div className="relative flex-1">
            <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={invoiceNumberInput}
              onChange={e => setInvoiceNumberInput(e.target.value.toUpperCase())}
              placeholder="Enter Invoice Number (e.g. INV-2026-0042, NL-88402, INV-WH-500)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-mono border border-slate-300 rounded-xl uppercase tracking-wider text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          <button
            onClick={() => handleVerify(invoiceNumberInput, tamperSimulation)}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 active:scale-98 transition-all shadow-xs flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Verify Invoice</span>
          </button>
        </div>

        {/* Quick Test Scenarios */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">

          <button
            onClick={() => {
              const current = invoiceNumberInput || 'INV-2026-0042';
              const nextState = !tamperSimulation;
              setTamperSimulation(nextState);
              handleVerify(current, nextState);
            }}
            className={`px-2.5 py-1 rounded-lg font-sans text-[11px] font-semibold flex items-center space-x-1.5 transition-all ${
              tamperSimulation
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>{tamperSimulation ? 'Tampering Active (Reset)' : 'Simulate Altered Payload'}</span>
          </button>
        </div>
      </div>

      {/* Verification Result Display */}
      {result && (
        <div className="space-y-6">
          {/* Main Verdict Card */}
          <div
            className={`p-6 rounded-2xl border shadow-xs transition-all ${
              result.status === 'NOT_FOUND'
                ? 'bg-slate-50 border-slate-200'
                : result.integrity === 'MISMATCH'
                ? 'bg-rose-50/80 border-rose-200'
                : result.decisionStatus === 'Rejected'
                ? 'bg-rose-50/80 border-rose-200'
                : result.decisionStatus === 'Pending' || (result.bilateralMatch && !result.bilateralMatch.matched)
                ? 'bg-amber-50/80 border-amber-200'
                : 'bg-emerald-50/80 border-emerald-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    result.status === 'NOT_FOUND'
                      ? 'bg-slate-200 text-slate-700'
                      : result.integrity === 'MISMATCH' || result.decisionStatus === 'Rejected'
                      ? 'bg-rose-100 text-rose-700'
                      : result.decisionStatus === 'Pending' || (result.bilateralMatch && !result.bilateralMatch.matched)
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {result.status === 'NOT_FOUND' ? (
                    <XCircle className="w-7 h-7" />
                  ) : result.integrity === 'MISMATCH' || result.decisionStatus === 'Rejected' ? (
                    <AlertTriangle className="w-7 h-7" />
                  ) : result.decisionStatus === 'Pending' || (result.bilateralMatch && !result.bilateralMatch.matched) ? (
                    <Clock className="w-7 h-7" />
                  ) : (
                    <CheckCircle2 className="w-7 h-7" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {result.status === 'NOT_FOUND'
                        ? 'Invoice Record Not Found'
                        : result.integrity === 'MISMATCH'
                        ? 'Cryptographic Mismatch Detected'
                        : result.decisionStatus === 'Rejected'
                        ? 'Transaction Rejected'
                        : result.decisionStatus === 'Pending' || (result.bilateralMatch && !result.bilateralMatch.matched)
                        ? 'Under Review · Further Evidence Required'
                        : 'Transaction Verified & Approved'}
                    </h2>
                    <span className="font-mono text-xs px-2.5 py-0.5 bg-white/90 rounded-md border border-slate-300 font-bold text-slate-900 shadow-2xs">
                      {result.invoiceNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                    {result.explanation}
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex sm:flex-col items-start sm:items-end gap-1.5 shrink-0">
                <span
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-2xs ${
                    result.integrity === 'MISMATCH'
                      ? 'bg-rose-600 text-white'
                      : result.decisionStatus === 'Rejected'
                      ? 'bg-rose-600 text-white'
                      : result.decisionStatus === 'Pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {result.integrity === 'MISMATCH'
                    ? 'MISMATCH'
                    : result.decisionStatus || 'VERIFIED'}
                </span>

                {result.status === 'FOUND' && (
                  <span className="text-[11px] font-medium text-slate-600 bg-white/70 px-2 py-0.5 rounded border border-slate-200">
                    Issuer: <strong className="text-slate-900">{result.issuerVerification}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Tamper Discrepancy Box */}
            {result.integrity === 'MISMATCH' && result.tamperedFields && (
              <div className="mt-4 p-3.5 bg-white rounded-xl border border-rose-300 text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center space-x-1.5 text-rose-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Payload Integrity Failure against Canonical Hash:</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  The verified cryptographic fingerprint does not match the payload presented. The following fields differ from the canonical record:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {result.tamperedFields.map((field, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-rose-100 text-rose-800 font-semibold text-[11px] rounded border border-rose-200 font-mono"
                    >
                      Altered: {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result.status === 'FOUND' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: The Core Verification Pillars (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Pillar 1: Who Issued & Who Received the Invoice? */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>1. Issuing & Receiving Parties</span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      Issuer Identity Check
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Issuer Card */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Issuing Business (Origin)
                        </span>
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-medium text-[10px] rounded border border-indigo-100">
                          {result.issuerRole || 'Supplier'}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {result.issuerName}
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono mt-0.5">
                          <span>{result.issuerUsername}</span>
                          {result.issuerId && <span>· {result.issuerId}</span>}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 flex items-center space-x-1.5 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-emerald-700 font-medium">
                          Registered & Authenticated Business
                        </span>
                      </div>
                    </div>

                    {/* Buyer / Recipient Card */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Receiving Business (Buyer)
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-medium text-[10px] rounded border border-slate-200">
                          Trade Partner
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {result.buyerName}
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono mt-0.5">
                          <span>{result.buyerUsername || '@counterparty'}</span>
                          {result.buyerId && <span>· {result.buyerId}</span>}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 flex items-center space-x-1.5 text-[11px]">
                        <FileCheck2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="text-slate-600 font-medium">
                          Authorized Commercial Recipient
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pillar 2: Product, Quantities & Transaction Details */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Package className="w-4 h-4 text-indigo-600" />
                      <span>2. Product Covered & Recorded Quantities</span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      {result.transactionType === 'issued'
                        ? 'Outgoing Sale'
                        : result.transactionType === 'received'
                        ? 'Incoming Purchase'
                        : 'Commercial Invoice'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 text-[10px] block font-medium">Product</span>
                      <span className="font-bold text-slate-900 text-xs block truncate mt-0.5" title={result.productName}>
                        {result.productName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{result.brand}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 text-[10px] block font-medium">SKU</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
                        {result.sku}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 text-[10px] block font-medium">Recorded Quantity</span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm block mt-0.5">
                        {result.quantity?.toLocaleString()} <span className="text-xs font-normal text-slate-500">{result.unit}</span>
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 text-[10px] block font-medium">Total Amount</span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm block mt-0.5">
                        {formatCurrency(result.totalAmount || 0, result.currency || 'USD')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs pt-2 text-slate-500 border-t border-slate-100">
                    <div className="flex items-center space-x-4">
                      <span>Invoice Date: <strong className="text-slate-800 font-mono">{result.issueDate}</strong></span>
                      {result.dueDate && <span>Due Date: <strong className="text-slate-800 font-mono">{result.dueDate}</strong></span>}
                    </div>
                    {result.registeredRecord && (
                      <button
                        onClick={() => setSelectedInvoice(result.registeredRecord)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                      >
                        <span>Open Document Record</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Pillar 3: Does Issuer's Corresponding Record Support It? (Bilateral Corroboration) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Share2 className="w-4 h-4 text-indigo-600" />
                      <span>3. Bilateral Issuer Corroboration</span>
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        result.bilateralMatch?.matched
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {result.bilateralMatch?.matched ? 'Corroborated' : 'Pending Corroboration'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs space-y-2">
                    <div className="flex items-start space-x-2.5">
                      {result.bilateralMatch?.matched ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-900">
                          {result.bilateralMatch?.matched
                            ? 'Trade Counterpart Record Confirmed'
                            : 'Awaiting Counterpart Corroboration'}
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                          {result.bilateralMatch?.details ||
                            'The system verifies whether the issuer recorded a matching sales dispatch record for this buyer, product, and quantity.'}
                        </p>
                      </div>
                    </div>

                    {result.bilateralMatch?.counterpartInvoiceNumber && (
                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Corresponding Counterpart Invoice:</span>
                        <button
                          onClick={() => {
                            setInvoiceNumberInput(result.bilateralMatch!.counterpartInvoiceNumber!);
                            handleVerify(result.bilateralMatch!.counterpartInvoiceNumber!, false);
                          }}
                          className="font-mono font-bold text-indigo-600 hover:text-indigo-800 underline"
                        >
                          {result.bilateralMatch.counterpartInvoiceNumber}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pillar 4: Supporting Evidence & Document Fingerprint */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <FileCheck2 className="w-4 h-4 text-indigo-600" />
                      <span>4. Supporting Document Evidence & Fingerprint</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      SHA-256 Canonical Check
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                      <span className="text-slate-400 text-[10px] block font-medium">Document Attachment</span>
                      <div className="font-semibold text-slate-800 text-xs flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{result.documentDocRef || 'Official_Invoice_Record.pdf'}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">Status: Verified in Client Session</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                      <span className="text-slate-400 text-[10px] block font-medium">Integrity Assessment</span>
                      <div className="flex items-center space-x-1.5">
                        {result.integrity === 'MATCH' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-bold text-emerald-700 text-xs">Cryptographic Match</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span className="font-bold text-rose-700 text-xs">Hash Mismatch Detected</span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">Deterministic canonical representation</span>
                    </div>
                  </div>

                  {/* Fingerprint String */}
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1 overflow-hidden">
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>CANONICAL SHA-256 FINGERPRINT:</span>
                      <span className="text-emerald-400 font-sans font-semibold">256-bit Immutable</span>
                    </div>
                    <div className="break-all text-emerald-300 select-all">
                      {result.computedFingerprint || result.expectedFingerprint}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Stock Reconciliation & Upstream Intelligence (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Stock Position for this Product */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                    <Boxes className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      5. Stock Reconciliation
                    </h3>
                  </div>

                  {matchedInventory ? (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>Opening Stock:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {matchedInventory.openingStock.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>Approved Purchases:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            +{matchedInventory.totalApprovedPurchases.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>Approved Sales:</span>
                          <span className="font-mono font-bold text-rose-700">
                            -{matchedInventory.totalApprovedSales.toLocaleString()}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold">
                          <span className="text-slate-900">Current Stock:</span>
                          <span className="font-mono text-sm text-indigo-700">
                            {matchedInventory.currentStock.toLocaleString()} {matchedInventory.unit}
                          </span>
                        </div>
                      </div>

                      {/* Stock sufficiency check */}
                      {result.quantity && result.transactionType === 'issued' && (
                        <div
                          className={`p-3 rounded-xl border text-[11px] ${
                            matchedInventory.currentStock >= result.quantity
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          <div className="font-bold flex items-center space-x-1.5">
                            {matchedInventory.currentStock >= result.quantity ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>
                              {matchedInventory.currentStock >= result.quantity
                                ? 'Sufficient Available Stock'
                                : 'Stock Shortfall Detected'}
                            </span>
                          </div>
                          <p className="mt-1 leading-relaxed">
                            {matchedInventory.currentStock >= result.quantity
                              ? `Inventory supports the sold quantity of ${result.quantity} units without deficit.`
                              : `Invoice quantity (${result.quantity}) exceeds warehouse stock (${matchedInventory.currentStock}). Shortfall of ${result.quantity - matchedInventory.currentStock} units requires resolution.`}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 text-slate-500 rounded-xl text-xs">
                      No matching warehouse ledger entry for SKU {result.sku || 'N/A'}.
                    </div>
                  )}
                </div>

                {/* Auditable Decision Record */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Audit Trail Guarantee
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Decisions are permanently linked to the evaluating transaction, the evidence available at the time, and recorded in the append-only ledger.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Verified: {new Date().toISOString().split('T')[0]}</span>
                    <span>Single Invoice ID</span>
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
