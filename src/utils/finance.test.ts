import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLineTotal, calculateFinancials } from './finance.ts';
import {
  generateTrustLayerReference,
  createCanonicalInvoicePayload,
  computeSha256FingerprintSync,
  verifyInvoiceRecord,
} from './reference.ts';
import {
  recalculateProductStock,
  processApproveReceivedInvoice,
  processApproveIssuedInvoice,
  processReverseInvoice,
  processManualStockAdjustment,
  InventoryServiceState,
} from '../services/inventoryService';
import {
  InventoryItem,
  InventoryMovement,
  IssuedInvoiceRecord,
  ReceivedInvoiceRecord,
} from '../types/inventory';

test('calculateLineTotal applies discount correctly', () => {
  // 5 units at $100 with 10% discount = 5 * 100 * 0.9 = 450
  assert.equal(calculateLineTotal(5, 100, 10), 450);
  assert.equal(calculateLineTotal(2, 50, 0), 100);
  assert.equal(calculateLineTotal(0, 50, 10), 0);
});

test('calculateFinancials handles taxes, discounts, shipping, and amount due', () => {
  const result = calculateFinancials({
    items: [
      { quantity: 2, unitPrice: 500, discountPercent: 10, taxRate: 10 }, // 1000 gross, 100 disc, 900 net, 90 tax
      { quantity: 1, unitPrice: 200, discountPercent: 0, taxRate: 20 },  // 200 gross, 0 disc, 200 net, 40 tax
    ],
    invoiceDiscountPercent: 0,
    shippingFee: 50,
    additionalFees: 25,
    amountPaid: 300,
  });

  assert.equal(result.subtotal, 1200);
  assert.equal(result.itemDiscounts, 100);
  assert.equal(result.taxableAmount, 1100);
  assert.equal(result.taxAmount, 130);
  assert.equal(result.total, 1305); // 1100 + 130 + 50 + 25
  assert.equal(result.amountPaid, 300);
  assert.equal(result.amountDue, 1005);
});

test('generateTrustLayerReference generates compliant format TL-YYYY-XXXX-XXXX', () => {
  const ref = generateTrustLayerReference(2026);
  assert.match(ref, /^TL-2026-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
});

test('verifyInvoiceRecord detects match and mismatch', () => {
  const invoice = {
    id: 'inv-1',
    reference: 'TL-2026-ABCD-1234',
    invoiceNumber: 'INV-001',
    issueDate: '2026-10-01',
    dueDate: '2026-10-15',
    currency: 'USD',
    financials: { total: 1000 },
    issuer: { id: 'TL-ORG-1', name: 'Apex Ltd', verified: true },
    buyer: { name: 'Nexus Corp' },
    items: [{ id: '1', name: 'Item 1' }],
  };

  const payload = createCanonicalInvoicePayload({
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    total: invoice.financials.total,
    issuerId: invoice.issuer.id,
    issuerName: invoice.issuer.name,
    buyerName: invoice.buyer.name,
    itemsCount: 1,
  });

  const hash = computeSha256FingerprintSync(payload);
  const registeredInvoice = { ...invoice, fingerprint: hash };

  // Verification against valid record
  const validResult = verifyInvoiceRecord('TL-2026-ABCD-1234', [registeredInvoice]);
  assert.equal(validResult.status, 'FOUND');
  assert.equal(validResult.integrity, 'MATCH');
  assert.equal(validResult.issuerVerification, 'VERIFIED');

  // Verification with tampered amount
  const tamperedData = {
    ...registeredInvoice,
    financials: { total: 9999 }, // tampered!
  };
  const tamperedResult = verifyInvoiceRecord('TL-2026-ABCD-1234', [registeredInvoice], tamperedData);
  assert.equal(tamperedResult.status, 'FOUND');
  assert.equal(tamperedResult.integrity, 'MISMATCH');
  assert.ok(tamperedResult.tamperedFields?.includes('Total Amount'));

  // Non-existent record
  const notFoundResult = verifyInvoiceRecord('TL-2026-UNKNOWN', [registeredInvoice]);
  assert.equal(notFoundResult.status, 'NOT_FOUND');
});

// ==========================================
// TRUSTLAYER THREE-SHEET SYSTEM UNIT TESTS
// ==========================================

test('Sheet A: recalculateProductStock applies formula Opening + Purchases - Sales + Adjustments', () => {
  const openingStock = 1000;
  const movements: InventoryMovement[] = [
    {
      id: 'mov-1',
      businessId: 'biz-1',
      businessUsername: '@biz',
      productId: 'prod-100',
      type: 'PURCHASE_RECEIPT',
      quantity: 300,
      timestamp: '2026-10-01T10:00:00Z',
      actor: 'Admin',
      notes: 'Initial purchase batch',
      idempotencyKey: 'idemp-1',
    },
    {
      id: 'mov-2',
      businessId: 'biz-1',
      businessUsername: '@biz',
      productId: 'prod-100',
      type: 'SALE_DISPATCH',
      quantity: 200,
      timestamp: '2026-10-02T10:00:00Z',
      actor: 'Admin',
      notes: 'Sale to client',
      idempotencyKey: 'idemp-2',
    },
    {
      id: 'mov-3',
      businessId: 'biz-1',
      businessUsername: '@biz',
      productId: 'prod-100',
      type: 'MANUAL_ADJUSTMENT',
      quantity: 50,
      timestamp: '2026-10-03T10:00:00Z',
      actor: 'Admin',
      notes: 'Audit stock count adjustment',
      idempotencyKey: 'idemp-3',
    },
  ];

  const calc = recalculateProductStock('prod-100', 'biz-1', openingStock, movements);
  assert.equal(calc.approvedPurchases, 300);
  assert.equal(calc.approvedSales, 200);
  assert.equal(calc.adjustments, 50);
  assert.equal(calc.currentStock, 1150); // 1000 + 300 - 200 + 50
});

test('Sheet C -> Sheet A: processApproveReceivedInvoice increases stock and is idempotent', () => {
  const initialItem: InventoryItem = {
    productId: 'prod-1',
    productName: 'Titanium Sensor',
    sku: 'SEN-TIT-01',
    brand: 'Apex',
    unit: 'units',
    openingStock: 100,
    openingStockSource: 'Audited Initial Count',
    openingStockVerified: true,
    totalApprovedPurchases: 0,
    totalApprovedSales: 0,
    authorizedAdjustments: 0,
    currentStock: 100,
    stockVerificationStatus: 'verified',
    lastUpdated: '2026-10-01T00:00:00Z',
    businessId: 'biz-1',
    businessUsername: '@nexusglobal',
  };

  const receivedInv: ReceivedInvoiceRecord = {
    id: 'REC-001',
    originalInvoiceNumber: 'INV-SUP-99',
    issueDate: '2026-10-02',
    supplierBusinessId: 'biz-sup-1',
    supplierBusinessName: 'Apex Precision',
    supplierBusinessUsername: '@apex',
    receivingBusinessId: 'biz-1',
    receivingBusinessName: 'Nexus Global',
    receivingBusinessUsername: '@nexusglobal',
    productId: 'prod-1',
    productName: 'Titanium Sensor',
    sku: 'SEN-TIT-01',
    quantityPurchased: 50,
    unitOfMeasure: 'units',
    unitPrice: 200,
    totalAmount: 10000,
    currency: 'USD',
    paymentStatus: 'Paid',
    invoiceDocRef: 'DOC-REC-001.pdf',
    decisionStatus: 'Pending',
    verificationStatus: 'Consistent',
    inventoryMovementApplied: false,
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-02T00:00:00Z',
  };

  let state: InventoryServiceState = {
    inventory: [initialItem],
    movements: [],
    issuedInvoices: [],
    receivedInvoices: [receivedInv],
  };

  // Step 1: Approve purchase
  const step1 = processApproveReceivedInvoice('REC-001', 'Auditor John', state);
  assert.equal(step1.updatedInvoice?.decisionStatus, 'Approved');
  assert.equal(step1.state.inventory[0].currentStock, 150);
  assert.equal(step1.state.inventory[0].totalApprovedPurchases, 50);
  assert.equal(step1.state.movements.length, 1);

  // Step 2: Idempotent re-approval must NOT add extra movements or stock
  const step2 = processApproveReceivedInvoice('REC-001', 'Auditor John', step1.state);
  assert.equal(step2.state.inventory[0].currentStock, 150);
  assert.equal(step2.state.movements.length, 1);
});

test('Sheet B -> Sheet A: processApproveIssuedInvoice prevents negative stock and is idempotent', () => {
  const initialItem: InventoryItem = {
    productId: 'prod-2',
    productName: 'Ceramic Bearing',
    sku: 'BRG-CER-02',
    brand: 'Apex',
    unit: 'units',
    openingStock: 30,
    openingStockSource: 'Audited Initial Count',
    openingStockVerified: true,
    totalApprovedPurchases: 0,
    totalApprovedSales: 0,
    authorizedAdjustments: 0,
    currentStock: 30,
    stockVerificationStatus: 'verified',
    lastUpdated: '2026-10-01T00:00:00Z',
    businessId: 'biz-1',
    businessUsername: '@nexusglobal',
  };

  // Sale attempting 50 units (exceeds stock of 30)
  const excessiveSale: IssuedInvoiceRecord = {
    id: 'ISS-001',
    originalInvoiceNumber: 'INV-OUT-01',
    issueDate: '2026-10-02',
    issuingBusinessId: 'biz-1',
    issuingBusinessName: 'Nexus Global',
    issuingBusinessUsername: '@nexusglobal',
    buyerBusinessId: 'biz-buyer',
    buyerBusinessName: 'Omega Dynamics',
    buyerBusinessUsername: '@omega',
    productId: 'prod-2',
    productName: 'Ceramic Bearing',
    sku: 'BRG-CER-02',
    quantitySold: 50,
    unitOfMeasure: 'units',
    unitPrice: 150,
    totalAmount: 7500,
    currency: 'USD',
    paymentStatus: 'Paid',
    invoiceDocRef: 'DOC-OUT-01.pdf',
    decisionStatus: 'Pending',
    verificationStatus: 'Consistent',
    inventoryMovementApplied: false,
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-02T00:00:00Z',
  };

  let state: InventoryServiceState = {
    inventory: [initialItem],
    movements: [],
    issuedInvoices: [excessiveSale],
    receivedInvoices: [],
  };

  // Step 1: Reject sale exceeding available stock
  const failResult = processApproveIssuedInvoice('ISS-001', 'Admin', state);
  assert.ok(failResult.error?.includes('Insufficient stock'));
  assert.equal(failResult.state.inventory[0].currentStock, 30);

  // Step 2: Valid sale of 20 units
  const validSale: IssuedInvoiceRecord = {
    ...excessiveSale,
    id: 'ISS-002',
    originalInvoiceNumber: 'INV-OUT-02',
    quantitySold: 20,
    totalAmount: 3000,
  };
  state.issuedInvoices = [validSale];

  const successResult = processApproveIssuedInvoice('ISS-002', 'Admin', state);
  assert.equal(successResult.updatedInvoice?.decisionStatus, 'Approved');
  assert.equal(successResult.state.inventory[0].currentStock, 10); // 30 - 20
  assert.equal(successResult.state.inventory[0].totalApprovedSales, 20);

  // Step 3: Re-approval is idempotent
  const idempResult = processApproveIssuedInvoice('ISS-002', 'Admin', successResult.state);
  assert.equal(idempResult.state.inventory[0].currentStock, 10);
  assert.equal(idempResult.state.movements.length, 1);
});

test('Reversal preserves audit history and creates compensating movement', () => {
  const initialItem: InventoryItem = {
    productId: 'prod-3',
    productName: 'Optic Sensor',
    sku: 'OPT-03',
    brand: 'Apex',
    unit: 'units',
    openingStock: 50,
    openingStockSource: 'Audit',
    openingStockVerified: true,
    totalApprovedPurchases: 0,
    totalApprovedSales: 0,
    authorizedAdjustments: 0,
    currentStock: 50,
    stockVerificationStatus: 'verified',
    lastUpdated: '2026-10-01T00:00:00Z',
    businessId: 'biz-1',
    businessUsername: '@nexusglobal',
  };

  const saleInvoice: IssuedInvoiceRecord = {
    id: 'ISS-REV-01',
    originalInvoiceNumber: 'INV-REV-01',
    issueDate: '2026-10-02',
    issuingBusinessId: 'biz-1',
    issuingBusinessName: 'Nexus Global',
    issuingBusinessUsername: '@nexusglobal',
    buyerBusinessId: 'biz-buyer',
    buyerBusinessName: 'Omega Dynamics',
    buyerBusinessUsername: '@omega',
    productId: 'prod-3',
    productName: 'Optic Sensor',
    sku: 'OPT-03',
    quantitySold: 15,
    unitOfMeasure: 'units',
    unitPrice: 100,
    totalAmount: 1500,
    currency: 'USD',
    paymentStatus: 'Paid',
    invoiceDocRef: 'DOC-REV-01.pdf',
    decisionStatus: 'Pending',
    verificationStatus: 'Consistent',
    inventoryMovementApplied: false,
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-02T00:00:00Z',
  };

  let state: InventoryServiceState = {
    inventory: [initialItem],
    movements: [],
    issuedInvoices: [saleInvoice],
    receivedInvoices: [],
  };

  // 1. Approve sale (stock becomes 35)
  const approved = processApproveIssuedInvoice('ISS-REV-01', 'Admin', state);
  assert.equal(approved.state.inventory[0].currentStock, 35);
  assert.equal(approved.state.movements.length, 1);

  // 2. Reverse approved sale (compensating return inward restores stock to 50)
  const reversed = processReverseInvoice('issued', 'ISS-REV-01', 'Customer cancelled order after dispatch', 'Supervisor', approved.state);
  assert.equal(reversed.updatedInvoice?.decisionStatus, 'Reversed');
  assert.equal(reversed.compensatingMovement?.type, 'RETURN_INWARD');
  assert.equal(reversed.state.inventory[0].currentStock, 50); // Restored!
  // Both movements exist: sale + compensating reversal
  assert.equal(reversed.state.movements.length, 2);
  // Original invoice is preserved with reason, not deleted
  assert.equal(reversed.state.issuedInvoices.length, 1);
});

test('Controlled adjustment records movement and updates stock directly', () => {
  const initialItem: InventoryItem = {
    productId: 'prod-4',
    productName: 'Valve Assembly',
    sku: 'VLV-04',
    brand: 'Apex',
    unit: 'units',
    openingStock: 100,
    openingStockSource: 'Audit',
    openingStockVerified: true,
    totalApprovedPurchases: 0,
    totalApprovedSales: 0,
    authorizedAdjustments: 0,
    currentStock: 100,
    stockVerificationStatus: 'verified',
    lastUpdated: '2026-10-01T00:00:00Z',
    businessId: 'biz-1',
    businessUsername: '@nexusglobal',
  };

  const state: InventoryServiceState = {
    inventory: [initialItem],
    movements: [],
    issuedInvoices: [],
    receivedInvoices: [],
  };

  const res = processManualStockAdjustment(
    'prod-4',
    'biz-1',
    '@nexusglobal',
    -5,
    'Physical warehouse damage report #910',
    'Warehouse Manager',
    state
  );

  assert.equal(res.state.inventory[0].currentStock, 95);
  assert.equal(res.state.inventory[0].authorizedAdjustments, -5);
  assert.equal(res.movement.type, 'MANUAL_ADJUSTMENT');
  assert.equal(res.movement.quantity, -5);
});

