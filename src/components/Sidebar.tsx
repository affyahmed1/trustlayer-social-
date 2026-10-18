import React, { useState } from 'react';
import { useApp, NavigationTab } from '../context/AppContext';
import {
  Home,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  MessageSquare,
  Activity,
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
    issuedFilter,
    setIssuedFilter,
    receivedFilter,
    setReceivedFilter,
    activeProfile,
    setActiveProfile,
    threads,
  } = useApp();

  const handleNav = (tab: NavigationTab) => {
    setCurrentTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const [issuedExpanded, setIssuedExpanded] = useState(true);
  const [receivedExpanded, setReceivedExpanded] = useState(true);

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

        {/* Issued Invoices Expandable Group */}
        <div className="pt-2">
          <div
            onClick={() => {
              setCurrentTab('issued');
              setIssuedExpanded(!issuedExpanded);
            }}
            className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
              currentTab === 'issued'
                ? 'bg-indigo-50/70 text-indigo-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <ArrowUpRight className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Issued Invoices</span>
            </div>
            {issuedExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>

          {issuedExpanded && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              {[
                { id: 'all', label: 'All Issued' },
                { id: 'paid', label: 'Paid' },
                { id: 'unpaid', label: 'Unpaid' },
                { id: 'due_today', label: 'Due Today' },
                { id: 'overdue', label: 'Overdue' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setIssuedFilter(f.id as any);
                    setCurrentTab('issued');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                    currentTab === 'issued' && issuedFilter === f.id
                      ? 'text-indigo-700 font-bold bg-indigo-50/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Received Invoices Expandable Group */}
        <div className="pt-1">
          <div
            onClick={() => {
              setCurrentTab('received');
              setReceivedExpanded(!receivedExpanded);
            }}
            className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
              currentTab === 'received'
                ? 'bg-indigo-50/70 text-indigo-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <ArrowDownLeft className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Received Invoices</span>
            </div>
            {receivedExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>

          {receivedExpanded && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              {[
                { id: 'all', label: 'All Received' },
                { id: 'pending_review', label: 'Pending Review' },
                { id: 'accepted', label: 'Accepted' },
                { id: 'rejected', label: 'Rejected' },
                { id: 'paid', label: 'Paid' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setReceivedFilter(f.id as any);
                    setCurrentTab('received');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                    currentTab === 'received' && receivedFilter === f.id
                      ? 'text-indigo-700 font-bold bg-indigo-50/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

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

        {/* Activity */}
        <button
          onClick={() => handleNav('activity')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'activity'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>Activity</span>
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
