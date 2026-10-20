import { BusinessEntity } from '../types';

export type BusinessCategory = 'DISTRIBUTOR' | 'WHOLESALER' | 'SUPPLIER' | 'SELLER';
export type ConnectionStatus = 'authorized' | 'pending' | 'rejected' | 'cancelled';

export interface AuthorizedConnection {
  id: string;
  fromBusinessUsername: string; // The authenticated owner of the connection
  business: BusinessEntity;
  category: BusinessCategory;
  status: ConnectionStatus;
  establishedAt: string;
  invoiceCount: number;
  totalVolume: number;
  currency: string;
  verified: boolean;
}

/**
 * Raw master connection registry.
 * Privacy & authorization rules:
 * - A business may ONLY retrieve its direct authorized connections where fromBusinessUsername matches.
 * - Downstream connections of counterparties are segregated and never returned.
 * - Non-authorized connections (pending, rejected, cancelled) are excluded from the active tree.
 */
const CONNECTION_RECORDS: AuthorizedConnection[] = [
  // ── Connections for Apex Supply Co. (@apexsupply) ──
  // DISTRIBUTORS
  {
    id: 'conn-apex-dist-1',
    fromBusinessUsername: '@apexsupply',
    business: {
      name: 'Summit Distributors Ltd',
      username: '@summitlogistics',
      id: 'TL-ORG-7714',
      contactPerson: 'Marcus Chen',
      email: 'finance@summitdist.com',
      phone: '+1 (415) 890-2341',
      address: '220 Fremont St, Floor 12, San Francisco, CA 94105',
      country: 'United States',
      taxId: 'US-EIN-19-8761204',
      website: 'https://summitdist.com',
      verified: true,
    },
    category: 'DISTRIBUTOR',
    status: 'authorized',
    establishedAt: '2026-01-15',
    invoiceCount: 8,
    totalVolume: 52400,
    currency: 'USD',
    verified: true,
  },
  {
    id: 'conn-apex-dist-2',
    fromBusinessUsername: '@apexsupply',
    business: {
      name: 'North Star Distribution Oy',
      username: '@northstardist',
      id: 'TL-ORG-3902',
      contactPerson: 'Tyler Evans',
      email: 'orders@northstardist.fi',
      phone: '+358 9 123 4567',
      address: 'Mannerheimintie 18, 00100 Helsinki',
      country: 'Finland',
      taxId: 'FI-9940129-3',
      website: 'https://northstardist.fi',
      verified: true,
    },
    category: 'DISTRIBUTOR',
    status: 'authorized',
    establishedAt: '2026-03-20',
    invoiceCount: 5,
    totalVolume: 31200,
    currency: 'USD',
    verified: true,
  },
  {
    id: 'conn-apex-dist-3',
    fromBusinessUsername: '@apexsupply',
    business: {
      name: 'Apex Atlantic Distribution',
      username: '@atlanticdist',
      id: 'TL-ORG-5182',
      contactPerson: 'Helena Clark',
      email: 'logistics@atlanticdist.com',
      phone: '+1 (212) 555-0199',
      address: '100 Wall Street, 14th Floor, New York, NY 10005',
      country: 'United States',
      taxId: 'US-EIN-82-4410921',
      website: 'https://atlanticdist.com',
      verified: true,
    },
    category: 'DISTRIBUTOR',
    status: 'authorized',
    establishedAt: '2026-05-10',
    invoiceCount: 3,
    totalVolume: 18900,
    currency: 'USD',
    verified: true,
  },

  // WHOLESALERS
  {
    id: 'conn-apex-ws-1',
    fromBusinessUsername: '@apexsupply',
    business: {
      name: 'Meridian Wholesale Group',
      username: '@meridianwholesale',
      id: 'TL-ORG-8831',
      contactPerson: 'Claire Dupont',
      email: 'accounts@meridiangroup.fr',
      phone: '+33 1 42 68 55 00',
      address: '42 Rue de Bassano, 75008 Paris',
      country: 'France',
      taxId: 'FR-88-2940192',
      vatNumber: 'FR882940192',
      website: 'https://meridiangroup.fr',
      verified: true,
    },
    category: 'WHOLESALER',
    status: 'authorized',
    establishedAt: '2026-02-10',
    invoiceCount: 6,
    totalVolume: 42100,
    currency: 'USD',
    verified: true,
  },
  {
    id: 'conn-apex-ws-2',
    fromBusinessUsername: '@apexsupply',
    business: {
      name: 'Pacific Rim Bulk Trade Ltd',
      username: '@pacificbulk',
      id: 'TL-ORG-2094',
      contactPerson: 'Jin-Woo Park',
      email: 'procurement@pacificbulk.com',
      phone: '+82 2 555 9012',
      address: 'Teheran-ro 152, Gangnam-gu, Seoul',
      country: 'South Korea',
      taxId: 'KR-102-88-44910',
      website: 'https://pacificbulk.com',
      verified: true,
    },
    category: 'WHOLESALER',
    status: 'authorized',
    establishedAt: '2026-04-12',
    invoiceCount: 4,
    totalVolume: 28400,
    currency: 'USD',
    verified: true,
  },

  // SUPPLIERS
  {
    id: 'conn-apex-sup-1',
    fromBusinessUsername: '@apexsupply',
    business: {
      name: 'Quantum Precision Parts',
      username: '@quantumtech',
      id: 'TL-ORG-6109',
      contactPerson: 'Sarah Jenkins',
      email: 'invoicing@quantumparts.de',
      phone: '+49 89 2018 4490',
      address: 'Maximilianstraße 35, 80539 München',
      country: 'Germany',
      taxId: 'DE-812-763-90',
      vatNumber: 'DE81276390',
      website: 'https://quantumparts.de',
      verified: true,
    },
    category: 'SUPPLIER',
    status: 'authorized',
    establishedAt: '2025-11-04',
    invoiceCount: 12,
    totalVolume: 84600,
    currency: 'USD',
    verified: true,
  },
  {
    id: 'conn-apex-sup-2',
    fromBusinessUsername: '@apexsupply',
    business: {
      name: 'Nexus Global Logistics',
      username: '@nexusglobal',
      id: 'TL-ORG-4420',
      contactPerson: 'Elena Rostova',
      email: 'accounts@nexusglobal.com',
      phone: '+44 20 7946 0921',
      address: '14 Canary Wharf Pier, London, E14 5AB',
      country: 'United Kingdom',
      taxId: 'GB-992-410-23',
      vatNumber: 'GB99241023',
      website: 'https://nexusglobal.com',
      verified: true,
    },
    category: 'SUPPLIER',
    status: 'authorized',
    establishedAt: '2025-09-18',
    invoiceCount: 9,
    totalVolume: 61800,
    currency: 'USD',
    verified: true,
  },
  {
    id: 'conn-apex-sup-3',
    fromBusinessUsername: '@apexsupply',
    business: {
      name: 'Kobe Heavy Industrial Materials',
      username: '@kobeheavy',
      id: 'TL-ORG-7341',
      contactPerson: 'Kenji Takahashi',
      email: 'orders@kobeheavy.jp',
      phone: '+81 78 360 8800',
      address: '1-1 Wakinohama-kaigandori, Chuo-ku, Kobe',
      country: 'Japan',
      taxId: 'JP-9018449012',
      website: 'https://kobeheavy.jp',
      verified: true,
    },
    category: 'SUPPLIER',
    status: 'authorized',
    establishedAt: '2026-02-28',
    invoiceCount: 4,
    totalVolume: 36700,
    currency: 'USD',
    verified: true,
  },

  // SELLERS
  {
    id: 'conn-apex-sel-1',
    fromBusinessUsername: '@apexsupply',
    business: {
      name: 'EuroRetail Direct SE',
      username: '@euroretail',
      id: 'TL-ORG-9102',
      contactPerson: 'Sophie Laurent',
      email: 'vendor-ops@euroretail.eu',
      phone: '+32 2 411 90 20',
      address: 'Avenue Louise 240, 1050 Bruxelles',
      country: 'Belgium',
      taxId: 'BE-0492-881-209',
      vatNumber: 'BE0492881209',
      website: 'https://euroretail.eu',
      verified: true,
    },
    category: 'SELLER',
    status: 'authorized',
    establishedAt: '2026-05-02',
    invoiceCount: 7,
    totalVolume: 49300,
    currency: 'USD',
    verified: true,
  },
  {
    id: 'conn-apex-sel-2',
    fromBusinessUsername: '@apexsupply',
    business: {
      name: 'Vanguard Industrial Outlet',
      username: '@vanguardoutlet',
      id: 'TL-ORG-8419',
      contactPerson: 'Liam Miller',
      email: 'procurement@vanguardoutlet.com',
      phone: '+1 (312) 880-9941',
      address: '500 W Monroe St, Chicago, IL 60661',
      country: 'United States',
      taxId: 'US-EIN-36-9901428',
      website: 'https://vanguardoutlet.com',
      verified: true,
    },
    category: 'SELLER',
    status: 'authorized',
    establishedAt: '2026-06-19',
    invoiceCount: 3,
    totalVolume: 21500,
    currency: 'USD',
    verified: true,
  },

  // ── NON-AUTHORIZED / PENDING RECORDS (Must NEVER be returned as active connections) ──
  {
    id: 'conn-apex-pending-1',
    fromBusinessUsername: '@apexsupply',
    business: {
      name: 'Pending Unvetted Trader',
      username: '@unvettedtrader',
      id: 'TL-ORG-9999',
      contactPerson: 'Unknown',
      email: 'pending@unvetted.com',
      phone: '+1 555 000 0000',
      address: 'Unknown St',
      country: 'Unknown',
      verified: false,
    },
    category: 'SELLER',
    status: 'pending',
    establishedAt: '2026-10-01',
    invoiceCount: 0,
    totalVolume: 0,
    currency: 'USD',
    verified: false,
  },
  {
    id: 'conn-apex-rejected-1',
    fromBusinessUsername: '@apexsupply',
    business: {
      name: 'Rejected Disputed Vendor',
      username: '@rejectedvendor',
      id: 'TL-ORG-0000',
      contactPerson: 'None',
      email: 'rejected@vendor.com',
      phone: '+1 555 111 2222',
      address: 'None',
      country: 'Unknown',
      verified: false,
    },
    category: 'DISTRIBUTOR',
    status: 'rejected',
    establishedAt: '2026-09-01',
    invoiceCount: 0,
    totalVolume: 0,
    currency: 'USD',
    verified: false,
  },

  // ── Connections for Summit Distributors (@summitlogistics) ──
  // Proves that when another business logs in, it ONLY sees its OWN direct connections
  {
    id: 'conn-summit-sup-1',
    fromBusinessUsername: '@summitlogistics',
    business: {
      name: 'Apex Supply Co.',
      username: '@apexsupply',
      id: 'TL-ORG-9801',
      contactPerson: 'David Vance',
      email: 'billing@apexsupply.io',
      phone: '+1 (555) 382-9011',
      address: '840 Industrial Blvd, Suite 400, Chicago, IL 60607',
      country: 'United States',
      taxId: 'US-EIN-48-2940182',
      website: 'https://apexsupply.io',
      verified: true,
    },
    category: 'SUPPLIER',
    status: 'authorized',
    establishedAt: '2026-01-15',
    invoiceCount: 8,
    totalVolume: 52400,
    currency: 'USD',
    verified: true,
  },
  {
    id: 'conn-summit-ws-1',
    fromBusinessUsername: '@summitlogistics',
    business: {
      name: 'Northern Precision Tools A/S',
      username: '@northernprecision',
      id: 'TL-ORG-3108',
      contactPerson: 'Lars Lindqvist',
      email: 'sales@northernprecision.dk',
      phone: '+45 33 12 90 00',
      address: 'Industrivej 14, 2600 Glostrup',
      country: 'Denmark',
      verified: true,
    },
    category: 'WHOLESALER',
    status: 'authorized',
    establishedAt: '2026-02-14',
    invoiceCount: 4,
    totalVolume: 22800,
    currency: 'USD',
    verified: true,
  },
];

/**
 * Backend Data-Access / Service privacy controller.
 * Enforces:
 * 1. Authenticated tenant boundary: Only returns records where fromBusinessUsername === authenticatedUsername.
 * 2. Authorization status: Only returns records with status === 'authorized' (pending/rejected strictly omitted).
 * 3. Direct connections only: Never expands downstream or indirect connections of counterparties.
 * 4. Safe categorization: Returns guaranteed array slots for the four permanent categories:
 *    DISTRIBUTOR, WHOLESALER, SUPPLIER, SELLER.
 */
export function getAuthorizedDirectConnections(
  authenticatedUsername: string
): Record<BusinessCategory, AuthorizedConnection[]> {
  // Permanent category branches guaranteed to always be present
  const result: Record<BusinessCategory, AuthorizedConnection[]> = {
    DISTRIBUTOR: [],
    WHOLESALER: [],
    SUPPLIER: [],
    SELLER: [],
  };

  if (!authenticatedUsername) {
    return result;
  }

  // Retrieve strictly direct records belonging to authenticated business
  const authorizedDirectList = CONNECTION_RECORDS.filter(
    record =>
      record.fromBusinessUsername.toLowerCase() === authenticatedUsername.toLowerCase() &&
      record.status === 'authorized'
  );

  // Group by permanent categories
  for (const conn of authorizedDirectList) {
    if (conn.category in result) {
      result[conn.category].push(conn);
    }
  }

  return result;
}

/**
 * Helper to fetch a single direct connection by ID if authorized.
 */
export function getDirectConnectionById(
  connectionId: string,
  authenticatedUsername: string
): AuthorizedConnection | null {
  const found = CONNECTION_RECORDS.find(
    c =>
      c.id === connectionId &&
      c.fromBusinessUsername.toLowerCase() === authenticatedUsername.toLowerCase() &&
      c.status === 'authorized'
  );
  return found || null;
}
