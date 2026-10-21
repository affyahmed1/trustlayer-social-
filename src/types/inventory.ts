export type PaymentStatus =
  | 'Paid'
  | 'Unpaid'
  | 'Payment Pending'
  | 'Partially Paid'
  | 'Refunded';

export type DecisionStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Reversed';

export type VerificationStatus =
  | 'Not Checked'
  | 'Verification Pending'
  | 'Consistent'
  | 'Inconsistency Detected'
  | 'Insufficient Evidence'
  | 'Under Investigation';

export type StockVerificationStatus =
  | 'verified'
  | 'unverified'
  | 'investigation_required'
  | 'discrepancy_detected';

export interface InventoryItem {
  productId: string;
  productName: string;
  sku: string;
  brand: string;
  businessId: string;
  businessUsername: string;
  openingStock: number;
  openingStockSource: string;
  openingStockVerified: boolean;
  totalApprovedPurchases: number;
  totalApprovedSales: number;
  authorizedAdjustments: number;
  currentStock: number; // Formula: openingStock + totalApprovedPurchases - totalApprovedSales + authorizedAdjustments
  stockVerificationStatus: StockVerificationStatus;
  lastUpdated: string;
  unit: string;
  supportedQuantity?: number; // Quantity traceable through verified upstream provenance
  unsupportedQuantity?: number;
}

export type InventoryMovementType =
  | 'OPENING_BALANCE'
  | 'PURCHASE_RECEIPT'
  | 'SALE_DISPATCH'
  | 'MANUAL_ADJUSTMENT'
  | 'RETURN_INWARD'
  | 'RETURN_OUTWARD';

export interface InventoryMovement {
  id: string;
  businessId: string;
  businessUsername: string;
  productId: string;
  type: InventoryMovementType;
  quantity: number; // Positive for additions, negative for reductions
  referenceInvoiceId?: string;
  referenceInvoiceNumber?: string;
  referenceDocId?: string;
  timestamp: string;
  actor: string;
  notes: string;
  idempotencyKey: string;
}

export interface InvoiceDocumentAttachment {
  id: string;
  fileName: string;
  fileType: string; // 'application/pdf' | 'image/png' | 'image/jpeg' | ...
  fileSize: number; // in bytes
  dataUrl?: string; // base64 or object URL
  uploadedAt: string;
  storageType: 'session_demo' | 'durable_cloud';
  fingerprint?: string;
}

export interface IssuedInvoiceRecord {
  id: string; // TrustLayer Record ID, e.g. TL-REC-2026-901
  originalInvoiceNumber: string;
  issueDate: string;
  issuingBusinessId: string;
  issuingBusinessName: string;
  issuingBusinessUsername: string;
  buyerBusinessId: string;
  buyerBusinessName: string;
  buyerBusinessUsername: string;
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentDate?: string;
  invoiceDocRef: string;
  documentAttachment?: InvoiceDocumentAttachment;
  decisionStatus: DecisionStatus;
  decisionBy?: string;
  decisionAt?: string;
  rejectionReason?: string;
  verificationStatus: VerificationStatus;
  linkedReceivedInvoiceRef?: string;
  inventoryMovementApplied: boolean;
  createdAt: string;
  updatedAt: string;
  fingerprint?: string; // SHA-256 canonical hash
}

export interface ReceivedInvoiceRecord {
  id: string; // TrustLayer Record ID, e.g. TL-REC-2026-802
  originalInvoiceNumber: string;
  issueDate: string;
  supplierBusinessId: string;
  supplierBusinessName: string;
  supplierBusinessUsername: string;
  receivingBusinessId: string;
  receivingBusinessName: string;
  receivingBusinessUsername: string;
  productId: string;
  productName: string;
  sku: string;
  quantityPurchased: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentDate?: string;
  invoiceDocRef: string;
  documentAttachment?: InvoiceDocumentAttachment;
  decisionStatus: DecisionStatus;
  decisionBy?: string;
  decisionAt?: string;
  rejectionReason?: string;
  verificationStatus: VerificationStatus;
  linkedIssuedInvoiceRef?: string;
  inventoryMovementApplied: boolean;
  createdAt: string;
  updatedAt: string;
  fingerprint?: string;
}

export interface MatchedRecordSummary {
  recordId: string;
  type: 'ISSUED_MATCH' | 'RECEIVED_MATCH' | 'LEDGER_ENTRY' | 'UPSTREAM_INVOICE';
  entityName: string;
  invoiceNumber: string;
  quantity: number;
  date: string;
  status: string;
}

export interface UpstreamHopFinding {
  tierLevel: number; // 0 = Brand, 1 = Distributor, 2 = Wholesaler, 3 = Supplier
  businessName: string;
  businessUsername: string;
  role: string;
  invoiceNumber: string;
  recordId: string;
  quantitySupplied: number;
  date: string;
  status: 'VERIFIED' | 'MISSING_LINK' | 'PARTIAL' | 'UNREGISTERED';
  notes: string;
  isRedacted?: boolean;
  redactionReason?: string;
}

export interface DownstreamHopFinding {
  tierLevel: number;
  businessName: string;
  businessUsername: string;
  role: string;
  invoiceNumber: string;
  quantityReceived: number;
  date: string;
  status: 'VERIFIED' | 'MISSING_LINK' | 'PARTIAL';
  notes: string;
}

export interface RiskIndicator {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
}

export interface IntelligenceReport {
  runId: string;
  transactionRef: string;
  invoiceNumber: string;
  transactionType: 'issued' | 'received';
  productName: string;
  sku: string;
  requestedQuantity: number;
  overallResult:
    | 'Consistent'
    | 'Inconsistency Detected'
    | 'Insufficient Evidence'
    | 'Verification Pending'
    | 'Rejected Transaction'
    | 'Potential Risk';
  evidenceCompleteness: number; // 0 - 100%
  matchedRecords: MatchedRecordSummary[];
  upstreamChain: UpstreamHopFinding[];
  downstreamChain: DownstreamHopFinding[];
  quantityReconciliation: {
    openingStock: number;
    approvedPurchases: number;
    approvedSales: number;
    currentStock: number;
    supportedQuantity: number;
    unsupportedQuantity: number;
    isBalanced: boolean;
  };
  missingEvidence: string[];
  detectedConflicts: string[];
  riskIndicators: RiskIndicator[];
  explanation: string;
  recommendedNextAction: string;
  timestamp: string;
  requestorRole?: string;
  isScopedView?: boolean;
  auditTrailId?: string;
}
