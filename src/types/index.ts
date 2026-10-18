export type InvoiceStatus =
  | 'draft'
  | 'registered'
  | 'sent'
  | 'pending_review'
  | 'accepted'
  | 'rejected'
  | 'paid'
  | 'overdue'
  | 'due_today'
  | 'cancelled';

export type PaymentTerms =
  | 'Due on Receipt'
  | 'Net 7'
  | 'Net 14'
  | 'Net 30'
  | 'Net 60'
  | 'Custom';

export type InvoiceType =
  | 'Commercial Invoice'
  | 'Tax Invoice'
  | 'Proforma Invoice'
  | 'Credit Note';

export type TemplateStyle =
  | 'professional'
  | 'modern'
  | 'minimal'
  | 'corporate'
  | 'classic';

export interface LineItem {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  total: number;
}

export interface BusinessEntity {
  name: string;
  username: string;
  id: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  taxId?: string;
  vatNumber?: string;
  website?: string;
  logoUrl?: string;
  verified?: boolean;
}

export interface InvoiceFinancials {
  subtotal: number;
  itemDiscounts: number;
  invoiceDiscountPercent: number;
  invoiceDiscountAmount: number;
  shippingFee: number;
  additionalFees: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
}

export interface PaymentEvidence {
  id: string;
  invoiceId: string;
  invoiceRef: string;
  paymentMethod: 'Bank Transfer' | 'Credit/Debit Card' | 'PayPal' | 'Stripe' | 'Other';
  transactionId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  submittedAt: string;
  submittedBy: string;
  status: 'pending_review' | 'confirmed' | 'rejected';
  notes?: string;
  attachmentName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface Invoice {
  id: string;
  reference: string; // TrustLayer Reference e.g. TL-2026-8812-9014
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: PaymentTerms;
  poNumber?: string;
  customerRef?: string;
  currency: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  verificationStatus: 'verified' | 'unregistered' | 'mismatch' | 'pending_issuer';
  fingerprint?: string; // SHA-256 canonical hash
  registeredAt?: string;

  issuer: BusinessEntity;
  buyer: BusinessEntity;
  items: LineItem[];
  financials: InvoiceFinancials;

  paymentInfo: {
    methods: string[];
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    swiftBic?: string;
    instructions?: string;
  };

  deliveryDetails?: {
    shippingMethod?: string;
    trackingReference?: string;
    deliveryDate?: string;
    incoterms?: string;
    countryOfOrigin?: string;
  };

  additionalInfo: {
    notes?: string;
    terms?: string;
    signatoryName?: string;
    signatoryTitle?: string;
  };

  template: {
    name: TemplateStyle;
    primaryColor: string;
    showLogo: boolean;
    compact: boolean;
  };

  paymentEvidence?: PaymentEvidence[];
  rejectionReason?: string;
  originalInvoiceReference?: string;
  correctedInvoiceReference?: string;
  isDemo?: boolean;
}

export interface ActivityEvent {
  id: string;
  type:
    | 'draft_created'
    | 'registered'
    | 'sent'
    | 'received'
    | 'accepted'
    | 'rejected'
    | 'payment_evidence_submitted'
    | 'payment_confirmed'
    | 'payment_rejected'
    | 'verified'
    | 'mismatch_detected'
    | 'downloaded'
    | 'corrected';
  invoiceId?: string;
  invoiceRef?: string;
  invoiceNumber?: string;
  actor: string;
  timestamp: string;
  details: string;
}

export interface MessageItem {
  id: string;
  senderId: string; // 'me' or counterparty username
  text?: string;
  timestamp: string;
  isInvoiceShare?: boolean;
  sharedInvoiceRef?: string;
  sharedInvoice?: {
    reference: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    dueDate: string;
    status: InvoiceStatus;
  };
}

export interface MessageThread {
  id: string;
  participant: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    rating: string;
  };
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: MessageItem[];
}
