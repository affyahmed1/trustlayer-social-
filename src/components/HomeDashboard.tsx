import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getAuthorizedDirectConnections, BusinessCategory } from '../services/networkService';
import {
  ShieldCheck,
  Network,
  ArrowRight,
  Mail,
  MapPin,
  ChevronRight,
  UserCheck,
  FileCheck2,
  GitBranch,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export const HomeDashboard: React.FC = () => {
  const {
    setCurrentTab,
    activeProfile,
    inventoryItems,
    issuedInvoices,
    receivedInvoices,
  } = useApp();

  // Network connection metrics for the authenticated business
  const directConnections = useMemo(() => {
    return getAuthorizedDirectConnections(activeProfile.username);
  }, [activeProfile.username]);

  const categories: { key: BusinessCategory; label: string; desc: string }[] = [
    { key: 'DISTRIBUTOR', label: 'Distributors', desc: 'Direct regional distributors' },
    { key: 'WHOLESALER', label: 'Wholesalers', desc: 'Authorized wholesale trade partners' },
    { key: 'SUPPLIER', label: 'Suppliers', desc: 'Material & component suppliers' },
    { key: 'SELLER', label: 'Sellers', desc: 'Commercial retail & outlet sellers' },
  ];

  const totalConnectionsCount = useMemo(() => {
    return (
      directConnections.DISTRIBUTOR.length +
      directConnections.WHOLESALER.length +
      directConnections.SUPPLIER.length +
      directConnections.SELLER.length
    );
  }, [directConnections]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── TOP HERO BANNER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Business Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified cryptographic business identity and direct network partner management.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setCurrentTab('verification')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verify Record</span>
          </button>

          <button
            onClick={() => setCurrentTab('network')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 active:scale-98 transition-all shadow-xs"
          >
            <Network className="w-4 h-4" />
            <span>View Network</span>
          </button>
        </div>
      </div>

      {/* ── AUTHENTICATED BUSINESS IDENTITY CARD ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              {activeProfile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {activeProfile.name}
                </h2>
                {activeProfile.verified && (
                  <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Verified Entity Registry
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500 font-mono">
                <span>{activeProfile.username}</span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-slate-600 font-semibold">{activeProfile.id}</span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-slate-500 font-sans">{activeProfile.country}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentTab('settings')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50/70 border border-transparent hover:border-indigo-100 transition-all flex items-center space-x-1"
            >
              <span>Organization Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Contact & Registration Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-600">
          {activeProfile.contactPerson && (
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Primary Contact</span>
                <span className="font-semibold text-slate-800">{activeProfile.contactPerson}</span>
              </div>
            </div>
          )}

          {activeProfile.email && (
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Official Email</span>
                <span className="font-mono text-slate-800">{activeProfile.email}</span>
              </div>
            </div>
          )}

          {activeProfile.address && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Registered Address</span>
                <span className="text-slate-800 truncate block max-w-xs">{activeProfile.address}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── THREE-SHEET ARCHITECTURE SUMMARY ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Three-Sheet Ledger System
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Append-only supply-chain inventory & invoices</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sheet A: Inventory */}
          <div
            onClick={() => setCurrentTab('inventory')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Sheet A &bull; Inventory
                </span>
                <Package className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Product Inventory
              </div>
              <p className="text-xs text-slate-500 mt-1">
                One immutable record per product with append-only stock movement provenance.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span className="text-[11px] font-mono text-slate-400">
                {inventoryItems.filter(i => i.businessUsername === activeProfile.username || i.businessId === activeProfile.id).length} Tracked Products
              </span>
              <span className="flex items-center space-x-1">
                <span>View Sheet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Sheet B: Issued Invoices */}
          <div
            onClick={() => setCurrentTab('issued_invoices')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Sheet B &bull; Issued
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Issued Invoices
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Permanent records of outgoing sales. Approvals validate stock and decrease inventory exactly once.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span className="text-[11px] font-mono text-slate-400">
                {issuedInvoices.filter(i => i.issuingBusinessUsername === activeProfile.username || i.issuingBusinessId === activeProfile.id).length} Outgoing Invoices
              </span>
              <span className="flex items-center space-x-1">
                <span>View Sheet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Sheet C: Received Invoices */}
          <div
            onClick={() => setCurrentTab('received_invoices')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-sm cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Sheet C &bull; Received
                </span>
                <ArrowDownLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <div className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Received Invoices
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Permanent records of supplier purchases. Approvals increase receiving stock with idempotency.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
              <span className="text-[11px] font-mono text-slate-400">
                {receivedInvoices.filter(i => i.receivingBusinessUsername === activeProfile.username || i.receivingBusinessId === activeProfile.id).length} Incoming Invoices
              </span>
              <span className="flex items-center space-x-1">
                <span>View Sheet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── NETWORK DIRECT CONNECTIONS SUMMARY GRID (4 Categories) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Direct Trading Network ({totalConnectionsCount} Authorized)
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Strictly direct counterparties</span>
          </div>

          <button
            onClick={() => setCurrentTab('network')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <span>Open Tree View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(cat => {
            const count = directConnections[cat.key]?.length || 0;

            return (
              <div
                key={cat.key}
                onClick={() => setCurrentTab('network')}
                className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
                    {cat.label}
                  </span>
                  <Network className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {count}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {cat.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── QUICK ACTION CARDS: VERIFICATION & NETWORK ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verification Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Cryptographic Record Verification
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify canonical SHA-256 fingerprints to guarantee commercial invoice records and trade agreements have not been modified or altered.
            </p>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">SHA-256 Proof Engine</span>
            <button
              onClick={() => setCurrentTab('verification')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              <span>Launch Verifier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Network Topology Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Direct Trading Network Topology
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Inspect your verified relationship tree organized across Distributors, Wholesalers, Suppliers, and Sellers with strict direct-connection privacy.
            </p>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">4-Category Governance</span>
            <button
              onClick={() => setCurrentTab('network')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              <span>Explore Network Tree</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
