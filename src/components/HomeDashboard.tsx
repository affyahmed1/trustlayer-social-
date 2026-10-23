import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';

export const HomeDashboard: React.FC = () => {
  const {
    activeProfile,
    inventoryItems,
    issuedInvoices,
    receivedInvoices,
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
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-xs text-slate-500 mt-1">
          Invoice and stock activity for {activeProfile.name}
        </p>
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
    </div>
  );
};
