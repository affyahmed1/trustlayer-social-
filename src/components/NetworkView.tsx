import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { buildNetworkGraph, NetworkNode, NetworkEdge } from '../utils/network';
import { NetworkTreeView } from './NetworkTreeView';
import { NetworkGraphView } from './NetworkGraphView';
import { NetworkDetailsPanel } from './NetworkDetailsPanel';
import { Invoice, BusinessEntity } from '../types';
import {
  Network,
  GitFork,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  SlidersHorizontal,
  Layers,
  ShieldCheck,
  AlertCircle,
  Eye,
  CheckCircle2,
  Building,
} from 'lucide-react';

export const NetworkView: React.FC = () => {
  const { invoices, activeProfile, setSelectedInvoice, activities, counterparties } = useApp();

  // View mode: 'tree' | 'graph'
  const [viewMode, setViewMode] = useState<'tree' | 'graph'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [showVolumeOnLinks, setShowVolumeOnLinks] = useState(true);
  const [includeTier2Demo, setIncludeTier2Demo] = useState(true);

  // Selected item state for the details panel
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<NetworkEdge | null>(null);

  // Custom focal entity (defaults to activeProfile, but user can pivot)
  const [focalOverrideId, setFocalOverrideId] = useState<string>(activeProfile.username);

  // Determine current focal profile object
  const currentFocalProfile: BusinessEntity = useMemo(() => {
    if (focalOverrideId === activeProfile.username) return activeProfile;
    const foundCounterparty = counterparties.find(c => c.username === focalOverrideId);
    return foundCounterparty || activeProfile;
  }, [focalOverrideId, activeProfile, counterparties]);

  // Build the normalized network graph from current invoices & selected focal profile
  const networkData = useMemo(() => {
    return buildNetworkGraph(invoices, currentFocalProfile, includeTier2Demo);
  }, [invoices, currentFocalProfile, includeTier2Demo]);

  // Keep selected node updated if data changes
  const activeSelectedNode = useMemo(() => {
    if (!selectedNode) return null;
    return networkData.nodes.find(n => n.id === selectedNode.id) || selectedNode;
  }, [networkData, selectedNode]);

  const handleSelectNode = (node: NetworkNode) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };

  const handleSelectEdge = (edge: NetworkEdge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => setZoom(1);
  const handleFitScreen = () => setZoom(0.85);

  const handleSelectNodeById = (nodeId: string) => {
    const found = networkData.nodes.find(n => n.id === nodeId);
    if (found) {
      setSelectedNode(found);
      setSelectedEdge(null);
    }
  };

  const handleOpenInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
  };

  const isEmpty = networkData.nodes.length <= 1 && networkData.edges.length === 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto flex flex-col h-[calc(100vh-120px)] min-h-[700px]">
      {/* Top Header & Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 shrink-0">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Network className="w-5 h-5 text-indigo-600" />
              <span>TrustLayer Network</span>
            </h1>
            <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
              {networkData.nodes.length} Businesses &bull; {networkData.edges.length} Connections
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive supply-chain topology and verified commercial transaction flows.
          </p>
        </div>

        {/* View Switcher and Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Focal Entity Perspective Pivot */}
          <div className="flex items-center space-x-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-slate-400 font-medium">Root:</span>
            <select
              value={focalOverrideId}
              onChange={e => setFocalOverrideId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value={activeProfile.username}>{activeProfile.name} (Active Profile)</option>
              {counterparties.map(c => (
                <option key={c.username} value={c.username}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tree View / Graph View Toggle */}
          <div className="flex space-x-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'tree'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Tree View</span>
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'graph'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Graph View</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-44 sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search business or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center space-x-0.5 border border-slate-200 rounded-lg bg-white p-0.5 text-xs">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded font-mono text-[10px]"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFitScreen}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
              title="Fit to Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Bar: Filter options & Demo toggle */}
      <div className="px-4 py-2 bg-white rounded-lg border border-slate-200/70 shadow-xs flex flex-wrap items-center justify-between text-xs text-slate-600 shrink-0">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showVolumeOnLinks}
              onChange={e => setShowVolumeOnLinks(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Show Volume on Connections</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTier2Demo}
              onChange={e => setIncludeTier2Demo(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Include Tier-2 Partner Demo</span>
          </label>
        </div>

        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Established strictly from registered commercial invoice records.</span>
        </div>
      </div>

      {/* Main Canvas Viewport with Right Details Panel */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200/80 shadow-xs flex overflow-hidden relative min-h-0">
        {isEmpty ? (
          /* Empty State when no relationships established */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Network className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <h3 className="font-bold text-slate-900 text-sm">No Commercial Relationships Found</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                TrustLayer builds network topology directly from registered and verified commercial invoices.
                Create and exchange invoices with counterparties to establish documented commercial connections.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto relative">
            {viewMode === 'tree' ? (
              <NetworkTreeView
                nodes={networkData.nodes}
                edges={networkData.edges}
                selectedNodeId={activeSelectedNode?.id || null}
                onSelectNode={handleSelectNode}
                searchQuery={searchQuery}
                zoom={zoom}
              />
            ) : (
              <NetworkGraphView
                nodes={networkData.nodes}
                edges={networkData.edges}
                selectedNodeId={activeSelectedNode?.id || null}
                selectedEdgeId={selectedEdge?.id || null}
                onSelectNode={handleSelectNode}
                onSelectEdge={handleSelectEdge}
                searchQuery={searchQuery}
                zoom={zoom}
                showVolumeOnLinks={showVolumeOnLinks}
              />
            )}
          </div>
        )}

        {/* Right Details Panel */}
        <NetworkDetailsPanel
          selectedNode={activeSelectedNode}
          selectedEdge={selectedEdge}
          inventoryFlows={networkData.inventoryFlows}
          invoices={invoices}
          activities={activities}
          onClose={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
          onOpenInvoice={handleOpenInvoice}
          onSelectNodeById={handleSelectNodeById}
        />
      </div>
    </div>
  );
};
