import {
  InventoryItem,
  InventoryMovement,
  IssuedInvoiceRecord,
  ReceivedInvoiceRecord,
} from '../types/inventory';

export interface InventoryServiceState {
  inventory: InventoryItem[];
  movements: InventoryMovement[];
  issuedInvoices: IssuedInvoiceRecord[];
  receivedInvoices: ReceivedInvoiceRecord[];
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
    } else if (m.type === 'MANUAL_ADJUSTMENT' || m.type === 'RETURN_INWARD' || m.type === 'RETURN_OUTWARD') {
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
 * Approves an incoming purchase invoice (Sheet C).
 * Idempotent: If inventoryMovementApplied is already true, the stock movement is NOT reapplied.
 * Increases receiving business's inventory exactly once and writes to append-only ledger.
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

  // Check if this idempotency key is already recorded in the ledger
  const alreadyInLedger = state.movements.some(m => m.idempotencyKey === idempotencyKey);

  let newMovements = [...state.movements];
  if (!alreadyInLedger) {
    const newMovement: InventoryMovement = {
      id: `MOV-PUR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      businessId: invoice.receivingBusinessId,
      businessUsername: invoice.receivingBusinessUsername,
      productId: invoice.productId,
      type: 'PURCHASE_RECEIPT',
      quantity: invoice.quantityPurchased,
      referenceInvoiceId: invoice.id,
      referenceInvoiceNumber: invoice.originalInvoiceNumber,
      timestamp,
      actor,
      notes: `Approved purchase delivery from ${invoice.supplierBusinessName}.`,
      idempotencyKey,
    };
    newMovements = [newMovement, ...state.movements];
  }

  // Update invoice record
  const updatedInvoice: ReceivedInvoiceRecord = {
    ...invoice,
    decisionStatus: 'Approved',
    decisionBy: actor,
    decisionAt: timestamp,
    inventoryMovementApplied: true,
    updatedAt: timestamp,
  };

  const updatedReceivedInvoices = state.receivedInvoices.map(inv =>
    inv.id === invoiceId ? updatedInvoice : inv
  );

  // Recalculate inventory
  const updatedInventory = state.inventory.map(item => {
    if (item.productId === invoice.productId && item.businessId === invoice.receivingBusinessId) {
      const { approvedPurchases, approvedSales, adjustments, currentStock } = recalculateProductStock(
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
    },
    updatedInvoice,
  };
}

/**
 * Approves an outgoing sales invoice (Sheet B).
 * Idempotent: If inventoryMovementApplied is already true, stock movement is NOT reapplied.
 * Validates stock availability: decreases stock exactly once.
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

  // Stock check
  const inventoryItem = state.inventory.find(
    i => i.productId === invoice.productId && i.businessId === invoice.issuingBusinessId
  );

  if (!inventoryItem && !allowNegativeStockOverride) {
    return {
      state,
      updatedInvoice: null,
      error: `Cannot approve sale: No inventory record exists for product ${invoice.productId}.`,
    };
  }

  if (inventoryItem && inventoryItem.currentStock < invoice.quantitySold && !allowNegativeStockOverride) {
    return {
      state,
      updatedInvoice: null,
      error: `Insufficient stock! Attempted sale of ${invoice.quantitySold} ${invoice.unitOfMeasure} exceeds available stock (${inventoryItem.currentStock} ${inventoryItem.unit}).`,
    };
  }

  const timestamp = new Date().toISOString();
  const idempotencyKey = `IDEMP-SALE-${invoice.id}-${invoice.originalInvoiceNumber}`;

  const alreadyInLedger = state.movements.some(m => m.idempotencyKey === idempotencyKey);

  let newMovements = [...state.movements];
  if (!alreadyInLedger) {
    const newMovement: InventoryMovement = {
      id: `MOV-SALE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      businessId: invoice.issuingBusinessId,
      businessUsername: invoice.issuingBusinessUsername,
      productId: invoice.productId,
      type: 'SALE_DISPATCH',
      quantity: -invoice.quantitySold,
      referenceInvoiceId: invoice.id,
      referenceInvoiceNumber: invoice.originalInvoiceNumber,
      timestamp,
      actor,
      notes: `Approved sales dispatch to ${invoice.buyerBusinessName}.`,
      idempotencyKey,
    };
    newMovements = [newMovement, ...state.movements];
  }

  const updatedInvoice: IssuedInvoiceRecord = {
    ...invoice,
    decisionStatus: 'Approved',
    decisionBy: actor,
    decisionAt: timestamp,
    inventoryMovementApplied: true,
    updatedAt: timestamp,
  };

  const updatedIssuedInvoices = state.issuedInvoices.map(inv =>
    inv.id === invoiceId ? updatedInvoice : inv
  );

  const updatedInventory = state.inventory.map(item => {
    if (item.productId === invoice.productId && item.businessId === invoice.issuingBusinessId) {
      const { approvedPurchases, approvedSales, adjustments, currentStock } = recalculateProductStock(
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
    },
    updatedInvoice,
  };
}

/**
 * Rejects an invoice transaction (either issued or received).
 * Critical rule: Does NOT alter inventory or append to inventory movement ledger.
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

    const updated: IssuedInvoiceRecord = {
      ...invoice,
      decisionStatus: 'Rejected',
      decisionBy: actor,
      decisionAt: timestamp,
      rejectionReason: reason,
      updatedAt: timestamp,
    };

    return {
      state: {
        ...state,
        issuedInvoices: state.issuedInvoices.map(i => (i.id === invoiceId ? updated : i)),
      },
      updatedInvoice: updated,
    };
  } else {
    const invoice = state.receivedInvoices.find(i => i.id === invoiceId);
    if (!invoice) return { state, updatedInvoice: null, error: 'Invoice not found' };

    const updated: ReceivedInvoiceRecord = {
      ...invoice,
      decisionStatus: 'Rejected',
      decisionBy: actor,
      decisionAt: timestamp,
      rejectionReason: reason,
      updatedAt: timestamp,
    };

    return {
      state: {
        ...state,
        receivedInvoices: state.receivedInvoices.map(i => (i.id === invoiceId ? updated : i)),
      },
      updatedInvoice: updated,
    };
  }
}

/**
 * Applies a controlled stock adjustment (e.g. cycle count variance, warehouse write-off).
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
      const { approvedPurchases, approvedSales, adjustments, currentStock } = recalculateProductStock(
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
