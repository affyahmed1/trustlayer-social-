import type { Invoice, BusinessEntity } from '../types/index.ts';

export type BusinessRole =
  | 'Brand / Manufacturer'
  | 'Distributor'
  | 'Wholesaler'
  | 'Logistics Carrier'
  | 'Component Supplier'
  | 'Retailer / Buyer';

export interface NetworkNode {
  id: string; // unique identifier (TrustLayer ID e.g. TL-ORG-XXXX or username)
  name: string;
  username: string;
  trustlayerId: string;
  businessType: BusinessRole;
  country: string;
  verified: boolean;
  tier: number; // 0 = Focal, 1 = Direct Tier-1, 2 = Downstream/Upstream Tier-2
  isDirectConnection: boolean;
  isAuthorized: boolean; // Least privilege: true for focal and direct counterparties
  firstTransactionDate?: string;
  lastTransactionDate?: string;
  entity: BusinessEntity;
  stats: {
    invoiceCount: number;
    purchasesByCurrency: Record<string, number>;
    salesByCurrency: Record<string, number>;
    paidCount: number;
    unpaidCount: number;
    overdueCount: number;
    disputedCount: number;
    totalQuantityPurchased: number;
    totalQuantitySold: number;
  };
  childrenIds?: string[];
  isExpanded?: boolean;
}

export interface NetworkEdge {
  id: string; // source_target
  source: string; // Node ID
  target: string; // Node ID
  sourceName: string;
  targetName: string;
  relationshipType: 'Supplies To' | 'Transports For' | 'Procures From';
  invoiceCount: number;
  invoices: Invoice[];
  totalsByCurrency: Record<string, number>;
  totalQuantity: number;
  firstTransactionDate: string;
  lastTransactionDate: string;
  status: 'active' | 'pending' | 'overdue' | 'disputed';
  integrityStatus: 'verified' | 'mismatch' | 'unverified';
  isDirect: boolean;
  isDemo?: boolean;
}

export interface InventoryFlowItem {
  sku: string;
  name: string;
  quantityPurchased: number; // Inbound recorded on invoices
  quantitySold: number; // Outbound recorded on invoices
  estimatedBalance: number; // Inbound - Outbound (documented, not physical count)
  unit: string;
  inflowCounterparties: string[];
  outflowCounterparties: string[];
  hasDiscrepancy: boolean;
  reviewNotice?: string;
}

export interface NetworkData {
  focalNodeId: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  inventoryFlows: InventoryFlowItem[];
}

/**
 * Standard known business roles
 */
const KNOWN_ROLES: Record<string, BusinessRole> = {
  '@apexsupply': 'Brand / Manufacturer',
  '@nexusglobal': 'Logistics Carrier',
  '@summitlogistics': 'Distributor',
  '@quantumtech': 'Component Supplier',
  '@northernprecision': 'Wholesaler',
  '@nordicparts': 'Component Supplier',
  '@alpinefreight': 'Logistics Carrier',
  '@euroretail': 'Retailer / Buyer',
};

/**
 * Secondary downstream/upstream partner demo records for illustrating Tier 2 multi-echelon network
 * Clearly tagged with isDemo: true per Milestone 6 & 7.
 */
export const EXTENDED_TIER2_PARTNERS: {
  entity: BusinessEntity;
  businessType: BusinessRole;
  parentUsername: string; // connected via this partner
  relationType: 'Supplies To' | 'Procures From' | 'Transports For';
  sampleInvoices: Partial<Invoice>[];
}[] = [
  {
    entity: {
      name: 'Northern Precision Tools A/S',
      username: '@northernprecision',
      id: 'TL-ORG-3108',
      contactPerson: 'Lars Lindqvist',
      email: 'restricted@trustlayer.network',
      phone: '+45 33 12 90 00',
      address: 'Industrivej 14, 2600 Glostrup',
      country: 'Denmark',
      verified: true,
    },
    businessType: 'Wholesaler',
    parentUsername: '@summitlogistics',
    relationType: 'Procures From',
    sampleInvoices: [
      {
        reference: 'TL-2026-NP-7711',
        invoiceNumber: 'SUM-NP-091',
        issueDate: '2026-09-20',
        dueDate: '2026-10-20',
        currency: 'USD',
        status: 'paid',
        financials: {
          subtotal: 3700,
          itemDiscounts: 0,
          invoiceDiscountPercent: 0,
          invoiceDiscountAmount: 0,
          shippingFee: 0,
          additionalFees: 0,
          taxableAmount: 3700,
          taxAmount: 0,
          total: 3700,
          amountPaid: 3700,
          amountDue: 0,
        },
        items: [
          {
            id: 'li-ext-1',
            name: 'Actuator Housing Kit',
            sku: 'HTA-800-HSG',
            quantity: 4,
            unit: 'units',
            unitPrice: 925,
            discountPercent: 0,
            taxRate: 0,
            total: 3700,
          },
        ],
      },
    ],
  },
  {
    entity: {
      name: 'Nordic Component Fab AB',
      username: '@nordicparts',
      id: 'TL-ORG-5221',
      contactPerson: 'Astrid Holm',
      email: 'restricted@trustlayer.network',
      phone: '+46 8 505 200 00',
      address: 'Hammarby Fabriksväg 25, Stockholm',
      country: 'Sweden',
      verified: true,
    },
    businessType: 'Component Supplier',
    parentUsername: '@quantumtech',
    relationType: 'Supplies To',
    sampleInvoices: [
      {
        reference: 'TL-2026-NC-4109',
        invoiceNumber: 'QP-NC-402',
        issueDate: '2026-08-15',
        dueDate: '2026-09-15',
        currency: 'USD',
        status: 'paid',
        financials: {
          subtotal: 1800,
          itemDiscounts: 0,
          invoiceDiscountPercent: 0,
          invoiceDiscountAmount: 0,
          shippingFee: 50,
          additionalFees: 0,
          taxableAmount: 1800,
          taxAmount: 0,
          total: 1850,
          amountPaid: 1850,
          amountDue: 0,
        },
        items: [
          {
            id: 'li-ext-2',
            name: 'Raw Optical Fiber Spool',
            sku: 'ROF-SPOOL',
            quantity: 30,
            unit: 'spools',
            unitPrice: 60,
            discountPercent: 0,
            taxRate: 0,
            total: 1800,
          },
        ],
      },
    ],
  },
  {
    entity: {
      name: 'Alpine Intermodal Freight AG',
      username: '@alpinefreight',
      id: 'TL-ORG-8920',
      contactPerson: 'Reto Meier',
      email: 'restricted@trustlayer.network',
      phone: '+41 44 211 44 00',
      address: 'Flughofstrasse 54, 8152 Glattbrugg',
      country: 'Switzerland',
      verified: true,
    },
    businessType: 'Logistics Carrier',
    parentUsername: '@nexusglobal',
    relationType: 'Transports For',
    sampleInvoices: [
      {
        reference: 'TL-2026-AF-9901',
        invoiceNumber: 'NGL-AF-104',
        issueDate: '2026-10-08',
        dueDate: '2026-10-22',
        currency: 'USD',
        status: 'paid',
        financials: {
          subtotal: 2200,
          itemDiscounts: 0,
          invoiceDiscountPercent: 0,
          invoiceDiscountAmount: 0,
          shippingFee: 0,
          additionalFees: 0,
          taxableAmount: 2200,
          taxAmount: 0,
          total: 2200,
          amountPaid: 2200,
          amountDue: 0,
        },
        items: [
          {
            id: 'li-ext-3',
            name: 'Cross-Alpine Rail Shuttle',
            sku: 'RAIL-ALP-01',
            quantity: 1,
            unit: 'service',
            unitPrice: 2200,
            discountPercent: 0,
            taxRate: 0,
            total: 2200,
          },
        ],
      },
    ],
  },
];

/**
 * Builds a normalized supply chain relationship graph from current invoices and focal profile.
 */
export function buildNetworkGraph(
  invoices: Invoice[],
  activeProfile: BusinessEntity,
  includeTier2Demo: boolean = true
): NetworkData {
  const focalId = activeProfile.username || activeProfile.id || 'focal';
  const nodesMap = new Map<string, NetworkNode>();
  const edgesMap = new Map<string, NetworkEdge>();

  // Helper to ensure node exists
  const getOrCreateNode = (entity: BusinessEntity, tier: number, isDirect: boolean): NetworkNode => {
    const id = entity.username || entity.id || entity.name;
    if (!nodesMap.has(id)) {
      const isFocal = id === focalId;
      const role = KNOWN_ROLES[id] || (isFocal ? 'Brand / Manufacturer' : 'Distributor');
      nodesMap.set(id, {
        id,
        name: entity.name,
        username: entity.username,
        trustlayerId: entity.id || 'TL-ORG-UNKNOWN',
        businessType: role,
        country: entity.country || 'Global',
        verified: entity.verified ?? true,
        tier: isFocal ? 0 : tier,
        isDirectConnection: isFocal || isDirect,
        isAuthorized: isFocal || isDirect, // Least-privilege: direct connections authorized
        entity,
        stats: {
          invoiceCount: 0,
          purchasesByCurrency: {},
          salesByCurrency: {},
          paidCount: 0,
          unpaidCount: 0,
          overdueCount: 0,
          disputedCount: 0,
          totalQuantityPurchased: 0,
          totalQuantitySold: 0,
        },
        childrenIds: [],
        isExpanded: true,
      });
    }
    return nodesMap.get(id)!;
  };

  // 1. Initialize focal node
  getOrCreateNode(activeProfile, 0, true);

  // 2. Iterate through all real invoices to extract direct commercial relationships
  for (const inv of invoices) {
    if (inv.status === 'draft') continue; // Only registered / exchanged invoices establish confirmed records

    const issuer = inv.issuer;
    const buyer = inv.buyer;
    if (!issuer || !buyer) continue;

    const issuerId = issuer.username || issuer.id || issuer.name;
    const buyerId = buyer.username || buyer.id || buyer.name;

    const isIssuerFocal = issuerId === focalId;
    const isBuyerFocal = buyerId === focalId;
    const isDirect = isIssuerFocal || isBuyerFocal;

    const issuerNode = getOrCreateNode(issuer, isIssuerFocal ? 0 : 1, isDirect);
    const buyerNode = getOrCreateNode(buyer, isBuyerFocal ? 0 : 1, isDirect);

    // Track statistics on nodes
    const invTotal = inv.financials?.total || 0;
    const curr = inv.currency || 'USD';

    // Issuer (Seller)
    issuerNode.stats.invoiceCount += 1;
    issuerNode.stats.salesByCurrency[curr] = (issuerNode.stats.salesByCurrency[curr] || 0) + invTotal;
    // Buyer (Purchaser)
    buyerNode.stats.invoiceCount += 1;
    buyerNode.stats.purchasesByCurrency[curr] = (buyerNode.stats.purchasesByCurrency[curr] || 0) + invTotal;

    // Status counts
    if (inv.status === 'paid') {
      issuerNode.stats.paidCount += 1;
      buyerNode.stats.paidCount += 1;
    } else if (inv.status === 'overdue') {
      issuerNode.stats.overdueCount += 1;
      buyerNode.stats.overdueCount += 1;
    } else if (inv.status === 'rejected') {
      issuerNode.stats.disputedCount += 1;
      buyerNode.stats.disputedCount += 1;
    } else {
      issuerNode.stats.unpaidCount += 1;
      buyerNode.stats.unpaidCount += 1;
    }

    // Line items quantity
    for (const item of inv.items || []) {
      const q = Number(item.quantity) || 0;
      issuerNode.stats.totalQuantitySold += q;
      buyerNode.stats.totalQuantityPurchased += q;
    }

    // Dates
    if (inv.issueDate) {
      if (!issuerNode.firstTransactionDate || inv.issueDate < issuerNode.firstTransactionDate) {
        issuerNode.firstTransactionDate = inv.issueDate;
      }
      if (!issuerNode.lastTransactionDate || inv.issueDate > issuerNode.lastTransactionDate) {
        issuerNode.lastTransactionDate = inv.issueDate;
      }
      if (!buyerNode.firstTransactionDate || inv.issueDate < buyerNode.firstTransactionDate) {
        buyerNode.firstTransactionDate = inv.issueDate;
      }
      if (!buyerNode.lastTransactionDate || inv.issueDate > buyerNode.lastTransactionDate) {
        buyerNode.lastTransactionDate = inv.issueDate;
      }
    }

    // Create / update Edge
    const edgeId = `${issuerId}__${buyerId}`;
    if (!edgesMap.has(edgeId)) {
      edgesMap.set(edgeId, {
        id: edgeId,
        source: issuerId,
        target: buyerId,
        sourceName: issuer.name,
        targetName: buyer.name,
        relationshipType: 'Supplies To',
        invoiceCount: 0,
        invoices: [],
        totalsByCurrency: {},
        totalQuantity: 0,
        firstTransactionDate: inv.issueDate,
        lastTransactionDate: inv.issueDate,
        status: 'active',
        integrityStatus: inv.verificationStatus === 'verified' ? 'verified' : 'unverified',
        isDirect,
        isDemo: false,
      });
    }

    const edge = edgesMap.get(edgeId)!;
    edge.invoiceCount += 1;
    edge.invoices.push(inv);
    edge.totalsByCurrency[curr] = (edge.totalsByCurrency[curr] || 0) + invTotal;

    for (const item of inv.items || []) {
      edge.totalQuantity += Number(item.quantity) || 0;
    }

    if (inv.issueDate < edge.firstTransactionDate) edge.firstTransactionDate = inv.issueDate;
    if (inv.issueDate > edge.lastTransactionDate) edge.lastTransactionDate = inv.issueDate;

    if (inv.status === 'overdue') edge.status = 'overdue';
    else if (inv.status === 'rejected') edge.status = 'disputed';

    // Link parent-child for hierarchy tree
    if (isIssuerFocal && !issuerNode.childrenIds?.includes(buyerId)) {
      issuerNode.childrenIds = [...(issuerNode.childrenIds || []), buyerId];
    } else if (isBuyerFocal && !issuerNode.childrenIds?.includes(buyerId)) {
      // If focal bought from issuer, focal is child of supplier, or in a tiered tree we show focal at root
      if (!focalNode().childrenIds?.includes(issuerId)) {
        focalNode().childrenIds = [...(focalNode().childrenIds || []), issuerId];
      }
    }
  }

  function focalNode(): NetworkNode {
    return nodesMap.get(focalId)!;
  }

  // 3. Optional: Add Tier-2 extended demonstration records to illustrate multi-tier visualization
  if (includeTier2Demo) {
    for (const ext of EXTENDED_TIER2_PARTNERS) {
      const parentId = ext.parentUsername;
      if (!nodesMap.has(parentId)) continue; // Parent must exist

      const extId = ext.entity.username;
      const extNode: NetworkNode = {
        id: extId,
        name: ext.entity.name,
        username: ext.entity.username,
        trustlayerId: ext.entity.id,
        businessType: ext.businessType,
        country: ext.entity.country,
        verified: ext.entity.verified ?? true,
        tier: 2, // Tier 2 partner
        isDirectConnection: false,
        isAuthorized: false, // Masked contact details under least-privilege
        entity: ext.entity,
        firstTransactionDate: ext.sampleInvoices[0]?.issueDate,
        lastTransactionDate: ext.sampleInvoices[0]?.issueDate,
        stats: {
          invoiceCount: ext.sampleInvoices.length,
          purchasesByCurrency: { USD: 0 },
          salesByCurrency: { USD: 0 },
          paidCount: ext.sampleInvoices.length,
          unpaidCount: 0,
          overdueCount: 0,
          disputedCount: 0,
          totalQuantityPurchased: 0,
          totalQuantitySold: 0,
        },
        childrenIds: [],
        isExpanded: true,
      };

      for (const inv of ext.sampleInvoices) {
        const total = inv.financials?.total || 0;
        const curr = inv.currency || 'USD';
        if (ext.relationType === 'Supplies To') {
          extNode.stats.salesByCurrency[curr] = (extNode.stats.salesByCurrency[curr] || 0) + total;
        } else {
          extNode.stats.purchasesByCurrency[curr] = (extNode.stats.purchasesByCurrency[curr] || 0) + total;
        }
        for (const item of inv.items || []) {
          extNode.stats.totalQuantitySold += item.quantity || 0;
        }
      }

      nodesMap.set(extId, extNode);

      // Connect parent node with Tier-2 node
      const parentNode = nodesMap.get(parentId)!;
      parentNode.childrenIds = [...(parentNode.childrenIds || []), extId];

      const edgeId = `${parentId}__${extId}`;
      edgesMap.set(edgeId, {
        id: edgeId,
        source: parentId,
        target: extId,
        sourceName: parentNode.name,
        targetName: ext.entity.name,
        relationshipType: ext.relationType,
        invoiceCount: ext.sampleInvoices.length,
        invoices: ext.sampleInvoices as Invoice[],
        totalsByCurrency: { USD: ext.sampleInvoices.reduce((a, b) => a + (b.financials?.total || 0), 0) },
        totalQuantity: ext.sampleInvoices.reduce(
          (a, b) => a + (b.items?.reduce((x, y) => x + (y.quantity || 0), 0) || 0),
          0
        ),
        firstTransactionDate: ext.sampleInvoices[0]?.issueDate || '2026-09-01',
        lastTransactionDate: ext.sampleInvoices[0]?.issueDate || '2026-09-01',
        status: 'active',
        integrityStatus: 'verified',
        isDirect: false,
        isDemo: true,
      });
    }
  }

  // 4. Calculate Recorded Inventory Flows (Milestone 8 Foundation)
  const inventoryFlows = calculateRecordedInventoryFlows(invoices, activeProfile);

  return {
    focalNodeId: focalId,
    nodes: Array.from(nodesMap.values()),
    edges: Array.from(edgesMap.values()),
    inventoryFlows,
  };
}

/**
 * Calculates recorded inventory inflows and outflows strictly from available line items.
 * Milestone 8: Does NOT assume invoice quantities prove physical stock.
 */
export function calculateRecordedInventoryFlows(
  invoices: Invoice[],
  activeProfile: BusinessEntity
): InventoryFlowItem[] {
  const focalUsername = activeProfile.username;
  const flowMap = new Map<string, InventoryFlowItem>();

  for (const inv of invoices) {
    if (inv.status === 'draft' || inv.status === 'cancelled') continue;

    const isIssuer = inv.issuer?.username === focalUsername;
    const isBuyer = inv.buyer?.username === focalUsername;
    if (!isIssuer && !isBuyer) continue;

    for (const item of inv.items || []) {
      const key = (item.sku || item.name || '').trim().toUpperCase();
      if (!key) continue;

      if (!flowMap.has(key)) {
        flowMap.set(key, {
          sku: item.sku || 'N/A',
          name: item.name,
          quantityPurchased: 0,
          quantitySold: 0,
          estimatedBalance: 0,
          unit: item.unit || 'units',
          inflowCounterparties: [],
          outflowCounterparties: [],
          hasDiscrepancy: false,
        });
      }

      const record = flowMap.get(key)!;
      const qty = Number(item.quantity) || 0;

      if (isBuyer) {
        // Inflow (Purchased from supplier)
        record.quantityPurchased += qty;
        if (inv.issuer?.name && !record.inflowCounterparties.includes(inv.issuer.name)) {
          record.inflowCounterparties.push(inv.issuer.name);
        }
      } else if (isIssuer) {
        // Outflow (Sold to buyer)
        record.quantitySold += qty;
        if (inv.buyer?.name && !record.outflowCounterparties.includes(inv.buyer.name)) {
          record.outflowCounterparties.push(inv.buyer.name);
        }
      }
    }
  }

  // Compute recorded remaining balances and check for potential review notices
  const results = Array.from(flowMap.values()).map(flow => {
    const estimatedBalance = flow.quantityPurchased - flow.quantitySold;
    const hasDiscrepancy = flow.quantityPurchased > 0 && estimatedBalance < 0;

    return {
      ...flow,
      estimatedBalance,
      hasDiscrepancy,
      reviewNotice: hasDiscrepancy
        ? 'Recorded sales exceed documented purchases in registered invoices. Requires baseline stock reconciliation.'
        : undefined,
    };
  });

  return results;
}
