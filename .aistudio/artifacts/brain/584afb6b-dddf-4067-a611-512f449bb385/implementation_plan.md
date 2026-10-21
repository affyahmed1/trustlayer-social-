# TrustLayer — Invoice Sheet Architecture & Verification Refinement

This plan details the upgrade of TrustLayer's **Received Invoices (Sheet C)** and **Issued Invoices (Sheet B)** sheets to meet production financial and supply-chain inspection requirements. It establishes an exact 11-column tabular structure, independent combinable filters with stateful pagination, client-side PDF/image document uploads with live previews, a comprehensive deep-inspection modal linking invoice transactions to ledger movements and recursive reconciliation findings, and strict operational decoupling between payment, decision, and verification statuses.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Key Architecture Decisions for Review:**
> - **Document Storage Strategy**: In accordance with rule 4, uploaded invoice documents (PDFs and images) will be stored client-side in browser memory (`URL.createObjectURL` & base64/data URLs in localStorage/session) with clear UI labeling indicating **Client Session Storage (Demo Environment)** rather than durable cloud object storage (e.g. S3/GCS bucket).
> - **Strict 11-Column Tabular Ordering**: Both sheets will implement the exact 11 columns mandated, with `Product Name` and `SKU` permanently decoupled into separate sortable columns.
> - **Three-Status Orthogonality**: Payment Status (`Paid`, `Unpaid`, `Payment Pending`, `Partially Paid`, `Refunded`), Decision Status (`Pending`, `Approved`, `Rejected`, `Reversed`), and Verification Status (`Not Checked`, `Verification Pending`, `Consistent`, `Inconsistency Detected`, `Insufficient Evidence`, `Under Investigation`) will remain completely decoupled. Uploading an invoice or receiving payment will never silently alter inventory or auto-approve records.

---

## 1. Overview & Core Concept

TrustLayer operates as an evidence-based supply-chain verification and inventory ledger platform. The invoice sheets (Sheet B for sales, Sheet C for purchases) provide commercial counterparties and auditors with auditable trade records that feed into the immutable inventory movement ledger and the recursive multi-tier supply chain reconciliation engine.

### Key Value Delivered
- **Precision Data Hierarchy**: Standardized 11-column tabular layout ensuring parity between buyer and supplier audit logs.
- **Multi-Facet Search & Filter Matrix**: Real-time combined filtering across payment, decision, verification, date range, counterparty, product name, and SKU, maintaining filter persistence across paginated slices.
- **Auditable Document Ingestion**: In-browser PDF and image upload with MIME validation (PDF, PNG, JPEG, WEBP), file-size limits (max 10MB), upload progress simulation, and interactive preview modal.
- **Unified Deep Inspection**: Clicking any `Invoice No.` launches a comprehensive inspection panel bringing together transaction metadata, counterparty entity verification, document preview, linked inventory movements (`PURCHASE_RECEIPT`, `SALE_DISPATCH`, `RETURN_INWARD`, `RETURN_OUTWARD`), and the live recursive intelligence report.

---

## 2. User Experience & Visual Design

### 2.1 Tabular Column Layouts (Exact Order)

#### Sheet C: Received Invoices (Purchasing)
```
┌────┬─────────────┬────────────┬─────────────────┬──────────────┬────────────┬──────────────────┬──────────────┬────────────────┬─────────────────┬─────────────────────┬─────────┐
│ #  │ Invoice No. │ Issue Date │ Supplier Entity │ Product Name │    SKU     │ Qty Purchased    │ Total Amount │ Payment Status │ Decision Status │ Verification Status │ Actions │
├────┼─────────────┼────────────┼─────────────────┼──────────────┼────────────┼──────────────────┼──────────────┼────────────────┼─────────────────┼─────────────────────┼─────────┤
│ 1  │ NL-88402    │ 2026-09-25 │ Meridian Wholes.│ Ind. Sensor  │ ISA-X4-BLK │ 300 units        │ $114,000.00  │ Paid           │ Approved        │ Consistent          │ [⋯]     │
└────┴─────────────┴────────────┴─────────────────┴──────────────┴────────────┴──────────────────┴──────────────┴────────────────┴─────────────────┴─────────────────────┴─────────┘
```

#### Sheet B: Issued Invoices (Sales)
```
┌────┬─────────────┬────────────┬─────────────────┬──────────────┬────────────┬──────────────────┬──────────────┬────────────────┬─────────────────┬─────────────────────┬─────────┐
│ #  │ Invoice No. │ Issue Date │ Buyer Entity    │ Product Name │    SKU     │ Quantity Sold    │ Total Amount │ Payment Status │ Decision Status │ Verification Status │ Actions │
├────┼─────────────┼────────────┼─────────────────┼──────────────┼────────────┼──────────────────┼──────────────┼────────────────┼─────────────────┼─────────────────────┼─────────┤
│ 1  │ INV-2026-042│ 2026-10-02 │ Nexus Global    │ Ind. Sensor  │ ISA-X4-BLK │ 200 units        │ $84,000.00   │ Paid           │ Approved        │ Consistent          │ [⋯]     │
└────┴─────────────┴────────────┴─────────────────┴──────────────┴────────────┴──────────────────┴──────────────┴────────────────┴─────────────────┴─────────────────────┴─────────┘
```

### 2.2 Independent Filter Matrix Bar
Located directly above each table:
- **Global Search**: Substring match on invoice number, party name, product name, or SKU.
- **Payment Status Filter**: Multi-option selector (`All`, `Paid`, `Unpaid`, `Payment Pending`, `Partially Paid`, `Refunded`).
- **Decision Status Filter**: Selector (`All`, `Pending`, `Approved`, `Rejected`, `Reversed`).
- **Verification Status Filter**: Selector (`All`, `Not Checked`, `Verification Pending`, `Consistent`, `Inconsistency Detected`, `Insufficient Evidence`, `Under Investigation`).
- **Date Range Inputs**: ISO Date picker (`Start Date` to `End Date`) filtering against `issueDate`.
- **Entity Filter**: Dynamic dropdown of active trading partners (Suppliers in Sheet C, Buyers in Sheet B).
- **Product Name Filter**: Dynamic dropdown of tracked catalog products.
- **SKU Filter**: Text search or dropdown of unique SKUs.
- **Pagination**: Controlled 10 / 25 / 50 rows per page with active record count indicator (`Showing 1–10 of 42 records`) and page jump controls. Filter state resets page to 1 automatically without dropping filter parameters.

### 2.3 Invoice Document Upload Flow
- **Trigger**: Primary `Upload Invoice` button in top action bar of both sheets.
- **Modal Dialog**:
  - File Dropzone accepting `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp` (Max 10MB).
  - Validation: Real-time file type and size check with user-facing rejection feedback.
  - Upload Progress Bar: Animated progress indicator (0% → 100%) with simulated cryptographic checksum computation.
  - Metadata Association: Allows selecting or typing the target Invoice Number, Document Reference Title, and Document Type.
  - Environmental Transparency Banner: Explicitly notes *"Document stored in active session storage for demo verification. Connect Cloud SQL / Blob storage for durable compliance archival."*
  - Preview: Instant thumbnail or embedded PDF viewport preview.

### 2.4 Deep Invoice Details Modal / Drawer
Triggered by clicking any `Invoice No.` link:
1. **Header**: Original Invoice Number, TrustLayer Record ID (`TL-REC-YYYY-XXXX`), and quick status badges.
2. **Commercial Parties**: Issuing Entity and Receiving Entity, with verified registry badges and contact usernames.
3. **Item & Financial Specs**: Separate Product Name, SKU, Quantity, Unit of Measure, Unit Price, Currency, Subtotal, Taxes, and Total Amount.
4. **Three-Status Orthogonality Grid**:
   - Payment Status + Payment Date + Evidence Reference
   - Decision Status + Approved/Rejected By + Decision Timestamp + Rejection/Reversal Reason
   - Verification Status + Cryptographic Document Fingerprint (SHA-256)
5. **Document Viewer**: Embedded preview of the uploaded or linked invoice PDF/image with full-screen zoom and download action.
6. **Linked Ledger Movements**: Chronological view of immutable movements (`PURCHASE_RECEIPT`, `SALE_DISPATCH`, `RETURN_INWARD`, `RETURN_OUTWARD`) associated with this specific transaction.
7. **Recursive Intelligence Section**: Integrated report preview showing matched counterparty records, upstream provenance hops, quantity reconciliation balances, and recommended next actions.

---

## 3. Technical Architecture & Data Strategy

### 3.1 System Flow & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             TrustLayer Client SPA                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────┐                   ┌──────────────────────────┐  │
│  │ IssuedInvoicesSheetView│                   │ReceivedInvoicesSheetView │  │
│  │  (Sheet B: Sales)      │                   │  (Sheet C: Purchasing)   │  │
│  └───────────┬────────────┘                   └────────────┬─────────────┘  │
│              │                                             │                │
│              ├───────────────────┬─────────────────────────┤                │
│              ▼                   ▼                         ▼                │
│     ┌──────────────────┐┌──────────────────┐      ┌──────────────────┐      │
│     │ Independent      ││ Document Upload  │      │ Invoice Detail   │      │
│     │ Filter & Paging  ││ Modal & Preview  │      │ Inspection Modal │      │
│     └────────┬─────────┘└────────┬─────────┘      └────────┬─────────┘      │
│              │                   │                         │                │
│              ▼                   ▼                         ▼                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         AppContext Store                              │  │
│  │  - issuedInvoices: IssuedInvoiceRecord[]                              │  │
│  │  - receivedInvoices: ReceivedInvoiceRecord[]                          │  │
│  │  - inventoryItems: InventoryItem[]                                    │  │
│  │  - inventoryMovements: InventoryMovement[]                            │  │
│  └───────────────────┬───────────────────────────────────┬───────────────┘  │
│                      │                                   │                  │
│                      ▼                                   ▼                  │
│     ┌─────────────────────────────────┐ ┌────────────────────────────────┐  │
│     │    inventoryService.ts          │ │    intelligenceService.ts      │  │
│     │  - processApproveReceivedInvoice│ │  - runRecursiveIntelligence-   │  │
│     │  - processApproveIssuedInvoice  │ │    Reconciliation              │  │
│     │  - processRejectInvoice         │ │  - RBAC Privacy Masking        │  │
│     │  - processReverseInvoice        │ │  - Duplicate Fingerprint Check │  │
│     └─────────────────────────────────┘ └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Data Model Enhancements (`src/types/inventory.ts`)

```typescript
export interface InvoiceDocumentAttachment {
  id: string;
  fileName: string;
  fileType: string; // 'application/pdf' | 'image/png' | 'image/jpeg' | ...
  fileSize: number;
  dataUrl?: string; // base64 or object URL for client preview
  uploadedAt: string;
  storageType: 'session_demo' | 'durable_cloud';
  fingerprint: string;
}

// Ensure IssuedInvoiceRecord and ReceivedInvoiceRecord include:
export interface BaseInvoiceRecord {
  // ... existing fields ...
  documentAttachment?: InvoiceDocumentAttachment;
}
```

### 3.3 State Management & Filter Persistence
Filters are managed via React state in each sheet component, calculating memoized filtered lists before applying pagination slice:
```typescript
interface SheetFilters {
  search: string;
  paymentStatus: string;
  decisionStatus: string;
  verificationStatus: string;
  startDate: string;
  endDate: string;
  entity: string;
  productName: string;
  sku: string;
}
```
Changing any filter resets the current page index to `1` while retaining all other filter parameters.

---

## 4. Verification & Testing Strategy

Before and after completing code modifications, the entire test suite will be validated:

1. **Automated Unit Tests**:
   - Run `npm test` (`tsx --test src/**/*.test.ts`) covering all 15 required core supply chain & inventory scenarios:
     - Scenario 1–6: Opening stock baseline, purchase approval, idempotency, sales approval, rejection no-op, pending no-op.
     - Scenario 7–8: Multi-date purchase and sales invoice record visibility.
     - Scenario 9–10: Missing counterpart detection and inventory deficit protection.
     - Scenario 11–12: Recursive multi-tier provenance and non-fraudulent missing link grading.
     - Scenario 13–15: Duplicate fingerprint detection, RBAC privacy masking, and historical record preservation on reversal.
2. **Interactive UI Verification**:
   - Verify Received Invoices Sheet displays the exact 11 columns in specified order.
   - Verify Issued Invoices Sheet displays the exact 11 columns in specified order.
   - Verify combining Date Range + Status + SKU filters reduces table rows accurately.
   - Verify pagination controls (`Previous`, `Next`, rows per page) work seamlessly with active filters.
   - Test PDF/Image upload dialog: validate rejection on invalid file types, simulate progress, inspect generated preview.
   - Click `Invoice No.` across both sheets: confirm modal opens with complete parties, items, movements, document preview, and intelligence report.
3. **TypeScript Compilation & Linting**:
   - Run `npm run lint` (`tsc --noEmit`) and `compile_applet` to ensure zero compilation or type errors.
