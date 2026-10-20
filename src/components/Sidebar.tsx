import React, { useState } from 'react';
import { useApp, NavigationTab } from '../context/AppContext';
import {
  Home,
  PlusCircle,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  MessageSquare,
  Settings,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Building,
  RefreshCw,
  Network,
} from 'lucide-react';
import { COUNTERPARTIES, CURRENT_BUSINESS } from '../data/mockData';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const {
    currentTab,
    setCurrentTab,
    activeProfile,
    setActiveProfile,
    threads,
  } = useApp();

  const handleNav = (tab: NavigationTab) => {
    setCurrentTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  // Total unread messages
  const unreadCount = threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);

  const toggleProfile = () => {
    // Switch between Apex Supply Co. and Nexus Global Logistics to test both perspectives
    if (activeProfile.username === '@apexsupply') {
      setActiveProfile(COUNTERPARTIES[0]);
    } else {
      setActiveProfile(CURRENT_BUSINESS);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 select-none">
      {/* Brand Logo & Wordmark */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
        <div
          onClick={() => handleNav('home')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:bg-indigo-700 transition-colors">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-none">
              TrustLayer
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
              Business Registry
            </span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            &times;
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-xs font-semibold">
        {/* Home */}
        <button
          onClick={() => handleNav('home')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'home'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Home className="w-4 h-4 shrink-0" />
          <span>Home</span>
        </button>

        {/* Sheet A: Inventory */}
        <button
          onClick={() => handleNav('inventory')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'inventory'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4 shrink-0 text-indigo-600" />
          <span>Inventory</span>
        </button>

        {/* Sheet B: Issued Invoices */}
        <button
          onClick={() => handleNav('issued_invoices')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'issued_invoices'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 shrink-0 text-blue-600" />
          <span>Issued Invoices</span>
        </button>

        {/* Sheet C: Received Invoices */}
        <button
          onClick={() => handleNav('received_invoices')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'received_invoices'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Received Invoices</span>
        </button>

        {/* Create Invoice */}
        <button
          onClick={() => handleNav('create')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'create'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>Create Invoice</span>
        </button>

        {/* Network */}
        <button
          onClick={() => handleNav('network')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'network'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Network className="w-4 h-4 shrink-0 text-indigo-600" />
          <span>Network</span>
        </button>

        {/* Messages */}
        <button
          onClick={() => handleNav('messages')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
            currentTab === 'messages'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Messages</span>
          </div>
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Record Verification */}
        <button
          onClick={() => handleNav('verification')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'verification'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Verify Record</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => handleNav('settings')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'settings'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </button>
      </div>

      {/* Bottom Profile Section & Perspective Switcher */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Active Entity
            </span>
            <button
              onClick={toggleProfile}
              title="Switch business perspective to test issuer vs counterparty"
              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Switch</span>
            </button>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {activeProfile.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-slate-900 truncate flex items-center space-x-1">
                <span className="truncate">{activeProfile.name}</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              </div>
              <div className="text-[11px] font-mono text-slate-400 truncate">
                {activeProfile.username}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
