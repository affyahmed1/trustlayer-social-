import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNetworkGraph, calculateRecordedInventoryFlows } from './network.ts';
import type { Invoice, BusinessEntity } from '../types/index.ts';

const focalProfile: BusinessEntity = {
  name: 'Apex Supply Co.',
  username: '@apexsupply',
  id: 'TL-ORG-9801',
  contactPerson: 'David Vance',
  email: 'billing@apexsupply.io',
  phone: '+1 555 382 9011',
  address: '840 Industrial Blvd, Chicago, IL',
  country: 'United States',
  verified: true,
};

const buyer1: BusinessEntity = {
  name: 'Nexus Global Logistics',
  username: '@nexusglobal',
  id: 'TL-ORG-4420',
  contactPerson: 'Elena Rostova',
  email: 'accounts@nexusglobal.com',
  phone: '+44 20 7946 0921',
  address: '14 Canary Wharf, London',
  country: 'United Kingdom',
  verified: true,
};

const sampleInvoices: Invoice[] = [
  {
    id: 'inv-1',
    reference: 'TL-2026-0001-ABCD',
    invoiceNumber: 'INV-101',
    issueDate: '2026-10-01',
    dueDate: '2026-10-15',
    paymentTerms: 'Net 14',
    currency: 'USD',
    invoiceType: 'Commercial Invoice',
    status: 'paid',
    verificationStatus: 'verified',
    issuer: focalProfile,
    buyer: buyer1,
    items: [
      {
        id: 'li-1',
        name: 'Sensor Array X4',
        sku: 'ISA-X4',
        quantity: 10,
        unit: 'units',
        unitPrice: 400,
        discountPercent: 0,
        taxRate: 0,
        total: 4000,
      },
    ],
    financials: {
      subtotal: 4000,
      itemDiscounts: 0,
      invoiceDiscountPercent: 0,
      invoiceDiscountAmount: 0,
      shippingFee: 0,
      additionalFees: 0,
      taxableAmount: 4000,
      taxAmount: 0,
      total: 4000,
      amountPaid: 4000,
      amountDue: 0,
    },
    paymentInfo: { methods: ['Bank Transfer'] },
    additionalInfo: {},
    template: { name: 'professional', primaryColor: '#2563EB', showLogo: true, compact: false },
  },
  {
    id: 'inv-2',
    reference: 'TL-2026-0002-EFGH',
    invoiceNumber: 'INV-102',
    issueDate: '2026-10-05',
    dueDate: '2026-10-20',
    paymentTerms: 'Net 14',
    currency: 'EUR',
    invoiceType: 'Commercial Invoice',
    status: 'registered',
    verificationStatus: 'verified',
    issuer: buyer1,
    buyer: focalProfile,
    items: [
      {
        id: 'li-2',
        name: 'Sensor Array X4',
        sku: 'ISA-X4',
        quantity: 15,
        unit: 'units',
        unitPrice: 300,
        discountPercent: 0,
        taxRate: 0,
        total: 4500,
      },
    ],
    financials: {
      subtotal: 4500,
      itemDiscounts: 0,
      invoiceDiscountPercent: 0,
      invoiceDiscountAmount: 0,
      shippingFee: 0,
      additionalFees: 0,
      taxableAmount: 4500,
      taxAmount: 0,
      total: 4500,
      amountPaid: 0,
      amountDue: 4500,
    },
    paymentInfo: { methods: ['Bank Transfer'] },
    additionalInfo: {},
    template: { name: 'professional', primaryColor: '#2563EB', showLogo: true, compact: false },
  },
];

test('buildNetworkGraph creates nodes and distinct currencies without summing', () => {
  const network = buildNetworkGraph(sampleInvoices, focalProfile, false);

  assert.equal(network.focalNodeId, '@apexsupply');
  assert.equal(network.nodes.length, 2);

  const focal = network.nodes.find(n => n.id === '@apexsupply');
  assert.ok(focal);
  assert.equal(focal?.tier, 0);
  assert.equal(focal?.isAuthorized, true);

  // Currency separation check: USD sales and EUR purchases must remain separate
  assert.equal(focal?.stats.salesByCurrency['USD'], 4000);
  assert.equal(focal?.stats.purchasesByCurrency['EUR'], 4500);
  assert.equal(focal?.stats.purchasesByCurrency['USD'], undefined);
});

test('calculateRecordedInventoryFlows tracks inflow, outflow, and balances', () => {
  const flows = calculateRecordedInventoryFlows(sampleInvoices, focalProfile);

  assert.equal(flows.length, 1);
  const sensorFlow = flows[0];
  assert.equal(sensorFlow.sku, 'ISA-X4');
  assert.equal(sensorFlow.quantityPurchased, 15); // Bought 15 in inv-2
  assert.equal(sensorFlow.quantitySold, 10); // Sold 10 in inv-1
  assert.equal(sensorFlow.estimatedBalance, 5); // 15 - 10 = 5
  assert.equal(sensorFlow.hasDiscrepancy, false);
});
