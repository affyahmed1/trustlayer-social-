import React, { useState } from 'react';
import { useApp, NavigationTab } from '../context/AppContext';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Building2,
  Network,
  ClipboardList,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const {
    currentTab,
    setCurrentTab,
    activeProfile,
    setActiveProfile,
    businessRoles,
  } = useApp();

  const [isInventoryExpanded, setIsInventoryExpanded] = useState(true);
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);

  const handleNav = (tab: NavigationTab) => {
    setCurrentTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const isInventoryActive =
    currentTab === 'inventory' ||
    currentTab === 'issued_invoices' ||
    currentTab === 'received_invoices';

  const currentRoleEntity =
    businessRoles.find(r => r.username === activeProfile.username) || {
      ...activeProfile,
      roleCategory: 'Supplier',
    };

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 select-none">
      {/* Brand Logo & Wordmark */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
        <div
          onClick={() => handleNav('overview')}
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
        {/* 1. Overview */}
        <button
          onClick={() => handleNav('overview')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'overview' || currentTab === 'home'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Overview</span>
        </button>

        {/* 2. Inventory Management Accordion */}
        <div className="space-y-0.5">
          <button
            onClick={() => setIsInventoryExpanded(!isInventoryExpanded)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
              isInventoryActive
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Layers className="w-4 h-4 shrink-0" />
              <span>Inventory Management</span>
            </div>
            {isInventoryExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-80" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />
            )}
          </button>

          {isInventoryExpanded && (
            <div className="pl-3 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4">
              {/* Inventory */}
              <button
                onClick={() => handleNav('inventory')}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  currentTab === 'inventory'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span>Inventory</span>
              </button>

              {/* Issued Invoices */}
              <button
                onClick={() => handleNav('issued_invoices')}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  currentTab === 'issued_invoices'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                <span>Issued Invoices</span>
              </button>

              {/* Received Invoices */}
              <button
                onClick={() => handleNav('received_invoices')}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  currentTab === 'received_invoices'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>Received Invoices</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Verification */}
        <button
          onClick={() => handleNav('verification')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'verification'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Verification</span>
        </button>

        {/* 4. Network */}
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

        {/* 5. Activity Log (Audit Trail) */}
        <button
          onClick={() => handleNav('activity_log')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'activity_log'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Activity Log</span>
        </button>

        {/* 6. Settings */}
        <button
          onClick={() => handleNav('settings')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
            currentTab === 'settings'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Settings</span>
        </button>

        {/* Quick Action: Create Invoice */}
        <div className="pt-2">
          <button
            onClick={() => handleNav('create')}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50/70 hover:border-indigo-400 font-bold transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Bottom Profile Section & 5-Role Perspective Switcher */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 relative">
        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center space-x-1">
              <span>Role:</span>
              <span className="text-indigo-600 font-mono">
                {(currentRoleEntity as any).roleCategory || 'Supplier'}
              </span>
            </span>
            <button
              onClick={() => setIsRolePickerOpen(!isRolePickerOpen)}
              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-indigo-50 transition-colors"
              title="Switch business role to view isolated permissions"
            >
              <ArrowRightLeft className="w-3 h-3" />
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

        {/* Role Switcher Popover */}
        {isRolePickerOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 space-y-1 text-xs">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              Select Business Role
            </div>
            {businessRoles.map(entity => (
              <button
                key={entity.id}
                onClick={() => {
                  setActiveProfile(entity);
                  setIsRolePickerOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                  entity.username === activeProfile.username
                    ? 'bg-indigo-50 font-bold text-indigo-700'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="truncate font-semibold text-xs">{entity.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">{entity.username}</div>
                </div>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 border border-slate-200">
                  {entity.roleCategory}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
