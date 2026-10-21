import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/finance';
import {
  Search,
  Bell,
  Plus,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Key,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const {
    invoices,
    setCurrentTab,
    setSelectedInvoice,
    activeProfile,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim()
    ? invoices.filter(i => {
        const q = searchQuery.toLowerCase();
        return (
          i.reference?.toLowerCase().includes(q) ||
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.issuer.name.toLowerCase().includes(q) ||
          i.buyer.name.toLowerCase().includes(q) ||
          i.issuer.username.toLowerCase().includes(q) ||
          i.buyer.username?.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center space-x-2">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search Input */}
        <div className="relative w-56 sm:w-80 md:w-96" ref={searchRef}>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Search invoice number or business..."
            className="w-full pl-9 pr-12 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded bg-white">
            ⌘K
          </div>
        </div>

        {/* Live Search Results Popover */}
        {showResults && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto p-2 space-y-1 z-50 text-xs">
            {searchResults.length > 0 ? (
              searchResults.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => {
                    setSelectedInvoice(inv);
                    setShowResults(false);
                    setSearchQuery('');
                  }}
                  className="p-2.5 hover:bg-indigo-50/60 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>Invoice {inv.invoiceNumber || inv.reference}</span>
                      {inv.reference && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {inv.issuer.name} &rarr; {inv.buyer.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">
                      {formatCurrency(inv.financials.total, inv.currency)}
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No verified records match &ldquo;{searchQuery}&rdquo;.
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Quick Verify button */}
        <button
          onClick={() => setCurrentTab('verification')}
          className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Quick Lookup</span>
        </button>

        {/* Create Invoice Primary Button */}
        <button
          onClick={() => setCurrentTab('create')}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 active:scale-98 transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Invoice</span>
        </button>

        {/* User / Entity Pill */}
        <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            {activeProfile.name.charAt(0)}
          </div>
          <div className="text-left text-xs">
            <span className="font-semibold text-slate-800 block leading-tight">
              {activeProfile.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono leading-tight">
              {activeProfile.username}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
