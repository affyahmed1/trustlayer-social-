import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InventoryItem,
  InventoryMovement,
  IssuedInvoiceRecord,
  ReceivedInvoiceRecord,
} from '../types/inventory';
import {
  recalculateProductStock,
  processApproveReceivedInvoice,
  processApproveIssuedInvoice,
  processRejectInvoice,
  processReverseInvoice,
  processManualStockAdjustment,
  InventoryServiceState,
} from './inventoryService';
import { runRecursiveIntelligenceReconciliation } from './intelligenceService';

function createFreshTestState(): InventoryServiceState {
  const inventory: InventoryItem[] = [
    {
      productId: 'PROD-ISA-X4',
      productName: 'Industrial Sensor Array Model X4',
      sku: 'ISA-X4-BLK',
      brand: 'OmniCore Precision Labs',
      businessId: 'TL-ORG-9801',
      businessUsername: '@apexsupply',
      openingStock: 1000,
      openingStockSource: 'Physical Warehouse Audit (Q3 Verified Count)',
      openingStockVerified: true,
      totalApprovedPurchases: 0,
      totalApprovedSales: 0,
      authorizedAdjustments: 0,
      currentStock: 1000,
      stockVerificationStatus: 'verified',
      lastUpdated: '2026-10-01T00:00:00Z',
      unit: 'units',
      supportedQuantity: 1000,
      unsupportedQuantity: 0,
    },
  ];

  const movements: InventoryMovement[] = [
    {
      id: 'MOV-TEST-INIT',
      businessId: 'TL-ORG-9801',
      businessUsername: '@apexsupply',
      productId: 'PROD-ISA-X4',
      type: 'OPENING_BALANCE',
      quantity: 1000,
      timestamp: '2026-10-01T00:00:00Z',
      actor: 'System Initialization',
      notes: 'Initial warehouse baseline audit.',
      idempotencyKey: 'IDEMP-TEST-INIT-001',
    },
  ];

  return {
    inventory,
    movements,
    issuedInvoices: [],
    receivedInvoices: [],
  };
}

// ─────────────────────────────────────────────────────────────
// SCENARIO 1: Opening stock is 1,000 units. Current stock equals 1,000.
// ─────────────────────────────────────────────────────────────
test('Scenario 1: Opening stock is 1,000 units. Current stock equals 1,000.', () => {
  const state = createFreshTestState();
  const item = state.inventory.find(i => i.productId === 'PROD-ISA-X4')!;
  
  assert.equal(item.openingStock, 1000);
  assert.equal(item.currentStock, 1000);
  assert.equal(item.totalApprovedPurchases, 0);
  assert.equal(item.totalApprovedSales, 0);
  assert.equal(item.stockVerificationStatus, 'verified');
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 2: Approve a purchase of 300 units. Current stock becomes 1,300.
// ─────────────────────────────────────────────────────────────
test('Scenario 2: Approve a purchase of 300 units. Current stock becomes 1,300.', () => {
  let state = createFreshTestState();

  const purchaseInvoice: ReceivedInvoiceRecord = {
    id: 'REC-INV-001',
    originalInvoiceNumber: 'PO-2026-001',
    issueDate: '2026-10-05',
    supplierBusinessId: 'TL-ORG-8831',
    supplierBusinessName: 'Meridian Wholesale Group',
    supplierBusinessUsername: '@meridianwholesale',
    receivingBusinessId: 'TL-ORG-9801',
    receivingBusinessName: 'Apex Supply Co.',
    receivingBusinessUsername: '@apexsupply',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantityPurchased: 300,
    unitOfMeasure: 'units',
    unitPrice: 380,
    totalAmount: 114000,
    currency: 'USD',
    paymentStatus: 'Paid',
    invoiceDocRef: 'DOC-PO-001',
    decisionStatus: 'Pending',
    verificationStatus: 'Verification Pending',
    inventoryMovementApplied: false,
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-05T08:00:00Z',
  };

  state.receivedInvoices.push(purchaseInvoice);

  const res = processApproveReceivedInvoice('REC-INV-001', 'Auditor Vance', state);
  assert.equal(res.error, undefined);
  assert.equal(res.updatedInvoice?.decisionStatus, 'Approved');
  assert.equal(res.updatedInvoice?.inventoryMovementApplied, true);

  const item = res.state.inventory.find(i => i.productId === 'PROD-ISA-X4')!;
  assert.equal(item.totalApprovedPurchases, 300);
  assert.equal(item.currentStock, 1300); // 1000 + 300 = 1300
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 3: Process the same approval again. Stock remains 1,300. (Idempotency)
// ─────────────────────────────────────────────────────────────
test('Scenario 3: Process the same approval again. Stock remains 1,300 (Idempotency).', () => {
  let state = createFreshTestState();

  const purchaseInvoice: ReceivedInvoiceRecord = {
    id: 'REC-INV-001',
    originalInvoiceNumber: 'PO-2026-001',
    issueDate: '2026-10-05',
    supplierBusinessId: 'TL-ORG-8831',
    supplierBusinessName: 'Meridian Wholesale Group',
    supplierBusinessUsername: '@meridianwholesale',
    receivingBusinessId: 'TL-ORG-9801',
    receivingBusinessName: 'Apex Supply Co.',
    receivingBusinessUsername: '@apexsupply',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantityPurchased: 300,
    unitOfMeasure: 'units',
    unitPrice: 380,
    totalAmount: 114000,
    currency: 'USD',
    paymentStatus: 'Paid',
    invoiceDocRef: 'DOC-PO-001',
    decisionStatus: 'Pending',
    verificationStatus: 'Verification Pending',
    inventoryMovementApplied: false,
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-05T08:00:00Z',
  };

  state.receivedInvoices.push(purchaseInvoice);

  // First approval
  const res1 = processApproveReceivedInvoice('REC-INV-001', 'Auditor Vance', state);
  assert.equal(res1.state.inventory.find(i => i.productId === 'PROD-ISA-X4')!.currentStock, 1300);
  const movementsCount1 = res1.state.movements.length;

  // Second approval (re-processing)
  const res2 = processApproveReceivedInvoice('REC-INV-001', 'Auditor Vance', res1.state);
  assert.equal(res2.state.inventory.find(i => i.productId === 'PROD-ISA-X4')!.currentStock, 1300);
  assert.equal(res2.state.movements.length, movementsCount1, 'Movement ledger must not have duplicate entries');
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 4: Approve a sale of 200 units. Current stock becomes 1,100.
// ─────────────────────────────────────────────────────────────
test('Scenario 4: Approve a sale of 200 units. Current stock becomes 1,100.', () => {
  let state = createFreshTestState();

  // First approve purchase of 300 units (stock becomes 1,300)
  const purchaseInvoice: ReceivedInvoiceRecord = {
    id: 'REC-INV-001',
    originalInvoiceNumber: 'PO-2026-001',
    issueDate: '2026-10-05',
    supplierBusinessId: 'TL-ORG-8831',
    supplierBusinessName: 'Meridian Wholesale Group',
    supplierBusinessUsername: '@meridianwholesale',
    receivingBusinessId: 'TL-ORG-9801',
    receivingBusinessName: 'Apex Supply Co.',
    receivingBusinessUsername: '@apexsupply',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantityPurchased: 300,
    unitOfMeasure: 'units',
    unitPrice: 380,
    totalAmount: 114000,
    currency: 'USD',
    paymentStatus: 'Paid',
    invoiceDocRef: 'DOC-PO-001',
    decisionStatus: 'Pending',
    verificationStatus: 'Verification Pending',
    inventoryMovementApplied: false,
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-05T08:00:00Z',
  };

  state.receivedInvoices.push(purchaseInvoice);
  state = processApproveReceivedInvoice('REC-INV-001', 'Auditor Vance', state).state;
  assert.equal(state.inventory[0].currentStock, 1300);

  // Now approve sale of 200 units (stock becomes 1,100)
  const saleInvoice: IssuedInvoiceRecord = {
    id: 'ISS-INV-001',
    originalInvoiceNumber: 'INV-2026-101',
    issueDate: '2026-10-08',
    issuingBusinessId: 'TL-ORG-9801',
    issuingBusinessName: 'Apex Supply Co.',
    issuingBusinessUsername: '@apexsupply',
    buyerBusinessId: 'TL-ORG-4420',
    buyerBusinessName: 'Nexus Global Logistics',
    buyerBusinessUsername: '@nexusglobal',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantitySold: 200,
    unitOfMeasure: 'units',
    unitPrice: 420,
    totalAmount: 84000,
    currency: 'USD',
    paymentStatus: 'Unpaid',
    invoiceDocRef: 'DOC-INV-101',
    decisionStatus: 'Pending',
    verificationStatus: 'Verification Pending',
    inventoryMovementApplied: false,
    createdAt: '2026-10-08T10:00:00Z',
    updatedAt: '2026-10-08T10:00:00Z',
  };

  state.issuedInvoices.push(saleInvoice);

  const res = processApproveIssuedInvoice('ISS-INV-001', 'Auditor Vance', state);
  assert.equal(res.error, undefined);
  assert.equal(res.updatedInvoice?.decisionStatus, 'Approved');

  const item = res.state.inventory.find(i => i.productId === 'PROD-ISA-X4')!;
  assert.equal(item.totalApprovedSales, 200);
  assert.equal(item.currentStock, 1100); // 1300 - 200 = 1100
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 5: Reject a purchase of 500 units. Stock does not change.
// ─────────────────────────────────────────────────────────────
test('Scenario 5: Reject a purchase of 500 units. Stock does not change.', () => {
  let state = createFreshTestState();
  state.inventory[0].currentStock = 1100;
  state.inventory[0].openingStock = 1000;
  state.inventory[0].totalApprovedPurchases = 300;
  state.inventory[0].totalApprovedSales = 200;

  const rejectedInvoice: ReceivedInvoiceRecord = {
    id: 'REC-INV-REJ',
    originalInvoiceNumber: 'PO-DEFECT-500',
    issueDate: '2026-10-09',
    supplierBusinessId: 'TL-ORG-6109',
    supplierBusinessName: 'Quantum Precision Parts',
    supplierBusinessUsername: '@quantumtech',
    receivingBusinessId: 'TL-ORG-9801',
    receivingBusinessName: 'Apex Supply Co.',
    receivingBusinessUsername: '@apexsupply',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantityPurchased: 500,
    unitOfMeasure: 'units',
    unitPrice: 380,
    totalAmount: 190000,
    currency: 'USD',
    paymentStatus: 'Unpaid',
    invoiceDocRef: 'DOC-REJ-500',
    decisionStatus: 'Pending',
    verificationStatus: 'Verification Pending',
    inventoryMovementApplied: false,
    createdAt: '2026-10-09T09:00:00Z',
    updatedAt: '2026-10-09T09:00:00Z',
  };

  state.receivedInvoices.push(rejectedInvoice);

  const movementsBefore = state.movements.length;
  const res = processRejectInvoice('received', 'REC-INV-REJ', 'Defective lot inspection failure', 'Auditor Vance', state);

  assert.equal(res.updatedInvoice?.decisionStatus, 'Rejected');
  assert.equal(res.updatedInvoice?.rejectionReason, 'Defective lot inspection failure');

  const item = res.state.inventory.find(i => i.productId === 'PROD-ISA-X4')!;
  assert.equal(item.currentStock, 1100, 'Stock must not change when a purchase is rejected');
  assert.equal(res.state.movements.length, movementsBefore, 'No movements written on rejection');
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 6: Leave a purchase pending. Stock does not change.
// ─────────────────────────────────────────────────────────────
test('Scenario 6: Leave a purchase pending. Stock does not change.', () => {
  let state = createFreshTestState();
  state.inventory[0].currentStock = 1100;

  const pendingInvoice: ReceivedInvoiceRecord = {
    id: 'REC-INV-PENDING',
    originalInvoiceNumber: 'PO-PEND-001',
    issueDate: '2026-10-10',
    supplierBusinessId: 'TL-ORG-8831',
    supplierBusinessName: 'Meridian Wholesale Group',
    supplierBusinessUsername: '@meridianwholesale',
    receivingBusinessId: 'TL-ORG-9801',
    receivingBusinessName: 'Apex Supply Co.',
    receivingBusinessUsername: '@apexsupply',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantityPurchased: 450,
    unitOfMeasure: 'units',
    unitPrice: 380,
    totalAmount: 171000,
    currency: 'USD',
    paymentStatus: 'Payment Pending',
    invoiceDocRef: 'DOC-PEND-001',
    decisionStatus: 'Pending',
    verificationStatus: 'Verification Pending',
    inventoryMovementApplied: false,
    createdAt: '2026-10-10T09:00:00Z',
    updatedAt: '2026-10-10T09:00:00Z',
  };

  state.receivedInvoices.push(pendingInvoice);

  const item = state.inventory.find(i => i.productId === 'PROD-ISA-X4')!;
  assert.equal(item.currentStock, 1100, 'Pending invoices must not affect stock');
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 7: Record two purchases of the same product on different dates. Both remain visible.
// ─────────────────────────────────────────────────────────────
test('Scenario 7: Record two purchases of the same product on different dates. Both remain visible.', () => {
  let state = createFreshTestState();

  const purchase1: ReceivedInvoiceRecord = {
    id: 'REC-P1',
    originalInvoiceNumber: 'PO-DATE-1',
    issueDate: '2026-10-01',
    supplierBusinessId: 'TL-ORG-8831',
    supplierBusinessName: 'Meridian Wholesale Group',
    supplierBusinessUsername: '@meridianwholesale',
    receivingBusinessId: 'TL-ORG-9801',
    receivingBusinessName: 'Apex Supply Co.',
    receivingBusinessUsername: '@apexsupply',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantityPurchased: 100,
    unitOfMeasure: 'units',
    unitPrice: 380,
    totalAmount: 38000,
    currency: 'USD',
    paymentStatus: 'Paid',
    invoiceDocRef: 'DOC-P1',
    decisionStatus: 'Approved',
    verificationStatus: 'Consistent',
    inventoryMovementApplied: true,
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  };

  const purchase2: ReceivedInvoiceRecord = {
    id: 'REC-P2',
    originalInvoiceNumber: 'PO-DATE-2',
    issueDate: '2026-10-15',
    supplierBusinessId: 'TL-ORG-8831',
    supplierBusinessName: 'Meridian Wholesale Group',
    supplierBusinessUsername: '@meridianwholesale',
    receivingBusinessId: 'TL-ORG-9801',
    receivingBusinessName: 'Apex Supply Co.',
    receivingBusinessUsername: '@apexsupply',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantityPurchased: 250,
    unitOfMeasure: 'units',
    unitPrice: 380,
    totalAmount: 95000,
    currency: 'USD',
    paymentStatus: 'Unpaid',
    invoiceDocRef: 'DOC-P2',
    decisionStatus: 'Pending',
    verificationStatus: 'Verification Pending',
    inventoryMovementApplied: false,
    createdAt: '2026-10-15T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
  };

  state.receivedInvoices.push(purchase1, purchase2);

  assert.equal(state.receivedInvoices.length, 2);
  assert.equal(state.receivedInvoices[0].id, 'REC-P1');
  assert.equal(state.receivedInvoices[1].id, 'REC-P2');
  assert.notEqual(state.receivedInvoices[0].issueDate, state.receivedInvoices[1].issueDate);
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 8: Record two sales of the same product on different dates. Both remain visible.
// ─────────────────────────────────────────────────────────────
test('Scenario 8: Record two sales of the same product on different dates. Both remain visible.', () => {
  let state = createFreshTestState();

  const sale1: IssuedInvoiceRecord = {
    id: 'ISS-S1',
    originalInvoiceNumber: 'SALE-OCT-1',
    issueDate: '2026-10-03',
    issuingBusinessId: 'TL-ORG-9801',
    issuingBusinessName: 'Apex Supply Co.',
    issuingBusinessUsername: '@apexsupply',
    buyerBusinessId: 'TL-ORG-4420',
    buyerBusinessName: 'Nexus Global Logistics',
    buyerBusinessUsername: '@nexusglobal',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantitySold: 50,
    unitOfMeasure: 'units',
    unitPrice: 420,
    totalAmount: 21000,
    currency: 'USD',
    paymentStatus: 'Paid',
    invoiceDocRef: 'DOC-S1',
    decisionStatus: 'Approved',
    verificationStatus: 'Consistent',
    inventoryMovementApplied: true,
    createdAt: '2026-10-03T09:00:00Z',
    updatedAt: '2026-10-03T09:00:00Z',
  };

  const sale2: IssuedInvoiceRecord = {
    id: 'ISS-S2',
    originalInvoiceNumber: 'SALE-OCT-2',
    issueDate: '2026-10-18',
    issuingBusinessId: 'TL-ORG-9801',
    issuingBusinessName: 'Apex Supply Co.',
    issuingBusinessUsername: '@apexsupply',
    buyerBusinessId: 'TL-ORG-7714',
    buyerBusinessName: 'Summit Distributors Ltd',
    buyerBusinessUsername: '@summitlogistics',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantitySold: 80,
    unitOfMeasure: 'units',
    unitPrice: 420,
    totalAmount: 33600,
    currency: 'USD',
    paymentStatus: 'Unpaid',
    invoiceDocRef: 'DOC-S2',
    decisionStatus: 'Pending',
    verificationStatus: 'Verification Pending',
    inventoryMovementApplied: false,
    createdAt: '2026-10-18T09:00:00Z',
    updatedAt: '2026-10-18T09:00:00Z',
  };

  state.issuedInvoices.push(sale1, sale2);

  assert.equal(state.issuedInvoices.length, 2);
  assert.equal(state.issuedInvoices[0].id, 'ISS-S1');
  assert.equal(state.issuedInvoices[1].id, 'ISS-S2');
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 9: Detect a transaction whose counterpart record is missing.
// ─────────────────────────────────────────────────────────────
test('Scenario 9: Detect a transaction whose counterpart record is missing.', () => {
  let state = createFreshTestState();

  const missingCounterpartInvoice: IssuedInvoiceRecord = {
    id: 'ISS-MISSING-CP',
    originalInvoiceNumber: 'INV-NO-COUNTERPART-99',
    issueDate: '2026-10-12',
    issuingBusinessId: 'TL-ORG-9801',
    issuingBusinessName: 'Apex Supply Co.',
    issuingBusinessUsername: '@apexsupply',
    buyerBusinessId: 'TL-ORG-9999',
    buyerBusinessName: 'Unregistered Ghost Trader',
    buyerBusinessUsername: '@ghosttrader',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantitySold: 100,
    unitOfMeasure: 'units',
    unitPrice: 420,
    totalAmount: 42000,
    currency: 'USD',
    paymentStatus: 'Unpaid',
    invoiceDocRef: 'DOC-MISSING-CP',
    decisionStatus: 'Pending',
    verificationStatus: 'Verification Pending',
    linkedReceivedInvoiceRef: 'NON-EXISTENT-PO-REF',
    inventoryMovementApplied: false,
    createdAt: '2026-10-12T10:00:00Z',
    updatedAt: '2026-10-12T10:00:00Z',
  };

  state.issuedInvoices.push(missingCounterpartInvoice);

  const report = runRecursiveIntelligenceReconciliation('ISS-MISSING-CP', 'issued', state);

  assert.ok(report.missingEvidence.some(m => m.includes('NON-EXISTENT-PO-REF') || m.includes('counterpart')));
  assert.ok(report.riskIndicators.some(r => r.code === 'ERR_MISSING_COUNTERPART'));
  assert.notEqual(report.overallResult, 'Consistent');
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 10: Detect an attempted sale that exceeds supported available inventory.
// ─────────────────────────────────────────────────────────────
test('Scenario 10: Detect an attempted sale that exceeds supported available inventory.', () => {
  let state = createFreshTestState();
  state.inventory[0].currentStock = 100; // Only 100 available!

  const excessSaleInvoice: IssuedInvoiceRecord = {
    id: 'ISS-EXCESS',
    originalInvoiceNumber: 'INV-EXCESS-800',
    issueDate: '2026-10-14',
    issuingBusinessId: 'TL-ORG-9801',
    issuingBusinessName: 'Apex Supply Co.',
    issuingBusinessUsername: '@apexsupply',
    buyerBusinessId: 'TL-ORG-4420',
    buyerBusinessName: 'Nexus Global Logistics',
    buyerBusinessUsername: '@nexusglobal',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantitySold: 800, // Demands 800 units, but only 100 on hand!
    unitOfMeasure: 'units',
    unitPrice: 420,
    totalAmount: 336000,
    currency: 'USD',
    paymentStatus: 'Unpaid',
    invoiceDocRef: 'DOC-EXCESS',
    decisionStatus: 'Pending',
    verificationStatus: 'Verification Pending',
    inventoryMovementApplied: false,
    createdAt: '2026-10-14T10:00:00Z',
    updatedAt: '2026-10-14T10:00:00Z',
  };

  state.issuedInvoices.push(excessSaleInvoice);

  // 1. Check approval prevents negative inventory
  const approvalRes = processApproveIssuedInvoice('ISS-EXCESS', 'Auditor Vance', state);
  assert.ok(approvalRes.error?.includes('Insufficient stock'));
  assert.equal(approvalRes.updatedInvoice, null);

  // 2. Check intelligence reconciliation catches deficit
  const report = runRecursiveIntelligenceReconciliation('ISS-EXCESS', 'issued', state);
  assert.equal(report.overallResult, 'Inconsistency Detected');
  assert.ok(report.riskIndicators.some(r => r.code === 'ERR_INSUFFICIENT_STOCK_VOLUME'));
  assert.equal(report.quantityReconciliation.unsupportedQuantity, 700);
  assert.equal(report.quantityReconciliation.isBalanced, false);
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 11: Trace a transaction through multiple upstream businesses.
// ─────────────────────────────────────────────────────────────
test('Scenario 11: Trace a transaction through multiple upstream businesses.', () => {
  let state = createFreshTestState();

  const saleInvoice: IssuedInvoiceRecord = {
    id: 'TL-REC-2026-901',
    originalInvoiceNumber: 'INV-2026-0042',
    issueDate: '2026-10-02',
    issuingBusinessId: 'TL-ORG-9801',
    issuingBusinessName: 'Apex Supply Co.',
    issuingBusinessUsername: '@apexsupply',
    buyerBusinessId: 'TL-ORG-4420',
    buyerBusinessName: 'Nexus Global Logistics',
    buyerBusinessUsername: '@nexusglobal',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantitySold: 200,
    unitOfMeasure: 'units',
    unitPrice: 420,
    totalAmount: 84000,
    currency: 'USD',
    paymentStatus: 'Paid',
    invoiceDocRef: 'DOC-901',
    decisionStatus: 'Approved',
    verificationStatus: 'Consistent',
    inventoryMovementApplied: true,
    createdAt: '2026-10-02T08:00:00Z',
    updatedAt: '2026-10-02T08:00:00Z',
  };

  state.issuedInvoices.push(saleInvoice);

  const report = runRecursiveIntelligenceReconciliation('TL-REC-2026-901', 'issued', state, 'Supplier');

  // Should trace: Tier 2 (Meridian) -> Tier 1 (Apex Atlantic) -> Tier 0 (OmniCore Brand)
  assert.ok(report.upstreamChain.length >= 3);
  assert.ok(report.upstreamChain.some(h => h.role === 'Wholesaler'));
  assert.ok(report.upstreamChain.some(h => h.role === 'Distributor'));
  assert.ok(report.upstreamChain.some(h => h.role === 'Brand'));
  assert.equal(report.overallResult, 'Consistent');
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 12: Detect a missing upstream link without automatically claiming fraud.
// ─────────────────────────────────────────────────────────────
test('Scenario 12: Detect a missing upstream link without automatically claiming fraud.', () => {
  let state = createFreshTestState();

  const unvettedInvoice: ReceivedInvoiceRecord = {
    id: 'REC-UNVETTED',
    originalInvoiceNumber: 'UNVETTED-2026',
    issueDate: '2026-10-14',
    supplierBusinessId: 'TL-ORG-7341',
    supplierBusinessName: 'Kobe Heavy Industrial Materials',
    supplierBusinessUsername: '@kobeheavy',
    receivingBusinessId: 'TL-ORG-9801',
    receivingBusinessName: 'Apex Supply Co.',
    receivingBusinessUsername: '@apexsupply',
    productId: 'PROD-FCG-M2',
    productName: 'Firmware Calibration Gateway',
    sku: 'FCG-MOD-2',
    quantityPurchased: 100,
    unitOfMeasure: 'units',
    unitPrice: 900,
    totalAmount: 90000,
    currency: 'USD',
    paymentStatus: 'Payment Pending',
    invoiceDocRef: 'DOC-UNVETTED',
    decisionStatus: 'Pending',
    verificationStatus: 'Insufficient Evidence',
    inventoryMovementApplied: false,
    createdAt: '2026-10-14T16:00:00Z',
    updatedAt: '2026-10-14T16:00:00Z',
  };

  state.receivedInvoices.push(unvettedInvoice);

  const report = runRecursiveIntelligenceReconciliation('REC-UNVETTED', 'received', state);

  // Must conclude "Insufficient Evidence", NOT claim intentional fraud or forgery
  assert.equal(report.overallResult, 'Insufficient Evidence');
  assert.ok(report.riskIndicators.some(r => r.code === 'WARN_UNPROVEN_ORIGIN'));
  assert.ok(!report.explanation.toLowerCase().includes('fraudster'));
  assert.ok(report.recommendedNextAction.includes('commercial invoices and customs consignment records'));
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 13: Detect a duplicate or suspiciously reused invoice document.
// ─────────────────────────────────────────────────────────────
test('Scenario 13: Detect a duplicate or suspiciously reused invoice document.', () => {
  let state = createFreshTestState();

  const invoiceA: IssuedInvoiceRecord = {
    id: 'ISS-ORIG-01',
    originalInvoiceNumber: 'INV-2026-DUP',
    issueDate: '2026-10-10',
    issuingBusinessId: 'TL-ORG-9801',
    issuingBusinessName: 'Apex Supply Co.',
    issuingBusinessUsername: '@apexsupply',
    buyerBusinessId: 'TL-ORG-4420',
    buyerBusinessName: 'Nexus Global Logistics',
    buyerBusinessUsername: '@nexusglobal',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantitySold: 50,
    unitOfMeasure: 'units',
    unitPrice: 420,
    totalAmount: 21000,
    currency: 'USD',
    paymentStatus: 'Paid',
    invoiceDocRef: 'DOC-DUP-01',
    decisionStatus: 'Approved',
    verificationStatus: 'Consistent',
    inventoryMovementApplied: true,
    fingerprint: 'identical-canonical-hash-abcdef123456',
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
  };

  const invoiceB: IssuedInvoiceRecord = {
    id: 'ISS-DUP-02',
    originalInvoiceNumber: 'INV-2026-DUP', // Reused identifier!
    issueDate: '2026-10-16',
    issuingBusinessId: 'TL-ORG-9801',
    issuingBusinessName: 'Apex Supply Co.',
    issuingBusinessUsername: '@apexsupply',
    buyerBusinessId: 'TL-ORG-7714',
    buyerBusinessName: 'Summit Distributors Ltd',
    buyerBusinessUsername: '@summitlogistics',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantitySold: 50,
    unitOfMeasure: 'units',
    unitPrice: 420,
    totalAmount: 21000,
    currency: 'USD',
    paymentStatus: 'Unpaid',
    invoiceDocRef: 'DOC-DUP-02',
    decisionStatus: 'Pending',
    verificationStatus: 'Verification Pending',
    inventoryMovementApplied: false,
    fingerprint: 'identical-canonical-hash-abcdef123456', // Reused fingerprint!
    createdAt: '2026-10-16T10:00:00Z',
    updatedAt: '2026-10-16T10:00:00Z',
  };

  state.issuedInvoices.push(invoiceA, invoiceB);

  const report = runRecursiveIntelligenceReconciliation('ISS-DUP-02', 'issued', state);

  assert.equal(report.overallResult, 'Potential Risk');
  assert.ok(report.riskIndicators.some(r => r.code === 'WARN_DUPLICATE_IDENTIFIER' || r.code === 'WARN_DUPLICATE_DOCUMENT_FINGERPRINT'));
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 14: Prevent a user from viewing upstream business data without permission.
// ─────────────────────────────────────────────────────────────
test('Scenario 14: Prevent a user from viewing upstream business data without permission (Role-Based Scoping).', () => {
  let state = createFreshTestState();

  const saleInvoice: IssuedInvoiceRecord = {
    id: 'TL-REC-2026-901',
    originalInvoiceNumber: 'INV-2026-0042',
    issueDate: '2026-10-02',
    issuingBusinessId: 'TL-ORG-9801',
    issuingBusinessName: 'Apex Supply Co.',
    issuingBusinessUsername: '@apexsupply',
    buyerBusinessId: 'TL-ORG-4420',
    buyerBusinessName: 'Nexus Global Logistics',
    buyerBusinessUsername: '@nexusglobal',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantitySold: 200,
    unitOfMeasure: 'units',
    unitPrice: 420,
    totalAmount: 84000,
    currency: 'USD',
    paymentStatus: 'Paid',
    invoiceDocRef: 'DOC-901',
    decisionStatus: 'Approved',
    verificationStatus: 'Consistent',
    inventoryMovementApplied: true,
    createdAt: '2026-10-02T08:00:00Z',
    updatedAt: '2026-10-02T08:00:00Z',
  };

  state.issuedInvoices.push(saleInvoice);

  // Request verification as role 'Seller' (downstream retailer)
  const reportForSeller = runRecursiveIntelligenceReconciliation('TL-REC-2026-901', 'issued', state, 'Seller');

  assert.equal(reportForSeller.isScopedView, true, 'Scoped view must be active for Seller role');
  assert.equal(reportForSeller.requestorRole, 'Seller');

  // Verify that Tier 0 and Tier 1 upstream identities are redacted
  const tier0Hop = reportForSeller.upstreamChain.find(h => h.tierLevel === 0)!;
  assert.equal(tier0Hop.isRedacted, true);
  assert.ok(tier0Hop.businessName.includes('[Identity Masked for Commercial Privacy]'));
  assert.equal(tier0Hop.businessUsername, '@[confidential]');

  const tier1Hop = reportForSeller.upstreamChain.find(h => h.tierLevel === 1)!;
  assert.equal(tier1Hop.isRedacted, true);
  assert.equal(tier1Hop.businessUsername, '@[confidential]');

  // Compare with Brand or Auditor role who HAS permission:
  const reportForAuditor = runRecursiveIntelligenceReconciliation('TL-REC-2026-901', 'issued', state, 'Admin');
  assert.equal(reportForAuditor.isScopedView, false);
  const unmaskedTier0 = reportForAuditor.upstreamChain.find(h => h.tierLevel === 0)!;
  assert.equal(unmaskedTier0.businessName, 'OmniCore Precision Labs');
  assert.equal(unmaskedTier0.businessUsername, '@omnicore');
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 15: Confirm that returns and reversals preserve historical records.
// ─────────────────────────────────────────────────────────────
test('Scenario 15: Confirm that returns and reversals preserve historical records.', () => {
  let state = createFreshTestState();
  state.inventory[0].openingStock = 1000;
  state.inventory[0].currentStock = 1000;

  // 1. Issue and approve a sale of 200 units
  const saleInvoice: IssuedInvoiceRecord = {
    id: 'ISS-REV-TEST',
    originalInvoiceNumber: 'INV-TO-REVERSE',
    issueDate: '2026-10-05',
    issuingBusinessId: 'TL-ORG-9801',
    issuingBusinessName: 'Apex Supply Co.',
    issuingBusinessUsername: '@apexsupply',
    buyerBusinessId: 'TL-ORG-4420',
    buyerBusinessName: 'Nexus Global Logistics',
    buyerBusinessUsername: '@nexusglobal',
    productId: 'PROD-ISA-X4',
    productName: 'Industrial Sensor Array Model X4',
    sku: 'ISA-X4-BLK',
    quantitySold: 200,
    unitOfMeasure: 'units',
    unitPrice: 420,
    totalAmount: 84000,
    currency: 'USD',
    paymentStatus: 'Paid',
    invoiceDocRef: 'DOC-REV',
    decisionStatus: 'Pending',
    verificationStatus: 'Verification Pending',
    inventoryMovementApplied: false,
    createdAt: '2026-10-05T09:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
  };

  state.issuedInvoices.push(saleInvoice);

  const approvedState = processApproveIssuedInvoice('ISS-REV-TEST', 'Auditor Vance', state).state;
  assert.equal(approvedState.inventory[0].currentStock, 800); // 1000 - 200 = 800

  // 2. Perform controlled reversal
  const reversalRes = processReverseInvoice(
    'issued',
    'ISS-REV-TEST',
    'Customer cancelled order before shipping dispatch',
    'Auditor Vance',
    approvedState
  );

  assert.equal(reversalRes.error, undefined);
  assert.equal(reversalRes.updatedInvoice?.decisionStatus, 'Reversed');

  // Verify original invoice record is PRESERVED, not erased
  const preservedInvoice = reversalRes.state.issuedInvoices.find(i => i.id === 'ISS-REV-TEST');
  assert.ok(preservedInvoice, 'Original invoice record must remain in the ledger');
  assert.equal(preservedInvoice.decisionStatus, 'Reversed');

  // Verify compensating movement was added to the append-only ledger
  assert.ok(reversalRes.compensatingMovement);
  assert.equal(reversalRes.compensatingMovement?.type, 'RETURN_INWARD');
  assert.equal(reversalRes.compensatingMovement?.quantity, 200);

  // Verify stock is restored
  const restoredItem = reversalRes.state.inventory.find(i => i.productId === 'PROD-ISA-X4')!;
  assert.equal(restoredItem.currentStock, 1000, 'Reversal restored stock to 1,000 units');
});
