import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLineTotal, calculateFinancials } from './finance.ts';
import {
  generateTrustLayerReference,
  createCanonicalInvoicePayload,
  computeSha256FingerprintSync,
  verifyInvoiceRecord,
} from './reference.ts';

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
