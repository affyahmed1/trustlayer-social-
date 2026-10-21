import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice, LineItem, PaymentTerms, InvoiceType, TemplateStyle } from '../types';
import { calculateFinancials, calculateLineTotal } from '../utils/finance';
import { InvoiceDocument } from './InvoiceDocument';
import {
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Send,
  Eye,
  FileDown,
  RefreshCw,
  Sliders,
  Building,
  User,
  CreditCard,
  Truck,
  FileText,
  Palette,
  AlertCircle,
  Copy,
  ChevronDown,
} from 'lucide-react';

const INITIAL_ITEM: LineItem = {
  id: 'item-1',
  name: '',
  description: '',
  sku: '',
  quantity: 1,
  unit: 'units',
  unitPrice: 0,
  discountPercent: 0,
  taxRate: 0,
  total: 0,
};

export const InvoiceBuilder: React.FC = () => {
  const {
    activeProfile,
    counterparties,
    invoices,
    saveInvoiceDraft,
    registerInvoice,
    sendInvoice,
    editingInvoice,
    setEditingInvoice,
    setCurrentTab,
    setSelectedInvoice,
  } = useApp();

  // Form state
  const [invoiceId, setInvoiceId] = useState(() => editingInvoice?.id || `inv-${Date.now()}`);
  const [invoiceNumber, setInvoiceNumber] = useState(
    () => editingInvoice?.invoiceNumber || `INV-2026-00${invoices.length + 1}`
  );
  const [reference, setReference] = useState(() => editingInvoice?.reference || '');
  const [issueDate, setIssueDate] = useState(
    () => editingInvoice?.issueDate || new Date().toISOString().split('T')[0]
  );

  // Default due date: +14 days
  const [dueDate, setDueDate] = useState(() => {
    if (editingInvoice?.dueDate) return editingInvoice.dueDate;
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(
    () => editingInvoice?.paymentTerms || 'Net 14'
  );
  const [poNumber, setPoNumber] = useState(() => editingInvoice?.poNumber || '');
  const [customerRef, setCustomerRef] = useState(() => editingInvoice?.customerRef || '');
  const [currency, setCurrency] = useState(() => editingInvoice?.currency || 'USD');
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(
    () => editingInvoice?.invoiceType || 'Commercial Invoice'
  );

  // Issuer Details
  const [issuer, setIssuer] = useState(() => editingInvoice?.issuer || activeProfile);

  // Buyer Details
  const [buyer, setBuyer] = useState(
    () =>
      editingInvoice?.buyer || {
        name: '',
        username: '',
        id: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        country: 'United States',
        taxId: '',
      }
  );

  // Line items
  const [items, setItems] = useState<LineItem[]>(() => {
    if (editingInvoice?.items && editingInvoice.items.length > 0) {
      return editingInvoice.items;
    }
    return [
      {
        id: 'li-1',
        name: 'Enterprise Software Subscription',
        description: 'Multi-seat commercial access tier',
        sku: 'ESS-01',
        quantity: 1,
        unit: 'license',
        unitPrice: 1200,
        discountPercent: 0,
        taxRate: 8,
        total: 1200,
      },
    ];
  });

  // Financial adjustments
  const [invoiceDiscountPercent, setInvoiceDiscountPercent] = useState(
    () => editingInvoice?.financials?.invoiceDiscountPercent || 0
  );
  const [shippingFee, setShippingFee] = useState(
    () => editingInvoice?.financials?.shippingFee || 0
  );
  const [additionalFees, setAdditionalFees] = useState(
    () => editingInvoice?.financials?.additionalFees || 0
  );

  // Payment information
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    () => editingInvoice?.paymentInfo?.methods || ['Bank Transfer', 'Stripe']
  );
  const [bankName, setBankName] = useState(
    () => editingInvoice?.paymentInfo?.bankName || 'JPMorgan Chase Commercial Bank'
  );
  const [accountHolder, setAccountHolder] = useState(
    () => editingInvoice?.paymentInfo?.accountHolder || activeProfile.name
  );
  const [accountNumber, setAccountNumber] = useState(
    () => editingInvoice?.paymentInfo?.accountNumber || '99281740192'
  );
  const [swiftBic, setSwiftBic] = useState(
    () => editingInvoice?.paymentInfo?.swiftBic || 'CHASUS33XXX'
  );
  const [paymentInstructions, setPaymentInstructions] = useState(
    () =>
      editingInvoice?.paymentInfo?.instructions ||
      'Please state invoice number in wire transfer description.'
  );

  // Commercial / Delivery
  const [shippingMethod, setShippingMethod] = useState(
    () => editingInvoice?.deliveryDetails?.shippingMethod || 'Standard Carrier'
  );
  const [trackingReference, setTrackingReference] = useState(
    () => editingInvoice?.deliveryDetails?.trackingReference || ''
  );
  const [incoterms, setIncoterms] = useState(
    () => editingInvoice?.deliveryDetails?.incoterms || 'DDP'
  );

  // Additional Info
  const [notes, setNotes] = useState(
    () =>
      editingInvoice?.additionalInfo?.notes ||
      'Thank you for your business. Please remit payment on or before the due date.'
  );
  const [terms, setTerms] = useState(
    () =>
      editingInvoice?.additionalInfo?.terms ||
      'Standard commercial terms apply. Undisputed balances subject to 1.5% monthly late fee.'
  );
  const [signatoryName, setSignatoryName] = useState(
    () => editingInvoice?.additionalInfo?.signatoryName || activeProfile.contactPerson
  );
  const [signatoryTitle, setSignatoryTitle] = useState(
    () => editingInvoice?.additionalInfo?.signatoryTitle || 'Authorized Officer'
  );

  // Template & Customization
  const [templateName, setTemplateName] = useState<TemplateStyle>(
    () => editingInvoice?.template?.name || 'professional'
  );
  const [primaryColor, setPrimaryColor] = useState(
    () => editingInvoice?.template?.primaryColor || '#2563EB'
  );
  const [showLogo, setShowLogo] = useState(
    () => editingInvoice?.template?.showLogo ?? true
  );

  // Active form section
  const [activeSection, setActiveSection] = useState<'details' | 'parties' | 'items' | 'payment' | 'delivery' | 'template'>('details');

  // Preview toggle for mobile/tablet
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check for duplicate invoice number within issuer records
  const isDuplicateNumber = useMemo(() => {
    return invoices.some(
      i =>
        i.id !== invoiceId &&
        i.invoiceNumber.trim().toLowerCase() === invoiceNumber.trim().toLowerCase() &&
        i.issuer.name.toLowerCase() === issuer.name.toLowerCase()
    );
  }, [invoices, invoiceId, invoiceNumber, issuer.name]);

  // Recalculate line totals whenever line item props change
  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };
      if (['quantity', 'unitPrice', 'discountPercent'].includes(field as string)) {
        item.total = calculateLineTotal(item.quantity, item.unitPrice, item.discountPercent);
      }
      copy[index] = item;
      return copy;
    });
  };

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `li-${Date.now()}`,
        name: '',
        description: '',
        sku: '',
        quantity: 1,
        unit: 'units',
        unitPrice: 0,
        discountPercent: 0,
        taxRate: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Financial calculations
  const financials = useMemo(() => {
    return calculateFinancials({
      items,
      invoiceDiscountPercent,
      shippingFee,
      additionalFees,
      amountPaid: editingInvoice?.financials?.amountPaid || 0,
    });
  }, [items, invoiceDiscountPercent, shippingFee, additionalFees, editingInvoice]);

  // Compile active invoice object
  const currentInvoiceData: Invoice = useMemo(() => {
    return {
      id: invoiceId,
      reference,
      invoiceNumber: invoiceNumber.trim() || 'INV-DRAFT',
      issueDate,
      dueDate,
      paymentTerms,
      poNumber: poNumber.trim() || undefined,
      customerRef: customerRef.trim() || undefined,
      currency,
      invoiceType,
      status: (editingInvoice?.status as any) || 'draft',
      verificationStatus: reference ? 'verified' : 'unregistered',
      fingerprint: editingInvoice?.fingerprint,
      registeredAt: editingInvoice?.registeredAt,
      issuer,
      buyer,
      items,
      financials,
      paymentInfo: {
        methods: paymentMethods,
        bankName,
        accountHolder,
        accountNumber,
        swiftBic,
        instructions: paymentInstructions,
      },
      deliveryDetails: {
        shippingMethod,
        trackingReference: trackingReference.trim() || undefined,
        deliveryDate: dueDate,
        incoterms,
      },
      additionalInfo: {
        notes,
        terms,
        signatoryName,
        signatoryTitle,
      },
      template: {
        name: templateName,
        primaryColor,
        showLogo,
        compact: false,
      },
    };
  }, [
    invoiceId,
    reference,
    invoiceNumber,
    issueDate,
    dueDate,
    paymentTerms,
    poNumber,
    customerRef,
    currency,
    invoiceType,
    editingInvoice,
    issuer,
    buyer,
    items,
    financials,
    paymentMethods,
    bankName,
    accountHolder,
    accountNumber,
    swiftBic,
    paymentInstructions,
    shippingMethod,
    trackingReference,
    incoterms,
    notes,
    terms,
    signatoryName,
    signatoryTitle,
    templateName,
    primaryColor,
    showLogo,
  ]);

  const handleGenerateInvoiceNumber = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-2026-${randomSuffix}`);
  };

  const handleSelectCounterparty = (cp: (typeof counterparties)[0]) => {
    setBuyer({
      name: cp.name,
      username: cp.username,
      id: cp.id,
      contactPerson: cp.contactPerson,
      email: cp.email,
      phone: cp.phone,
      address: cp.address,
      country: cp.country,
      taxId: cp.taxId || '',
    });
  };

  const validateForm = () => {
    if (!invoiceNumber.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Invoice number is required.' });
      return false;
    }
    if (isDuplicateNumber) {
      setFeedbackMessage({
        type: 'error',
        text: 'Duplicate invoice number exists. Enter a unique number.',
      });
      return false;
    }
    if (!buyer.name.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Customer name is required.' });
      return false;
    }
    if (items.length === 0 || !items[0].name.trim()) {
      setFeedbackMessage({ type: 'error', text: 'At least one line item with a name is required.' });
      return false;
    }
    return true;
  };

  const handleSaveDraft = () => {
    if (!invoiceNumber.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please enter an invoice number to save draft.' });
      return;
    }
    saveInvoiceDraft(currentInvoiceData);
    setFeedbackMessage({ type: 'success', text: 'Draft saved successfully.' });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleRegister = () => {
    if (!validateForm()) return;
    const reg = registerInvoice(currentInvoiceData);
    setReference(reg.invoiceNumber);
    setFeedbackMessage({
      type: 'success',
      text: `Invoice ${reg.invoiceNumber} registered successfully with TrustLayer.`,
    });
    setTimeout(() => {
      setEditingInvoice(null);
      setSelectedInvoice(reg);
      setCurrentTab('home');
    }, 1500);
  };

  const handleSend = () => {
    if (!validateForm()) return;
    let target = currentInvoiceData;
    if (!target.fingerprint) {
      target = registerInvoice(currentInvoiceData);
      setReference(target.invoiceNumber);
    }
    sendInvoice(target.id, target.buyer.username);
    setFeedbackMessage({
      type: 'success',
      text: `Invoice ${target.invoiceNumber} registered & sent to ${target.buyer.name}.`,
    });
    setTimeout(() => {
      setEditingInvoice(null);
      setCurrentTab('home');
    }, 1500);
  };

  const handlePrintOrDownload = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">
              {editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
            </h1>
            {invoiceNumber && (
              <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">
                {invoiceNumber}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete invoice details, select template, and register record with TrustLayer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="lg:hidden inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showMobilePreview ? 'Show Form' : 'Preview Document'}</span>
          </button>

          <button
            onClick={handleSaveDraft}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePrintOrDownload}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleRegister}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 active:scale-98 transition-all shadow-xs"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Register Invoice</span>
          </button>

          <button
            onClick={handleSend}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 active:scale-98 transition-all shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Invoice</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Grid: Builder Form on Left, Live Document Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 7 cols */}
        <div className={`lg:col-span-6 space-y-5 ${showMobilePreview ? 'hidden lg:block' : 'block'}`}>
          {/* Section Navigation Tabs */}
          <div className="flex space-x-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveSection('details')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeSection === 'details'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveSection('parties')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeSection === 'parties'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Buyer & Issuer
            </button>
            <button
              onClick={() => setActiveSection('items')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeSection === 'items'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Line Items ({items.length})
            </button>
            <button
              onClick={() => setActiveSection('payment')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeSection === 'payment'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payment
            </button>
            <button
              onClick={() => setActiveSection('delivery')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeSection === 'delivery'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shipping & Terms
            </button>
            <button
              onClick={() => setActiveSection('template')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeSection === 'template'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Template
            </button>
          </div>

          {/* SECTION A: Invoice Details */}
          {activeSection === 'details' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Invoice Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                        isDuplicateNumber ? 'border-rose-300 bg-rose-50' : 'border-slate-300'
                      }`}
                      placeholder="INV-2026-0001"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateInvoiceNumber}
                      title="Generate unique number"
                      className="px-2.5 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {isDuplicateNumber && (
                    <p className="text-[11px] text-rose-600 mt-1">Invoice number already exists.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Type
                  </label>
                  <select
                    value={invoiceType}
                    onChange={e => setInvoiceType(e.target.value as InvoiceType)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Commercial Invoice">Commercial Invoice</option>
                    <option value="Tax Invoice">Tax Invoice</option>
                    <option value="Proforma Invoice">Proforma Invoice</option>
                    <option value="Credit Note">Credit Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={e => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={e => {
                      const val = e.target.value as PaymentTerms;
                      setPaymentTerms(val);
                      // Adjust due date automatically based on terms
                      const d = new Date(issueDate);
                      if (val === 'Due on Receipt') d.setDate(d.getDate());
                      if (val === 'Net 7') d.setDate(d.getDate() + 7);
                      if (val === 'Net 14') d.setDate(d.getDate() + 14);
                      if (val === 'Net 30') d.setDate(d.getDate() + 30);
                      if (val === 'Net 60') d.setDate(d.getDate() + 60);
                      setDueDate(d.toISOString().split('T')[0]);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 7">Net 7</option>
                    <option value="Net 14">Net 14</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="USD">USD ($) — US Dollar</option>
                    <option value="EUR">EUR (€) — Euro</option>
                    <option value="GBP">GBP (£) — British Pound</option>
                    <option value="CAD">CAD ($) — Canadian Dollar</option>
                    <option value="AUD">AUD ($) — Australian Dollar</option>
                    <option value="SGD">SGD ($) — Singapore Dollar</option>
                    <option value="JPY">JPY (¥) — Japanese Yen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="PO-2026-99"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Reference
                  </label>
                  <input
                    type="text"
                    value={customerRef}
                    onChange={e => setCustomerRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="Project Delta"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION B & C: Buyer & Issuer */}
          {activeSection === 'parties' && (
            <div className="space-y-4">
              {/* Buyer / Customer */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>Buyer / Customer Details</span>
                  </h2>

                  {/* Fast Counterparty Selector */}
                  <div className="flex items-center space-x-1.5 text-xs">
                    <span className="text-slate-400">Quick select:</span>
                    {counterparties.map(cp => (
                      <button
                        key={cp.id}
                        type="button"
                        onClick={() => handleSelectCounterparty(cp)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium text-slate-700"
                      >
                        {cp.username}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Business or Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={buyer.name}
                      onChange={e => setBuyer({ ...buyer, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nexus Global Logistics"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      TrustLayer Username
                    </label>
                    <input
                      type="text"
                      value={buyer.username || ''}
                      onChange={e => setBuyer({ ...buyer, username: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      placeholder="@nexusglobal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={buyer.contactPerson || ''}
                      onChange={e => setBuyer({ ...buyer, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      placeholder="Elena Rostova"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={buyer.email || ''}
                      onChange={e => setBuyer({ ...buyer, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      placeholder="accounts@nexusglobal.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Billing Address
                    </label>
                    <input
                      type="text"
                      value={buyer.address || ''}
                      onChange={e => setBuyer({ ...buyer, address: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      placeholder="14 Canary Wharf Pier, London, E14 5AB"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={buyer.country || ''}
                      onChange={e => setBuyer({ ...buyer, country: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      placeholder="United Kingdom"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tax / VAT ID
                    </label>
                    <input
                      type="text"
                      value={buyer.taxId || ''}
                      onChange={e => setBuyer({ ...buyer, taxId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      placeholder="GB99241023"
                    />
                  </div>
                </div>
              </div>

              {/* Issuer Profile Information */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>Issuer Profile (Billed From)</span>
                </h2>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{issuer.name}</div>
                    <div className="text-slate-500 text-[11px]">
                      {issuer.username} &bull; {issuer.id} &bull; {issuer.email}
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                    Current Active Profile
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION D: Line Items & Summary */}
          {activeSection === 'items' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-slate-900">Line Items</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500 text-[11px]">#{idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-8">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleItemChange(idx, 'name', e.target.value)}
                          placeholder="Product or service name *"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={item.sku || ''}
                          onChange={e => handleItemChange(idx, 'sku', e.target.value)}
                          placeholder="SKU / Code"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={e => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="Optional description / specification"
                      className="w-full px-2.5 py-1.5 text-[11px] border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e =>
                            handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white text-right focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                          placeholder="units"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                          Unit Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={e =>
                            handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white text-right font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                          Disc %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={e =>
                            handleItemChange(
                              idx,
                              'discountPercent',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white text-right focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                          Tax %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.taxRate}
                          onChange={e =>
                            handleItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white text-right focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Adjustments */}
              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Invoice Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={invoiceDiscountPercent}
                    onChange={e => setInvoiceDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-right"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Shipping & Freight Fee
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingFee}
                    onChange={e => setShippingFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-right font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Additional Fees
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={additionalFees}
                    onChange={e => setAdditionalFees(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-right font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION F: Payment Information */}
          {activeSection === 'payment' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Payment Information & Instructions</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    placeholder="JPMorgan Chase Commercial Bank"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Holder</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={e => setAccountHolder(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    placeholder="Apex Supply Co."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Account / IBAN
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    placeholder="99281740192"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    SWIFT / BIC Code
                  </label>
                  <input
                    type="text"
                    value={swiftBic}
                    onChange={e => setSwiftBic(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    placeholder="CHASUS33XXX"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={paymentInstructions}
                    onChange={e => setPaymentInstructions(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    placeholder="State invoice reference in wire transmission remarks."
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION G & H: Delivery & Terms */}
          {activeSection === 'delivery' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Commercial Delivery & Terms</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Shipping Method
                  </label>
                  <input
                    type="text"
                    value={shippingMethod}
                    onChange={e => setShippingMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Express Air Freight"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tracking Reference
                  </label>
                  <input
                    type="text"
                    value={trackingReference}
                    onChange={e => setTrackingReference(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="1Z99281A0399120"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Incoterms</label>
                  <select
                    value={incoterms}
                    onChange={e => setIncoterms(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="DDP">DDP — Delivered Duty Paid</option>
                    <option value="FOB">FOB — Free On Board</option>
                    <option value="CIF">CIF — Cost, Insurance and Freight</option>
                    <option value="EXW">EXW — Ex Works</option>
                    <option value="DAP">DAP — Delivered At Place</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Authorized Signatory
                  </label>
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={e => setSignatoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="David Vance"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Notes to Buyer</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Standard warranty or special instructions..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    rows={2}
                    value={terms}
                    onChange={e => setTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Legal terms of settlement..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION I: Template Selection & Customization */}
          {activeSection === 'template' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>Invoice Template & Styling</span>
              </h2>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 block">
                  Select Design Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'professional', name: 'Professional', desc: 'Corporate navy tone' },
                    { id: 'modern', name: 'Modern', desc: 'Vibrant indigo accents' },
                    { id: 'minimal', name: 'Minimal', desc: 'Crisp Scandinavian lines' },
                    { id: 'corporate', name: 'Corporate', desc: 'Formal structured slate' },
                    { id: 'classic', name: 'Classic', desc: 'Refined serif typography' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateName(t.id as TemplateStyle)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        templateName === t.id
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center space-x-2">
                    {['#2563EB', '#4F46E5', '#0F172A', '#059669', '#7C3AED', '#DC2626'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPrimaryColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          primaryColor === c ? 'scale-115 border-slate-900' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="w-7 h-7 rounded border cursor-pointer ml-2"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Display Business Emblem</span>
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={e => setShowLogo(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Document Preview (6 cols on wide screens) */}
        <div className={`lg:col-span-6 ${showMobilePreview ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-20 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                Live Document Preview
              </span>
              <span className="text-[11px] text-slate-400">
                Template: <strong className="text-slate-700 capitalize">{templateName}</strong>
              </span>
            </div>

            <InvoiceDocument invoice={currentInvoiceData} />
          </div>
        </div>
      </div>
    </div>
  );
};
