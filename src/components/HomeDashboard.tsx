import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Network,
  ArrowRight,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Building,
  Layers,
  FileCheck2,
  Check,
  TrendingUp,
  Cpu,
  History,
  Info,
} from 'lucide-react';

export const HomeDashboard: React.FC = () => {
  const {
    setCurrentTab,
    activeProfile,
    setActiveProfile,
    businessRoles,
    inventoryItems,
    issuedInvoices,
    receivedInvoices,
    reassessmentEvents,
  } = useApp();

  // Metrics scoped to activeProfile
  const myIssued = useMemo(() => {
    return issuedInvoices.filter(
      i => i.issuingBusinessUsername === activeProfile.username || i.issuingBusinessId === activeProfile.id
    );
  }, [issuedInvoices, activeProfile]);

  const myReceived = useMemo(() => {
    return receivedInvoices.filter(
      r => r.receivingBusinessUsername === activeProfile.username || r.receivingBusinessId === activeProfile.id
    );
  }, [receivedInvoices, activeProfile]);

  const myInventory = useMemo(() => {
    return inventoryItems.filter(
      i => i.businessUsername === activeProfile.username || i.businessId === activeProfile.id
    );
  }, [inventoryItems, activeProfile]);

  const approvedCount = useMemo(() => {
    const issApproved = myIssued.filter(i => i.decisionStatus === 'Approved').length;
    const recApproved = myReceived.filter(r => r.decisionStatus === 'Approved').length;
    return issApproved + recApproved;
  }, [myIssued, myReceived]);

  const underReviewCount = useMemo(() => {
    const issRev = myIssued.filter(i => i.decisionStatus === 'Pending').length;
    const recRev = myReceived.filter(r => r.decisionStatus === 'Pending').length;
    return issRev + recRev;
  }, [myIssued, myReceived]);

  const totalCurrentStock = useMemo(() => {
    return myInventory.reduce((sum, item) => sum + item.currentStock, 0);
  }, [myInventory]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── TOP HERO HEADER & SYSTEM IDENTITY ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black text-indigo-600 tracking-tight flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600 inline" />
              <span>TrustLayer</span>
            </span>
            <span className="text-slate-300 text-lg">|</span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              System Architecture & Transaction Flow
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Intelligent Supply Chain Verification &bull; Multi-Source Reconciliation &bull; Fair & Transparent Decisions
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-semibold text-slate-500 block">
            Right Data + Smart Intelligence =
          </span>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wide">
            Trusted Business Network
          </span>
        </div>
      </div>

      {/* ── USERS / BUSINESS ROLES RIBBON ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700 flex items-center space-x-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Users / Business Roles (Access based on permissions)</span>
          </span>
          <span className="text-[11px] text-slate-400">Click to switch authenticated perspective</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {businessRoles.map(roleEntity => {
            const isActive = roleEntity.username === activeProfile.username;
            return (
              <button
                key={roleEntity.id}
                onClick={() => setActiveProfile(roleEntity)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {roleEntity.roleCategory}
                  </span>
                  {isActive && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className="font-bold text-xs text-slate-900 truncate">{roleEntity.name}</div>
                <div className="text-[10px] font-mono text-slate-400 truncate">{roleEntity.username}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── OPERATIONAL KPI METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices Recorded */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Invoices Recorded
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {myIssued.length + myReceived.length}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Sales: {myIssued.length}</span>
            <span>Purchases: {myReceived.length}</span>
          </div>
        </div>

        {/* Transactions Approved */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
            Transactions Approved
          </span>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            {approvedCount}
          </div>
          <div className="text-[11px] text-emerald-600">
            Backed by verified stock movements
          </div>
        </div>

        {/* Under Review / Pending */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
            Under Review / Pending
          </span>
          <div className="text-2xl font-extrabold text-amber-700 font-mono">
            {underReviewCount}
          </div>
          <div className="text-[11px] text-amber-600">
            Awaiting verification or stock confirmation
          </div>
        </div>

        {/* Available Stock Units */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
            On-Hand Verified Stock
          </span>
          <div className="text-2xl font-extrabold text-indigo-700 font-mono">
            {totalCurrentStock.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            {myInventory.length} product line(s) managed
          </div>
        </div>
      </div>

      {/* ── TRUSTLAYER INTELLIGENCE ENGINE & ARCHITECTURE CARD ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                TrustLayer Intelligence Engine
              </h2>
              <p className="text-xs text-slate-500">
                Analyzes, Reconciles, Verifies and Determines transaction integrity across all supply tiers.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentTab('inventory')}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            >
              Open Inventory
            </button>
            <button
              onClick={() => setCurrentTab('activity_log')}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors"
            >
              View Audit Trail
            </button>
          </div>
        </div>

        {/* 3 Central Intelligence Engines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Engine 1: Transaction Verification */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-2.5">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
              <FileCheck2 className="w-4 h-4" />
              <span>1. Transaction Verification</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li>Validate invoice structure & required fields</li>
              <li>Detect duplicates & reused invoice numbers</li>
              <li>Check quantity & product bilateral match</li>
              <li>Verify cryptographic SHA-256 fingerprints</li>
              <li>Apply business rules & compliance policies</li>
            </ul>
          </div>

          {/* Engine 2: Stock Reconciliation */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-2.5">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
              <Package className="w-4 h-4" />
              <span>2. Stock Reconciliation</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li>Calculate stock across multiple supply sources</li>
              <li>Track append-only inventory movements</li>
              <li>Match with issued & received invoice lines</li>
              <li>Identify volume deficits & inventory shortfalls</li>
              <li>Support multi-source purchases (e.g. 300 + 200 = 500)</li>
            </ul>
          </div>

          {/* Engine 3: Supply Chain Intelligence */}
          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 space-y-2.5">
            <div className="flex items-center space-x-2 text-purple-700 font-bold text-xs">
              <Network className="w-4 h-4" />
              <span>3. Supply Chain Intelligence</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li>Trace upstream provenance & downstream hops</li>
              <li>Identify multi-source suppliers dynamically</li>
              <li>Detect unrelated vs. connected discrepancies</li>
              <li>Protect valid downstream transactions (Fairness)</li>
              <li>Apply role-based confidentiality masking (RBAC)</li>
            </ul>
          </div>
        </div>

        {/* Data Layer Banner */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center space-x-2 font-semibold text-slate-800">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Data Layer:</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">Unified Data Model</span>
          <span className="text-slate-300">&bull;</span>
          <span className="font-mono text-[11px] text-slate-500">Transaction Links</span>
          <span className="text-slate-300">&bull;</span>
          <span className="font-mono text-[11px] text-slate-500">Immutable Stock Movements</span>
          <span className="text-slate-300">&bull;</span>
          <span className="font-mono text-[11px] text-slate-500">Evidence Trails</span>
          <span className="text-slate-300">&bull;</span>
          <span className="font-mono text-[11px] text-slate-500">Audit Logs</span>
        </div>
      </div>

      {/* ── ARCHITECTURE SCENARIO: MULTI-SOURCE PURCHASE & RECONCILIATION ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Example Scenario &bull; Multi-Source Purchase & Downstream Fairness
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Demonstrates multi-source stock aggregation and downstream protection against upstream disputes.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
            Live Verified Simulation
          </span>
        </div>

        {/* Visual Multi-Source Transaction Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {/* Step 1: Distributor A */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-1">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">1. Supplier</span>
            <div className="font-bold text-slate-900 text-xs">Distributor A</div>
            <p className="text-[11px] text-slate-600">Sells 1,000 units to Wholesaler B</p>
            <span className="text-[10px] font-mono font-semibold text-blue-700 block">Issued Invoice</span>
          </div>

          {/* Step 2: Wholesaler B Intake */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">2. Buyer / Stock</span>
            <div className="font-bold text-slate-900 text-xs">Wholesaler B</div>
            <p className="text-[11px] text-slate-600">Receives 1,000 units (700 sold, 300 remaining)</p>
            <span className="text-[10px] font-mono font-semibold text-emerald-700 block">300 Units On-Hand</span>
          </div>

          {/* Step 3: Distributor B Alternative Source */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">3. Alternative Source</span>
            <div className="font-bold text-slate-900 text-xs">Distributor B</div>
            <p className="text-[11px] text-slate-600">Sells 200 units to Wholesaler B</p>
            <span className="text-[10px] font-mono font-semibold text-emerald-700 block">+200 Approved Units</span>
          </div>

          {/* Step 4: Wholesaler B Sale */}
          <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 uppercase block">4. Multi-Source Sale</span>
            <div className="font-bold text-slate-900 text-xs">Wholesaler B (Seller)</div>
            <p className="text-[11px] text-slate-600">Sells 500 units to Supplier C (300 + 200)</p>
            <span className="text-[10px] font-mono font-semibold text-indigo-700 block">500 Total Approved</span>
          </div>

          {/* Step 5: Supplier C Intake */}
          <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/30 space-y-1">
            <span className="text-[10px] font-bold text-purple-700 uppercase block">5. Final Buyer</span>
            <div className="font-bold text-slate-900 text-xs">Supplier C</div>
            <p className="text-[11px] text-slate-600">Receives 500 units from Wholesaler B</p>
            <span className="text-[10px] font-mono font-semibold text-purple-700 block">Protected Downstream</span>
          </div>
        </div>

        {/* Key Outcomes Checklist */}
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="font-bold text-slate-800 text-xs mb-1">Key Architectural Outcomes:</div>
          <div className="space-y-1.5 text-slate-600">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Wholesaler B's purchase from Distributor B (200 units)</strong> is approved independently even if Distributor A encounters a discrepancy.
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Supplier C's invoice (500 units)</strong> is approved because it is mathematically and legally supported by multiple verified sources (300 + 200).
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Downstream Fairness:</strong> If Distributor A's original transaction is later flagged as disputed, only the 300 units depending on it are affected. Unrelated downstream transactions supported by Distributor B remain fully approved and protected.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
