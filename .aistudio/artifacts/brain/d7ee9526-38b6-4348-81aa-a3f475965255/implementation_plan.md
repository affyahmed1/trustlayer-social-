# Implementation Plan: TrustLayer Core System Implementation

An end-to-end architectural plan to implement TrustLayer's **Three-Sheet Architecture** (Inventory, Issued Invoices, Received Invoices) and its core differentiating capability: the **Recursive Supply-Chain Intelligence & Reconciliation Engine**.

## User Review & Critical Decisions

- **Decision 1 (Navigation Structure)**: Dedicated, top-level navigation items in `Sidebar.tsx` for:
  - **Inventory** (Sheet A: calculated stock per product, provenance breakdown, stock adjustment modal)
  - **Issued Invoices** (Sheet B: separate historical record per sale, approval workflow, verification status)
  - **Received Invoices** (Sheet C: separate historical record per purchase, approval workflow, linked references)
- **Decision 2 (Demonstration Data)**: Complete multi-tier supply chain seeded to showcase recursive reconciliation:
  - `Brand (OmniCore Precision Labs)` → `Distributor (Apex Atlantic Distribution)` → `Wholesaler (Meridian Wholesale Group)` → `Supplier (Apex Supply Co.)` → `Marketplace Seller (EuroRetail Direct)`.
  - Includes edge-case scenarios: missing upstream link, unsupported quantity deficit, and duplicate document detection.
- **Decision 3 (Reconciliation Trigger)**: Every transaction approval automatically runs recursive verification and updates its verification status, with on-demand intelligence inspection available at any time via a dedicated result modal.
- **Core Principle**: TrustLayer never assumes authenticity simply because a record exists; it analyzes evidence, traces transaction chains, reconciles quantities, and produces transparent evidence-based findings.

---

## 1. Architecture & Data Model

### A. Sheet A: Inventory (`InventoryItem`)
- **Key**: Unique per business and product (`productId + businessId`).
- **Fields**:
  - `productId`, `productName`, `sku`, `brand`, `businessId`, `businessUsername`
  - `openingStock` (with recorded source, e.g. "Physical Warehouse Audit", and verification status)
  - `totalApprovedPurchases` (accumulated strictly from approved incoming receipts)
  - `totalApprovedSales` (accumulated strictly from approved outgoing sales)
  - `authorizedAdjustments` (controlled write-downs, cycle counts, or returns)
  - `currentStock` (calculated: `openingStock + totalApprovedPurchases - totalApprovedSales + authorizedAdjustments`)
  - `stockVerificationStatus` (`'verified' | 'unverified' | 'investigation_required' | 'discrepancy_detected'`)
  - `lastUpdated`, `unit`
- **Integrity Rule**: Direct manual edits to `currentStock` are prohibited. All stock changes flow through an append-only inventory movement ledger.

### B. Append-Only Inventory Ledger (`InventoryMovement`)
- `id`, `businessId`, `productId`, `type` (`OPENING_BALANCE`, `PURCHASE_RECEIPT`, `SALE_DISPATCH`, `MANUAL_ADJUSTMENT`, `RETURN`), `quantity`, `referenceInvoiceId`, `timestamp`, `actor`, `idempotencyKey`, `notes`.
- **Idempotency**: Prevents double-counting if an approval action is clicked or reprocessed multiple times.

### C. Sheet B: Issued Invoices (`IssuedInvoiceRecord`)
- Separate permanent historical record for every outgoing invoice.
- **Fields**: `id` (TrustLayer Record ID), `originalInvoiceNumber`, `issueDate`, `issuingBusinessId`, `issuingBusinessName`, `buyerBusinessId`, `buyerBusinessName`, `buyerUsername`, `productId`, `productName`, `quantitySold`, `unitOfMeasure`, `paymentStatus` (`Paid`, `Unpaid`, `Payment Pending`, `Partially Paid`, `Refunded`), `paymentDate`, `invoiceDocRef`, `decisionStatus` (`Pending`, `Approved`, `Rejected`, `Reversed`), `verificationStatus` (`Not Checked`, `Verification Pending`, `Consistent`, `Inconsistency Detected`, `Insufficient Evidence`, `Under Investigation`), `linkedReceivedInvoiceRef`, `createdAt`, `updatedAt`, `unitPrice`, `totalAmount`, `currency`, `inventoryMovementApplied`.

### D. Sheet C: Received Invoices (`ReceivedInvoiceRecord`)
- Separate permanent historical record for every incoming invoice.
- **Fields**: `id` (TrustLayer Record ID), `originalInvoiceNumber`, `issueDate`, `supplierBusinessId`, `supplierBusinessName`, `supplierUsername`, `receivingBusinessId`, `receivingBusinessName`, `productId`, `productName`, `quantityPurchased`, `unitOfMeasure`, `paymentStatus`, `paymentDate`, `invoiceDocRef`, `decisionStatus`, `verificationStatus`, `linkedIssuedInvoiceRef`, `createdAt`, `updatedAt`, `unitPrice`, `totalAmount`, `currency`, `inventoryMovementApplied`.

---

## 2. Transaction Approval & Inventory Rules

1. **Purchase Approval (`approveReceivedInvoice`)**:
   - Validates that `inventoryMovementApplied` is false.
   - Sets `decisionStatus = 'Approved'`.
   - Records `PURCHASE_RECEIPT` in the ledger (+quantity).
   - Marks `inventoryMovementApplied = true`.
   - Recalculates current stock for the product.
   - Automatically executes recursive intelligence reconciliation.
2. **Sale Approval (`approveIssuedInvoice`)**:
   - Validates that available `currentStock >= quantitySold`.
   - Validates that `inventoryMovementApplied` is false.
   - Sets `decisionStatus = 'Approved'`.
   - Records `SALE_DISPATCH` in the ledger (-quantity).
   - Marks `inventoryMovementApplied = true`.
   - Recalculates current stock for the product.
   - Automatically executes recursive intelligence reconciliation.
3. **Rejection & Reversal**:
   - Rejection leaves inventory untouched and stores reason and actor.
   - Reversal creates compensating ledger movements preserving audit history.

---

## 3. The Core Feature: Recursive Intelligence Reconciliation Engine

### Engine Interface (`src/services/intelligenceService.ts`)

```typescript
export interface IntelligenceReport {
  runId: string;
  transactionRef: string;
  invoiceNumber: string;
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
}
```

### Reconciliation Intelligence Checks:
1. **Invoice Relationship Check**: Verifies participant registration, counterpart record pairing, product SKU match, and date validity.
2. **Duplicate Invoice Detection**: Flags duplicate invoice numbers across transactions or suspiciously reused document fingerprints.
3. **Quantity Reconciliation**: Verifies that issuing business possessed sufficient supported inventory at invoice issuance time.
4. **Recursive Provenance Traversal**: Recursively traces upstream hops through connected suppliers up to the Brand (`maxDepth = 5`), tracking visited nodes to avoid cyclic loops.
5. **Risk & Evidence Classification**:
   - Missing counterpart / upstream document → `Insufficient Evidence`.
   - Quantity sold exceeds upstream supported supply → `Inconsistency Detected`.
   - Document fingerprint or number collision → `Potential Risk`.
   - All proofs aligned with unbroken chain → `Consistent`.

---

## 4. User Interface Architecture

```
┌────────────────────────────────────────────────────────┐
│ App.tsx                                                │
│  ├── Sidebar:                                          │
│  │    ├── Overview (Home)                              │
│  │    ├── Inventory (Sheet A)                          │
│  │    ├── Issued Invoices (Sheet B)                    │
│  │    ├── Received Invoices (Sheet C)                  │
│  │    ├── Network (Tree View)                          │
│  │    ├── Verification Registry                        │
│  │    ├── Messages                                     │
│  │    └── Settings                                     │
│  └── Main Viewport:                                    │
│       ├── [currentTab === 'inventory']                 │
│       │    └── InventorySheetView                      │
│       │         ├── Product Stock Table (Sheet A)      │
│       │         ├── Inventory Audit Ledger Modal       │
│       │         └── Stock Adjustment Dialog            │
│       ├── [currentTab === 'issued_invoices']           │
│       │    └── IssuedInvoicesSheetView                 │
│       │         ├── Outgoing Transactions (Sheet B)    │
│       │         ├── Approval & Rejection Actions       │
│       │         └── Filter Bar (Product, Status, Date) │
│       ├── [currentTab === 'received_invoices']         │
│       │    └── ReceivedInvoicesSheetView               │
│       │         ├── Incoming Transactions (Sheet C)    │
│       │         ├── Approval & Payment Actions         │
│       │         └── Filter Bar                         │
│       └── IntelligenceResultModal                      │
│            ├── Multi-Tier Provenance Chain Visualizer  │
│            ├── Quantity Balance Card                   │
│            ├── Evidence Completeness Meter             │
│            └── Findings, Conflicts & Action Guidance   │
└────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Steps

1. **`src/types/inventory.ts`**:
   - Define `InventoryItem`, `InventoryMovement`, `IssuedInvoiceRecord`, `ReceivedInvoiceRecord`, and `IntelligenceReport`.
2. **`src/data/seedInventoryData.ts`**:
   - Seed products (`Industrial Sensor Array Model X4`, `Firmware Calibration Gateway`, `Precision Actuator Module`).
   - Seed the multi-tier supply chain across 5 businesses with complete historical invoices and movement ledgers.
   - Seed intentional test anomalies (unsupported excess quantity transaction, missing upstream link).
3. **`src/services/inventoryService.ts`**:
   - Idempotent transaction approval/rejection algorithms.
   - Dynamic inventory recalculation from movement ledgers.
4. **`src/services/intelligenceService.ts`**:
   - Recursive supply-chain graph traversal, quantity balancing, duplicate hash checking, and structured report synthesis.
5. **Components**:
   - `src/components/InventorySheetView.tsx`: Sheet A with provenance ledger drawer and adjustment modal.
   - `src/components/IssuedInvoicesSheetView.tsx`: Sheet B with filters, search, pagination, and approval controls.
   - `src/components/ReceivedInvoicesSheetView.tsx`: Sheet C with filters, search, and approval controls.
   - `src/components/IntelligenceResultModal.tsx`: Interactive multi-tier provenance visualizer and evidence breakdown.
6. **Integration**:
   - Update `AppContext.tsx` with inventory state, invoice sheets, and action methods.
   - Update `Sidebar.tsx` to include `Inventory`, `Issued Invoices`, and `Received Invoices`.
   - Update `App.tsx` routing.
7. **Testing & Verification**:
   - Execute all 15 scenarios specified in Phase 4 of the user request.
   - Run `lint_applet` (`tsc --noEmit`) and `compile_applet`.
