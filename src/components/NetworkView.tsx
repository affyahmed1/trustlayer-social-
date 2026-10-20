import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  getAuthorizedDirectConnections,
  AuthorizedConnection,
  BusinessCategory,
} from '../services/networkService';
import { ConnectionDetailModal } from './ConnectionDetailModal';
import { Search, User, ShieldCheck, CheckCircle2, Building2 } from 'lucide-react';

const CATEGORIES: BusinessCategory[] = ['DISTRIBUTOR', 'WHOLESALER', 'SUPPLIER', 'SELLER'];

export const NetworkView: React.FC = () => {
  const { activeProfile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnection, setSelectedConnection] = useState<AuthorizedConnection | null>(null);

  // Authenticated tenant data access: strictly direct authorized connections for logged-in profile
  const connectionsByCategory = useMemo(() => {
    return getAuthorizedDirectConnections(activeProfile.username);
  }, [activeProfile.username]);

  // Filter connections by search query
  const filteredConnectionsByCategory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered: Record<BusinessCategory, AuthorizedConnection[]> = {
      DISTRIBUTOR: [],
      WHOLESALER: [],
      SUPPLIER: [],
      SELLER: [],
    };

    CATEGORIES.forEach(cat => {
      const list = connectionsByCategory[cat] || [];
      if (!q) {
        filtered[cat] = list;
      } else {
        filtered[cat] = list.filter(
          conn =>
            conn.business.name.toLowerCase().includes(q) ||
            conn.business.username.toLowerCase().includes(q) ||
            conn.business.id.toLowerCase().includes(q)
        );
      }
    });

    return filtered;
  }, [connectionsByCategory, searchQuery]);

  // Total authorized count
  const totalDirectCount = useMemo(() => {
    return CATEGORIES.reduce(
      (sum, cat) => sum + (connectionsByCategory[cat]?.length || 0),
      0
    );
  }, [connectionsByCategory]);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] min-h-[640px] max-w-7xl mx-auto space-y-4">
      {/* ── TOP HEADER (Faithful to Mockup) ── */}
      <div className="bg-white px-6 pt-5 pb-0 rounded-xl border border-slate-200/80 shadow-xs shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Network
            </h1>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 font-medium">
              {totalDirectCount} Authorized Direct {totalDirectCount === 1 ? 'Connection' : 'Connections'}
            </span>
          </div>

          {/* Search bar matching mockup */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search your connections..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/70 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 transition-colors"
            />
          </div>
        </div>

        {/* Tree View Only Tab (Matching Reference Mockup) */}
        <div className="flex items-center space-x-6 pt-3">
          <div className="border-b-2 border-indigo-600 text-indigo-700 font-bold text-xs pb-2.5 px-1 flex items-center space-x-1.5 cursor-default">
            <span>Tree View</span>
          </div>
        </div>
      </div>

      {/* ── TREE VIEW CANVAS (Horizontal scrollable viewport) ── */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-auto relative p-6 sm:p-10 flex flex-col items-center select-none">
        <div className="min-w-[960px] w-full flex flex-col items-center">
          {/* 1. ROOT NODE: LOGGED-IN BUSINESS */}
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-3 bg-white border border-slate-300 shadow-sm rounded-xl px-7 py-3 hover:border-slate-400 transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                {activeProfile.name}
              </span>
            </div>
          </div>

          {/* 2. ROOT-TO-CATEGORIES BUS CONNECTOR */}
          <div className="w-full max-w-4xl relative h-12 flex flex-col items-center">
            {/* Vertical stem down from root */}
            <div className="w-[1.5px] h-6 bg-slate-300" />

            {/* Horizontal bus line spanning the four columns */}
            <div className="w-[75%] h-[1.5px] bg-slate-300 relative">
              {/* Vertical stems down to the 4 category cards */}
              <div className="absolute left-0 top-0 w-[1.5px] h-6 bg-slate-300" />
              <div className="absolute left-1/3 top-0 w-[1.5px] h-6 bg-slate-300" />
              <div className="absolute left-2/3 top-0 w-[1.5px] h-6 bg-slate-300" />
              <div className="absolute right-0 top-0 w-[1.5px] h-6 bg-slate-300" />
            </div>
          </div>

          {/* 3. FOUR PERMANENT CATEGORY BRANCHES */}
          <div className="w-full max-w-4xl grid grid-cols-4 gap-6 items-start">
            {CATEGORIES.map(category => {
              const connections = filteredConnectionsByCategory[category] || [];

              return (
                <div key={category} className="flex flex-col items-center">
                  {/* Category Header Card */}
                  <div className="w-full bg-white border border-slate-200 shadow-2xs rounded-lg py-2.5 px-3 text-center transition-all hover:border-slate-300">
                    <span className="text-[11px] font-bold tracking-wider text-slate-800 uppercase block">
                      {category}
                    </span>
                  </div>

                  {/* Vertical stem down from category card */}
                  <div className="w-[1.5px] h-6 bg-slate-300" />

                  {/* Connections List with Left Tree Trunk & Branch Lines */}
                  <div className="w-full flex flex-col items-start relative pl-4">
                    {/* Continuous vertical trunk line on the left */}
                    {connections.length > 0 && (
                      <div
                        className="absolute left-4 top-0 w-[1.5px] bg-slate-300"
                        style={{
                          height: `${(connections.length - 1) * 68 + 34}px`,
                        }}
                      />
                    )}

                    {connections.length === 0 ? (
                      /* Empty State for category */
                      <div className="w-full p-4 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50 my-1">
                        <span className="text-[11px] text-slate-400 block font-medium">
                          {searchQuery ? 'No match' : `No ${category.toLowerCase()}s`}
                        </span>
                      </div>
                    ) : (
                      connections.map(conn => {
                        return (
                          <div
                            key={conn.id}
                            className="w-full relative flex items-center py-2 group"
                          >
                            {/* Horizontal connector branch from trunk to card */}
                            <div className="absolute -left-0 w-4 h-[1.5px] bg-slate-300" />

                            {/* Connected Business Card (Matching image.png) */}
                            <div
                              onClick={() => setSelectedConnection(conn)}
                              className="w-full bg-white border border-slate-200/90 hover:border-indigo-400 rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold text-slate-900 truncate">
                                  {conn.business.name}
                                </span>
                              </div>

                              {/* Status indicator dot in top-right corner matching reference */}
                              <div className="shrink-0 -mt-2 -mr-1">
                                <span
                                  className="block w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"
                                  title="Authorized Direct Connection"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SLIDE-OVER DETAIL MODAL FOR CLICKED BUSINESS ── */}
      <ConnectionDetailModal
        connection={selectedConnection}
        isOpen={Boolean(selectedConnection)}
        onClose={() => setSelectedConnection(null)}
      />
    </div>
  );
};
