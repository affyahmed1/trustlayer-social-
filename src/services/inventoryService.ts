import {
  InventoryItem,
  InventoryMovement,
  IssuedInvoiceRecord,
  ReceivedInvoiceRecord,
  MultiSourceAllocation,
  DecisionRecord,
  ReassessmentEvent,
  InvoiceLineItem,
} from '../types/inventory';

export interface InventoryServiceState {
  inventory: InventoryItem[];
  movements: InventoryMovement[];
  issuedInvoices: IssuedInvoiceRecord[];
  receivedInvoices: ReceivedInvoiceRecord[];
  decisionRecords?: DecisionRecord[];
  reassessmentEvents?: ReassessmentEvent[];
}

/**
 * Pure calculation function: Recalculates current stock directly from
 * the immutable movement ledger.
 * Formula: Current Stock = Opening Stock + Approved Purchases - Approved Sales + Authorized Adjustments
 */
export function recalculateProductStock(
  productId: string,
  businessId: string,
  openingStock: number,
  movements: InventoryMovement[]
): {
  approvedPurchases: number;
  approvedSales: number;
  adjustments: number;
  currentStock: number;
} {
  const productMovements = movements.filter(
    m => m.productId === productId && m.businessId === businessId
  );

  let approvedPurchases = 0;
  let approvedSales = 0;
  let adjustments = 0;

  for (const m of productMovements) {
    if (m.type === 'PURCHASE_RECEIPT') {
      approvedPurchases += Math.abs(m.quantity);
    } else if (m.type === 'SALE_DISPATCH') {
      approvedSales += Math.abs(m.quantity);
    } else if (
      m.type === 'MANUAL_ADJUSTMENT' ||
      m.type === 'RETURN_INWARD' ||
      m.type === 'RETURN_OUTWARD'
    ) {
      adjustments += m.quantity;
    }
  }

  const currentStock = openingStock + approvedPurchases - approvedSales + adjustments;

  return {
    approvedPurchases,
    approvedSales,
    adjustments,
    currentStock,
  };
}

/**
 * Multi-Source Stock Reconciliation (Section 10 & 12 of TrustLayer Specification):
 * Dynamically resolves stock capacity across all legitimate recorded upstream sources for this product.
 * Wholesaler B can receive 300 units from Distributor A and 200 units from Distributor B,
 * supporting a 500-unit supply transaction without permanently binding to a single source.
 */
export function calculateMultiSourceAllocation(
  productId: string,
  businessId: string,
  requestedQuantity: number,
  state: InventoryServiceState,
  disputedInvoiceIds: Set<string> = new Set()
): {
  sources: MultiSourceAllocation[];
  totalSupported: number;
  totalDisputed: number;
  shortfall: number;
  hasMultiSource: boolean;
} {
  // Find approved purchases for this business & product
  const relevantPurchases = state.receivedInvoices.filter(
    r =>
      r.productId === productId &&
      r.receivingBusinessId === businessId &&
      r.decisionStatus === 'Approved'
  );

  const inventoryItem = state.inventory.find(
    i => i.productId === productId && i.businessId === businessId
  );
  const openingStock = inventoryItem?.openingStock || 0;

  const sources: MultiSourceAllocation[] = [];
  let remainingNeed = requestedQuantity;
  let totalSupported = 0;
  let totalDisputed = 0;

  // 1. Opening baseline stock allocation (if present and needed)
  if (openingStock > 0 && remainingNeed > 0) {
    const allocOpening = Math.min(openingStock, remainingNeed);
    sources.push({
      sourceId: `OPENING-BAL-${productId}`,
      sourceName: inventoryItem?.openingStockSource || 'Verified Opening Warehouse Stock',
      sourceRole: 'Baseline Stock',
      invoiceNumber: 'BASELINE-AUDIT',
      quantityAllocated: allocOpening,
      isDisputed: false,
    });
    totalSupported += allocOpening;
    remainingNeed -= allocOpening;
  }

  // 2. Iterate through approved upstream purchases
  for (const pur of relevantPurchases) {
    if (remainingNeed <= 0) break;

    const isDisputed =
      disputedInvoiceIds.has(pur.id) ||
      disputedInvoiceIds.has(pur.originalInvoiceNumber) ||
      pur.verificationStatus === 'Inconsistency Detected';

    const alloc = Math.min(pur.quantityPurchased, remainingNeed);
    sources.push({
      sourceId: pur.id,
      sourceName: pur.supplierBusinessName,
      sourceRole: 'Supplier / Distributor',
      invoiceNumber: pur.originalInvoiceNumber,
      quantityAllocated: alloc,
      isDisputed,
      disputeReason: isDisputed
        ? pur.rejectionReason || 'Upstream consignment flagged for material discrepancy.'
        : undefined,
    });

    if (isDisputed) {
      totalDisputed += alloc;
    } else {
      totalSupported += alloc;
    }
    remainingNeed -= alloc;
  }

  const shortfall = Math.max(0, remainingNeed);
  const hasMultiSource = sources.length > 1;

  return {
    sources,
    totalSupported,
    totalDisputed,
    shortfall,
    hasMultiSource,
  };
}

/**
 * Approves an incoming purchase invoice (Sheet C).
 * Idempotent: If inventoryMovementApplied is already true, the stock movement is NOT reapplied.
 * Supports multi-line invoices: each line item updates its respective product ledger.
 */
export function processApproveReceivedInvoice(
  invoiceId: string,
  actor: string,
  state: InventoryServiceState
): {
  state: InventoryServiceState;
  updatedInvoice: ReceivedInvoiceRecord | null;
  error?: string;
} {
  const invoice = state.receivedInvoices.find(i => i.id === invoiceId);
  if (!invoice) {
    return { state, updatedInvoice: null, error: `Received invoice ${invoiceId} not found.` };
  }

  // Idempotency check: Already processed
  if (invoice.inventoryMovementApplied && invoice.decisionStatus === 'Approved') {
    return { state, updatedInvoice: invoice };
  }

  const timestamp = new Date().toISOString();
  const idempotencyKey = `IDEMP-PURCHASE-${invoice.id}-${invoice.originalInvoiceNumber}`;
  const alreadyInLedger = state.movements.some(m => m.idempotencyKey === idempotencyKey);

  let newMovements = [...state.movements];

  // Handle multi-line items if defined, otherwise handle primary product
  const lineItems: InvoiceLineItem[] =
    invoice.lineItems && invoice.lineItems.length > 0
      ? invoice.lineItems
      : [
          {
            id: `li-primary-${invoice.id}`,
            productId: invoice.productId,
            productName: invoice.productName,
            sku: invoice.sku,
            quantity: invoice.quantityPurchased,
            unitPrice: invoice.unitPrice,
            totalAmount: invoice.totalAmount,
          },
        ];

  if (!alreadyInLedger) {
    lineItems.forEach((li, idx) => {
      const lineIdempKey =
        lineItems.length > 1 ? `${idempotencyKey}-LI-${idx}` : idempotencyKey;
      if (!newMovements.some(m => m.idempotencyKey === lineIdempKey)) {
        const newMovement: InventoryMovement = {
          id: `MOV-PUR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${idx}`,
          businessId: invoice.receivingBusinessId,
          businessUsername: invoice.receivingBusinessUsername,
          productId: li.productId,
          type: 'PURCHASE_RECEIPT',
          quantity: li.quantity,
          referenceInvoiceId: invoice.id,
          referenceInvoiceNumber: invoice.originalInvoiceNumber,
          timestamp,
          actor,
          notes: `Approved purchase delivery of ${li.productName} from ${invoice.supplierBusinessName}.`,
          idempotencyKey: lineIdempKey,
        };
        newMovements = [newMovement, ...newMovements];
      }
    });
  }

  // Create append-only decision record
  const decisionRecord: DecisionRecord = {
    id: `DEC-PUR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    transactionId: invoice.id,
    invoiceNumber: invoice.originalInvoiceNumber,
    decisionStatus: 'Approved',
    reason: `Purchase receipt confirmed and added to verified inventory ledger by ${actor}.`,
    ruleApplied: 'RULE_PURCHASE_APPROVAL_INCREMENT_LEDGER',
    evidenceSummary: `Supplier invoice verified with SHA-256 fingerprint ${invoice.fingerprint ? invoice.fingerprint.substring(0, 12) + '...' : 'on file'}.`,
    actor,
    timestamp,
    previousStatus: invoice.decisionStatus,
    supportedQuantity: invoice.quantityPurchased,
  };

  const updatedInvoice: ReceivedInvoiceRecord = {
    ...invoice,
    decisionStatus: 'Approved',
    decisionBy: actor,
    decisionAt: timestamp,
    inventoryMovementApplied: true,
    updatedAt: timestamp,
    decisionRecords: [...(invoice.decisionRecords || []), decisionRecord],
  };

  const updatedReceivedInvoices = state.receivedInvoices.map(inv =>
    inv.id === invoiceId ? updatedInvoice : inv
  );

  // Recalculate inventory for all affected products
  const affectedProductIds = new Set(lineItems.map(li => li.productId));
  const updatedInventory = state.inventory.map(item => {
    if (
      affectedProductIds.has(item.productId) &&
      item.businessId === invoice.receivingBusinessId
    ) {
      const { approvedPurchases, approvedSales, adjustments, currentStock } =
        recalculateProductStock(
          item.productId,
          item.businessId,
          item.openingStock,
          newMovements
        );
      return {
        ...item,
        totalApprovedPurchases: approvedPurchases,
        totalApprovedSales: approvedSales,
        authorizedAdjustments: adjustments,
        currentStock,
        lastUpdated: timestamp,
      };
    }
    return item;
  });

  const updatedDecisions = [decisionRecord, ...(state.decisionRecords || [])];

  return {
    state: {
      ...state,
      movements: newMovements,
      receivedInvoices: updatedReceivedInvoices,
      inventory: updatedInventory,
      decisionRecords: updatedDecisions,
    },
    updatedInvoice,
  };
}

/**
 * Approves an outgoing sales invoice (Sheet B).
 * Idempotent: If inventoryMovementApplied is already true, stock movement is NOT reapplied.
 * Validates stock availability across single or multiple sources.
 * Supports multi-line invoices: each line item is validated and decrements only its product.
 */
export function processApproveIssuedInvoice(
  invoiceId: string,
  actor: string,
  state: InventoryServiceState,
  allowNegativeStockOverride: boolean = false
): {
  state: InventoryServiceState;
  updatedInvoice: IssuedInvoiceRecord | null;
  error?: string;
} {
  const invoice = state.issuedInvoices.find(i => i.id === invoiceId);
  if (!invoice) {
    return { state, updatedInvoice: null, error: `Issued invoice ${invoiceId} not found.` };
  }

  // Idempotency check: Already processed
  if (invoice.inventoryMovementApplied && invoice.decisionStatus === 'Approved') {
    return { state, updatedInvoice: invoice };
  }

  const lineItems: InvoiceLineItem[] =
    invoice.lineItems && invoice.lineItems.length > 0
      ? invoice.lineItems
      : [
          {
            id: `li-primary-${invoice.id}`,
            productId: invoice.productId,
            productName: invoice.productName,
            sku: invoice.sku,
            quantity: invoice.quantitySold,
            unitPrice: invoice.unitPrice,
            totalAmount: invoice.totalAmount,
          },
        ];

  // Stock availability check for every line item
  for (const li of lineItems) {
    const item = state.inventory.find(
      i => i.productId === li.productId && i.businessId === invoice.issuingBusinessId
    );
    if (!item && !allowNegativeStockOverride) {
      return {
        state,
        updatedInvoice: null,
        error: `Cannot approve sale: No inventory record exists for product ${li.productName} (${li.productId}).`,
      };
    }
    if (item && item.currentStock < li.quantity && !allowNegativeStockOverride) {
      return {
        state,
        updatedInvoice: null,
        error: `Insufficient stock! Attempted sale of ${li.quantity} units of ${li.productName} exceeds available stock (${item.currentStock} units on hand).`,
      };
    }
  }

  // Multi-source reconciliation allocation
  const multiSourceAlloc = calculateMultiSourceAllocation(
    invoice.productId,
    invoice.issuingBusinessId,
    invoice.quantitySold,
    state
  );

  const timestamp = new Date().toISOString();
  const idempotencyKey = `IDEMP-SALE-${invoice.id}-${invoice.originalInvoiceNumber}`;
  const alreadyInLedger = state.movements.some(m => m.idempotencyKey === idempotencyKey);

  let newMovements = [...state.movements];

  if (!alreadyInLedger) {
    lineItems.forEach((li, idx) => {
      const lineIdempKey =
        lineItems.length > 1 ? `${idempotencyKey}-LI-${idx}` : idempotencyKey;
      if (!newMovements.some(m => m.idempotencyKey === lineIdempKey)) {
        const newMovement: InventoryMovement = {
          id: `MOV-SALE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${idx}`,
          businessId: invoice.issuingBusinessId,
          businessUsername: invoice.issuingBusinessUsername,
          productId: li.productId,
          type: 'SALE_DISPATCH',
          quantity: -li.quantity,
          referenceInvoiceId: invoice.id,
          referenceInvoiceNumber: invoice.originalInvoiceNumber,
          timestamp,
          actor,
          notes: `Approved sales dispatch of ${li.productName} to ${invoice.buyerBusinessName}.`,
          idempotencyKey: lineIdempKey,
        };
        newMovements = [newMovement, ...newMovements];
      }
    });
  }

  const decisionRecord: DecisionRecord = {
    id: `DEC-SALE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    transactionId: invoice.id,
    invoiceNumber: invoice.originalInvoiceNumber,
    decisionStatus: 'Approved',
    reason: `Sales dispatch approved by ${actor}. Reconciled against ${multiSourceAlloc.sources.length} verified supply source(s).`,
    ruleApplied: 'RULE_SALES_APPROVAL_DECREMENT_LEDGER',
    evidenceSummary: `Available inventory verified (${multiSourceAlloc.totalSupported} units supported across legitimate sources).`,
    actor,
    timestamp,
    previousStatus: invoice.decisionStatus,
    supportedQuantity: multiSourceAlloc.totalSupported,
    shortfallQuantity: multiSourceAlloc.shortfall,
  };

  const updatedInvoice: IssuedInvoiceRecord = {
    ...invoice,
    decisionStatus: 'Approved',
    decisionBy: actor,
    decisionAt: timestamp,
    inventoryMovementApplied: true,
    updatedAt: timestamp,
    multiSourceAllocations: multiSourceAlloc.sources,
    decisionRecords: [...(invoice.decisionRecords || []), decisionRecord],
  };

  const updatedIssuedInvoices = state.issuedInvoices.map(inv =>
    inv.id === invoiceId ? updatedInvoice : inv
  );

  const affectedProductIds = new Set(lineItems.map(li => li.productId));
  const updatedInventory = state.inventory.map(item => {
    if (
      affectedProductIds.has(item.productId) &&
      item.businessId === invoice.issuingBusinessId
    ) {
      const { approvedPurchases, approvedSales, adjustments, currentStock } =
        recalculateProductStock(
          item.productId,
          item.businessId,
          item.openingStock,
          newMovements
        );
      return {
        ...item,
        totalApprovedPurchases: approvedPurchases,
        totalApprovedSales: approvedSales,
        authorizedAdjustments: adjustments,
        currentStock,
        lastUpdated: timestamp,
      };
    }
    return item;
  });

  const updatedDecisions = [decisionRecord, ...(state.decisionRecords || [])];

  return {
    state: {
      ...state,
      movements: newMovements,
      issuedInvoices: updatedIssuedInvoices,
      inventory: updatedInventory,
      decisionRecords: updatedDecisions,
    },
    updatedInvoice,
  };
}

/**
 * Rejects an invoice transaction (either issued or received).
 * Critical rule: Does NOT alter inventory or append to inventory movement ledger.
 * Records an immutable DecisionRecord in the audit trail.
 */
export function processRejectInvoice(
  type: 'issued' | 'received',
  invoiceId: string,
  reason: string,
  actor: string,
  state: InventoryServiceState
): {
  state: InventoryServiceState;
  updatedInvoice: IssuedInvoiceRecord | ReceivedInvoiceRecord | null;
  error?: string;
} {
  const timestamp = new Date().toISOString();

  if (type === 'issued') {
    const invoice = state.issuedInvoices.find(i => i.id === invoiceId);
    if (!invoice) return { state, updatedInvoice: null, error: 'Invoice not found' };

    const decisionRecord: DecisionRecord = {
      id: `DEC-REJ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transactionId: invoice.id,
      invoiceNumber: invoice.originalInvoiceNumber,
      decisionStatus: 'Rejected',
      reason,
      ruleApplied: 'RULE_INVOICE_REJECT_NO_STOCK_CHANGE',
      evidenceSummary: `Invoice rejected by ${actor}. No inventory movements applied.`,
      actor,
      timestamp,
      previousStatus: invoice.decisionStatus,
    };

    const updated: IssuedInvoiceRecord = {
      ...invoice,
      decisionStatus: 'Rejected',
      decisionBy: actor,
      decisionAt: timestamp,
      rejectionReason: reason,
      updatedAt: timestamp,
      decisionRecords: [...(invoice.decisionRecords || []), decisionRecord],
    };

    return {
      state: {
        ...state,
        issuedInvoices: state.issuedInvoices.map(i => (i.id === invoiceId ? updated : i)),
        decisionRecords: [decisionRecord, ...(state.decisionRecords || [])],
      },
      updatedInvoice: updated,
    };
  } else {
    const invoice = state.receivedInvoices.find(i => i.id === invoiceId);
    if (!invoice) return { state, updatedInvoice: null, error: 'Invoice not found' };

    const decisionRecord: DecisionRecord = {
      id: `DEC-REJ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transactionId: invoice.id,
      invoiceNumber: invoice.originalInvoiceNumber,
      decisionStatus: 'Rejected',
      reason,
      ruleApplied: 'RULE_INVOICE_REJECT_NO_STOCK_CHANGE',
      evidenceSummary: `Purchase invoice rejected by ${actor}. Inventory ledger unchanged.`,
      actor,
      timestamp,
      previousStatus: invoice.decisionStatus,
    };

    const updated: ReceivedInvoiceRecord = {
      ...invoice,
      decisionStatus: 'Rejected',
      decisionBy: actor,
      decisionAt: timestamp,
      rejectionReason: reason,
      updatedAt: timestamp,
      decisionRecords: [...(invoice.decisionRecords || []), decisionRecord],
    };

    return {
      state: {
        ...state,
        receivedInvoices: state.receivedInvoices.map(i => (i.id === invoiceId ? updated : i)),
        decisionRecords: [decisionRecord, ...(state.decisionRecords || [])],
      },
      updatedInvoice: updated,
    };
  }
}

/**
 * Reverses an approved invoice transaction (issued or received).
 * Creates a compensating append-only inventory movement record,
 * preserves original invoice and history, and recalculates stock.
 */
export function processReverseInvoice(
  type: 'issued' | 'received',
  invoiceId: string,
  reason: string,
  actor: string,
  state: InventoryServiceState
): {
  state: InventoryServiceState;
  updatedInvoice: IssuedInvoiceRecord | ReceivedInvoiceRecord | null;
  compensatingMovement?: InventoryMovement;
  error?: string;
} {
  const timestamp = new Date().toISOString();

  if (type === 'issued') {
    const invoice = state.issuedInvoices.find(i => i.id === invoiceId);
    if (!invoice) return { state, updatedInvoice: null, error: 'Issued invoice not found.' };
    if (invoice.decisionStatus === 'Reversed') {
      return { state, updatedInvoice: invoice };
    }

    if (!invoice.inventoryMovementApplied) {
      const decisionRecord: DecisionRecord = {
        id: `DEC-REV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        transactionId: invoice.id,
        invoiceNumber: invoice.originalInvoiceNumber,
        decisionStatus: 'Reversed',
        reason,
        ruleApplied: 'RULE_REVERSE_UNAPPLIED_INVOICE',
        evidenceSummary: 'Invoice reversed before physical stock dispatch.',
        actor,
        timestamp,
        previousStatus: invoice.decisionStatus,
      };

      const updated: IssuedInvoiceRecord = {
        ...invoice,
        decisionStatus: 'Reversed',
        decisionBy: actor,
        decisionAt: timestamp,
        rejectionReason: reason,
        updatedAt: timestamp,
        decisionRecords: [...(invoice.decisionRecords || []), decisionRecord],
      };
      return {
        state: {
          ...state,
          issuedInvoices: state.issuedInvoices.map(i => (i.id === invoiceId ? updated : i)),
          decisionRecords: [decisionRecord, ...(state.decisionRecords || [])],
        },
        updatedInvoice: updated,
      };
    }

    const idempotencyKey = `IDEMP-REV-ISSUED-${invoice.id}`;
    const compensating: InventoryMovement = {
      id: `MOV-REV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      businessId: invoice.issuingBusinessId,
      businessUsername: invoice.issuingBusinessUsername,
      productId: invoice.productId,
      type: 'RETURN_INWARD',
      quantity: invoice.quantitySold,
      referenceInvoiceId: invoice.id,
      referenceInvoiceNumber: invoice.originalInvoiceNumber,
      timestamp,
      actor,
      notes: `Reversal return inward: ${reason}`,
      idempotencyKey,
    };

    const newMovements = [compensating, ...state.movements];

    const decisionRecord: DecisionRecord = {
      id: `DEC-REV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transactionId: invoice.id,
      invoiceNumber: invoice.originalInvoiceNumber,
      decisionStatus: 'Reversed',
      reason,
      ruleApplied: 'RULE_REVERSE_COMPENSATING_MOVEMENT',
      evidenceSummary: `Compensating RETURN_INWARD recorded (+${invoice.quantitySold} units).`,
      actor,
      timestamp,
      previousStatus: invoice.decisionStatus,
    };

    const updatedInvoice: IssuedInvoiceRecord = {
      ...invoice,
      decisionStatus: 'Reversed',
      decisionBy: actor,
      decisionAt: timestamp,
      rejectionReason: reason,
      updatedAt: timestamp,
      decisionRecords: [...(invoice.decisionRecords || []), decisionRecord],
    };

    const updatedIssuedInvoices = state.issuedInvoices.map(i =>
      i.id === invoiceId ? updatedInvoice : i
    );

    const updatedInventory = state.inventory.map(item => {
      if (item.productId === invoice.productId && item.businessId === invoice.issuingBusinessId) {
        const { approvedPurchases, approvedSales, adjustments, currentStock } =
          recalculateProductStock(
            item.productId,
            item.businessId,
            item.openingStock,
            newMovements
          );
        return {
          ...item,
          totalApprovedPurchases: approvedPurchases,
          totalApprovedSales: approvedSales,
          authorizedAdjustments: adjustments,
          currentStock,
          lastUpdated: timestamp,
        };
      }
      return item;
    });

    return {
      state: {
        ...state,
        movements: newMovements,
        issuedInvoices: updatedIssuedInvoices,
        inventory: updatedInventory,
        decisionRecords: [decisionRecord, ...(state.decisionRecords || [])],
      },
      updatedInvoice,
      compensatingMovement: compensating,
    };
  } else {
    // Received invoice reversal
    const invoice = state.receivedInvoices.find(i => i.id === invoiceId);
    if (!invoice) return { state, updatedInvoice: null, error: 'Received invoice not found.' };
    if (invoice.decisionStatus === 'Reversed') {
      return { state, updatedInvoice: invoice };
    }

    if (!invoice.inventoryMovementApplied) {
      const decisionRecord: DecisionRecord = {
        id: `DEC-REV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        transactionId: invoice.id,
        invoiceNumber: invoice.originalInvoiceNumber,
        decisionStatus: 'Reversed',
        reason,
        ruleApplied: 'RULE_REVERSE_UNAPPLIED_PURCHASE',
        evidenceSummary: 'Purchase reversed before receipt intake.',
        actor,
        timestamp,
        previousStatus: invoice.decisionStatus,
      };

      const updated: ReceivedInvoiceRecord = {
        ...invoice,
        decisionStatus: 'Reversed',
        decisionBy: actor,
        decisionAt: timestamp,
        rejectionReason: reason,
        updatedAt: timestamp,
        decisionRecords: [...(invoice.decisionRecords || []), decisionRecord],
      };
      return {
        state: {
          ...state,
          receivedInvoices: state.receivedInvoices.map(i => (i.id === invoiceId ? updated : i)),
          decisionRecords: [decisionRecord, ...(state.decisionRecords || [])],
        },
        updatedInvoice: updated,
      };
    }

    const idempotencyKey = `IDEMP-REV-REC-${invoice.id}`;
    const compensating: InventoryMovement = {
      id: `MOV-REV-OUT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      businessId: invoice.receivingBusinessId,
      businessUsername: invoice.receivingBusinessUsername,
      productId: invoice.productId,
      type: 'RETURN_OUTWARD',
      quantity: -invoice.quantityPurchased,
      referenceInvoiceId: invoice.id,
      referenceInvoiceNumber: invoice.originalInvoiceNumber,
      timestamp,
      actor,
      notes: `Reversal return outward to supplier: ${reason}`,
      idempotencyKey,
    };

    const newMovements = [compensating, ...state.movements];

    const decisionRecord: DecisionRecord = {
      id: `DEC-REV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transactionId: invoice.id,
      invoiceNumber: invoice.originalInvoiceNumber,
      decisionStatus: 'Reversed',
      reason,
      ruleApplied: 'RULE_REVERSE_COMPENSATING_MOVEMENT',
      evidenceSummary: `Compensating RETURN_OUTWARD recorded (-${invoice.quantityPurchased} units).`,
      actor,
      timestamp,
      previousStatus: invoice.decisionStatus,
    };

    const updatedInvoice: ReceivedInvoiceRecord = {
      ...invoice,
      decisionStatus: 'Reversed',
      decisionBy: actor,
      decisionAt: timestamp,
      rejectionReason: reason,
      updatedAt: timestamp,
      decisionRecords: [...(invoice.decisionRecords || []), decisionRecord],
    };

    const updatedReceivedInvoices = state.receivedInvoices.map(i =>
      i.id === invoiceId ? updatedInvoice : i
    );

    const updatedInventory = state.inventory.map(item => {
      if (item.productId === invoice.productId && item.businessId === invoice.receivingBusinessId) {
        const { approvedPurchases, approvedSales, adjustments, currentStock } =
          recalculateProductStock(
            item.productId,
            item.businessId,
            item.openingStock,
            newMovements
          );
        return {
          ...item,
          totalApprovedPurchases: approvedPurchases,
          totalApprovedSales: approvedSales,
          authorizedAdjustments: adjustments,
          currentStock,
          lastUpdated: timestamp,
        };
      }
      return item;
    });

    return {
      state: {
        ...state,
        movements: newMovements,
        receivedInvoices: updatedReceivedInvoices,
        inventory: updatedInventory,
        decisionRecords: [decisionRecord, ...(state.decisionRecords || [])],
      },
      updatedInvoice,
      compensatingMovement: compensating,
    };
  }
}

/**
 * Controlled Stock Adjustment (e.g. cycle count variance, damaged stock).
 * Writes an append-only ledger record and recalculates current stock.
 */
export function processManualStockAdjustment(
  productId: string,
  businessId: string,
  businessUsername: string,
  adjustmentDelta: number,
  reason: string,
  actor: string,
  state: InventoryServiceState
): {
  state: InventoryServiceState;
  movement: InventoryMovement;
} {
  const timestamp = new Date().toISOString();
  const movement: InventoryMovement = {
    id: `MOV-ADJ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    businessId,
    businessUsername,
    productId,
    type: 'MANUAL_ADJUSTMENT',
    quantity: adjustmentDelta,
    timestamp,
    actor,
    notes: reason,
    idempotencyKey: `IDEMP-ADJ-${productId}-${timestamp}`,
  };

  const newMovements = [movement, ...state.movements];

  const updatedInventory = state.inventory.map(item => {
    if (item.productId === productId && item.businessId === businessId) {
      const { approvedPurchases, approvedSales, adjustments, currentStock } =
        recalculateProductStock(
          item.productId,
          item.businessId,
          item.openingStock,
          newMovements
        );
      return {
        ...item,
        authorizedAdjustments: adjustments,
        currentStock,
        lastUpdated: timestamp,
      };
    }
    return item;
  });

  return {
    state: {
      ...state,
      movements: newMovements,
      inventory: updatedInventory,
    },
    movement,
  };
}

/**
 * Downstream Fairness & Reassessment on Upstream Dispute (Section 12 & 13 of Specification):
 * When an upstream transaction is later disputed or flagged:
 * 1. Unrelated downstream transactions supported by independent alternative sources remain APPROVED!
 * 2. Transactions directly relying on the disputed stock are placed under review with an append-only ReassessmentEvent.
 * 3. Does NOT silently overwrite or mutate original historical decision records.
 */
export function processReassessDownstreamOnDispute(
  disputedInvoiceId: string,
  reason: string,
  actor: string,
  state: InventoryServiceState
): {
  state: InventoryServiceState;
  reassessmentEvents: ReassessmentEvent[];
  affectedInvoicesCount: number;
} {
  const timestamp = new Date().toISOString();
  const disputedInvoice =
    state.receivedInvoices.find(r => r.id === disputedInvoiceId || r.originalInvoiceNumber === disputedInvoiceId) ||
    state.issuedInvoices.find(i => i.id === disputedInvoiceId || i.originalInvoiceNumber === disputedInvoiceId);

  const disputedNumber = disputedInvoice ? disputedInvoice.originalInvoiceNumber : disputedInvoiceId;
  const newReassessments: ReassessmentEvent[] = [];

  // Flag the disputed invoice
  let updatedReceived = state.receivedInvoices.map(r => {
    if (r.id === disputedInvoiceId || r.originalInvoiceNumber === disputedInvoiceId) {
      return {
        ...r,
        verificationStatus: 'Inconsistency Detected' as const,
        rejectionReason: reason,
        updatedAt: timestamp,
      };
    }
    return r;
  });

  // Evaluate downstream issued invoices
  let updatedIssued = state.issuedInvoices.map(inv => {
    // Check if this invoice is linked or dependent
    const isDirectlyLinked =
      inv.linkedReceivedInvoiceRef === disputedInvoiceId ||
      inv.linkedReceivedInvoiceRef === disputedNumber;

    if (!isDirectlyLinked) {
      // Check multi-source allocations: is this transaction supported by independent sources?
      return inv;
    }

    // Evaluate if independent alternative sources can still fully cover this sale
    const disputedSet = new Set([disputedInvoiceId, disputedNumber]);
    const allocation = calculateMultiSourceAllocation(
      inv.productId,
      inv.issuingBusinessId,
      inv.quantitySold,
      state,
      disputedSet
    );

    // Downstream Fairness:
    // If the independent undisputed stock is sufficient to support this sale, it stays Approved!
    if (allocation.totalSupported >= inv.quantitySold) {
      return inv;
    }

    // Direct dependency with shortfall: create ReassessmentEvent and set to Under Review (Pending)
    const event: ReassessmentEvent = {
      id: `REASSESS-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      targetTransactionId: inv.id,
      targetInvoiceNumber: inv.originalInvoiceNumber,
      previousStatus: inv.decisionStatus,
      newStatus: 'Pending',
      reason: `Directly connected upstream dispute identified on ${disputedNumber}: ${reason}`,
      triggeredByTransactionId: disputedInvoiceId,
      triggeredByInvoiceNumber: disputedNumber,
      timestamp,
      actor,
      evidenceNotes: `Partial support breakdown: ${allocation.totalSupported} units supported by independent sources, ${allocation.totalDisputed} units disputed, ${allocation.shortfall} units shortfall.`,
    };

    newReassessments.push(event);

    return {
      ...inv,
      decisionStatus: 'Pending' as const,
      verificationStatus: 'Under Investigation' as const,
      rejectionReason: `Upstream discrepancy on invoice ${disputedNumber} requires investigation. Supported qty: ${allocation.totalSupported}, Disputed qty: ${allocation.totalDisputed}.`,
      updatedAt: timestamp,
      multiSourceAllocations: allocation.sources,
    };
  });

  return {
    state: {
      ...state,
      issuedInvoices: updatedIssued,
      receivedInvoices: updatedReceived,
      reassessmentEvents: [...newReassessments, ...(state.reassessmentEvents || [])],
    },
    reassessmentEvents: newReassessments,
    affectedInvoicesCount: newReassessments.length,
  };
}
