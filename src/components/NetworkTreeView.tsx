import React, { useState } from 'react';
import { NetworkNode, NetworkEdge } from '../utils/network';
import { formatCurrency } from '../utils/finance';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
  Truck,
  Package,
  Eye,
  Lock,
} from 'lucide-react';

interface NetworkTreeViewProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNodeId: string | null;
  onSelectNode: (node: NetworkNode) => void;
  searchQuery: string;
  zoom: number;
}

export const NetworkTreeView: React.FC<NetworkTreeViewProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  searchQuery,
  zoom,
}) => {
  // Collapsed state map for expandable branches
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Find focal root node (Tier 0)
  const focalNode = nodes.find(n => n.tier === 0) || nodes[0];
  if (!focalNode) return null;

  // Tier 1 direct connections
  const tier1Nodes = nodes.filter(n => n.tier === 1);

  // Helper to find children of a node
  const getChildren = (parentId: string): NetworkNode[] => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent || !parent.childrenIds) return [];
    return nodes.filter(n => parent.childrenIds?.includes(n.id));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Brand / Manufacturer':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Distributor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Logistics Carrier':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Component Supplier':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Wholesaler':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isMatchedBySearch = (node: NetworkNode) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      node.name.toLowerCase().includes(q) ||
      node.username.toLowerCase().includes(q) ||
      node.trustlayerId.toLowerCase().includes(q) ||
      node.businessType.toLowerCase().includes(q)
    );
  };

  const renderNodeCard = (node: NetworkNode, levelLabel: string) => {
    const isSelected = selectedNodeId === node.id;
    const isMatched = isMatchedBySearch(node);
    const children = getChildren(node.id);
    const hasChildren = children.length > 0;
    const isCollapsed = Boolean(collapsedNodes[node.id]);

    // Primary currency volume
    const currencies = Object.keys(node.stats.salesByCurrency);
    const mainCurr = currencies[0] || 'USD';
    const totalVolume = (node.stats.salesByCurrency[mainCurr] || 0) + (node.stats.purchasesByCurrency[mainCurr] || 0);

    return (
      <div
        key={node.id}
        onClick={() => onSelectNode(node)}
        className={`w-72 p-3.5 rounded-xl border bg-white shadow-xs transition-all cursor-pointer relative group ${
          isSelected
            ? 'ring-2 ring-indigo-600 border-indigo-600 shadow-md'
            : isMatched
            ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
            : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-sm'
        }`}
      >
        {/* Top bar with Tier label & Expand button */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              {levelLabel}
            </span>
            {!node.isAuthorized && (
              <span className="inline-flex items-center text-[10px] text-amber-700 bg-amber-50 px-1 rounded border border-amber-200" title="Least-privilege: Masked confidential upstream details">
                <Lock className="w-2.5 h-2.5 mr-0.5" />
                Tier-2 Partner
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {node.verified ? (
              <span className="inline-flex items-center text-[10px] text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-500" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] text-slate-400">
                Unverified
              </span>
            )}

            {hasChildren && (
              <button
                onClick={e => toggleCollapse(node.id, e)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Node Main Info */}
        <div className="flex items-start space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {node.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs text-slate-900 truncate tracking-tight">
              {node.name}
            </h4>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-[11px] font-mono text-slate-500 truncate">
                {node.username}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-[10px] font-mono text-slate-400">
                {node.trustlayerId}
              </span>
            </div>
          </div>
        </div>

        {/* Business Type Badge */}
        <div className="mt-2.5 flex items-center justify-between">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getRoleBadgeColor(
              node.businessType
            )}`}
          >
            {node.businessType}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">{node.country}</span>
        </div>

        {/* Documented Transactions Summary */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">Invoices</span>
            <span className="font-mono font-bold text-slate-800">
              {node.stats.invoiceCount} {node.stats.invoiceCount === 1 ? 'record' : 'records'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Documented Volume</span>
            <span className="font-mono font-bold text-slate-900">
              {formatCurrency(totalVolume, mainCurr)}
            </span>
          </div>
        </div>

        {/* Attention badge if overdue */}
        {node.stats.overdueCount > 0 && (
          <div className="mt-2 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[10px] font-semibold flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>{node.stats.overdueCount} Overdue Invoices</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="p-8 min-w-[900px] overflow-auto select-none transition-transform origin-top-left"
      style={{ transform: `scale(${zoom})` }}
    >
      <div className="flex items-start space-x-14">
        {/* TIER 0: Focal / Brand */}
        <div className="flex flex-col items-center">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/80">
            Tier 0 &bull; Focal Organization
          </div>
          {renderNodeCard(focalNode, 'Focal Entity')}
        </div>

        {/* TIER 1 & TIER 2: Direct Counterparties & Extended Network */}
        <div className="flex-1 space-y-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-0.5 rounded-full border border-slate-200 inline-block mb-1">
            Tier 1 &bull; Documented Direct Counterparties ({tier1Nodes.length})
          </div>

          <div className="space-y-6">
            {tier1Nodes.map(t1 => {
              const t2Children = getChildren(t1.id);
              const isCollapsed = Boolean(collapsedNodes[t1.id]);

              return (
                <div key={t1.id} className="flex items-start space-x-10">
                  {/* Tier 1 Node */}
                  <div className="relative">
                    {/* SVG Connecting curve to children */}
                    {renderNodeCard(t1, 'Tier 1 Partner')}
                  </div>

                  {/* Tier 2 Sub-network */}
                  {!isCollapsed && t2Children.length > 0 && (
                    <div className="space-y-4 pt-2 border-l-2 border-dashed border-indigo-200 pl-6">
                      <div className="text-[10px] font-semibold uppercase text-slate-400">
                        Tier 2 &bull; Secondary Network ({t2Children.length})
                      </div>
                      {t2Children.map(t2 => renderNodeCard(t2, 'Tier 2 Secondary'))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
