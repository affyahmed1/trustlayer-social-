import React, { useState, useRef, useEffect } from 'react';
import { NetworkNode, NetworkEdge } from '../utils/network';
import { formatCurrency } from '../utils/finance';
import {
  Building2,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Move,
  Maximize2,
} from 'lucide-react';

interface NetworkGraphViewProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onSelectNode: (node: NetworkNode) => void;
  onSelectEdge: (edge: NetworkEdge) => void;
  searchQuery: string;
  zoom: number;
  showVolumeOnLinks: boolean;
  onResetView?: () => void;
}

interface NodePosition {
  x: number;
  y: number;
}

export const NetworkGraphView: React.FC<NetworkGraphViewProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  searchQuery,
  zoom,
  showVolumeOnLinks,
}) => {
  // Draggable node positions initialized in a circular / tiered layout
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 0,
    initialY: 0,
  });

  // Canvas background panning state
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ mouseX: number; mouseY: number; initialPanX: number; initialPanY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  const svgRef = useRef<SVGSVGElement>(null);

  // Initialize node layout coordinates: Focal in center (450, 270), Tier 1 in inner circle, Tier 2 in outer perimeter
  useEffect(() => {
    const newPos: Record<string, NodePosition> = {};
    const centerX = 450;
    const centerY = 270;

    const focal = nodes.find(n => n.tier === 0) || nodes[0];
    if (focal) {
      newPos[focal.id] = { x: centerX, y: centerY };
    }

    const tier1Nodes = nodes.filter(n => n.tier === 1);
    tier1Nodes.forEach((node, i) => {
      const angle = (i / Math.max(1, tier1Nodes.length)) * 2 * Math.PI - Math.PI / 2;
      const radius = 230;
      newPos[node.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    const tier2Nodes = nodes.filter(n => n.tier === 2);
    tier2Nodes.forEach((node, i) => {
      const angle = (i / Math.max(1, tier2Nodes.length)) * 2 * Math.PI + Math.PI / 4;
      const radius = 390;
      newPos[node.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    setPositions(newPos);
  }, [nodes]);

  // Dragging logic for nodes
  const handleMouseDownNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentPos = positions[nodeId] || { x: 450, y: 270 };
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: currentPos.x,
      initialY: currentPos.y,
    };
    setDraggingNodeId(nodeId);
  };

  // Canvas background panning mousedown
  const handleMouseDownBackground = (e: React.MouseEvent) => {
    // Only pan if not on an interactive element
    if (e.button !== 0) return;
    panStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialPanX: panOffset.x,
      initialPanY: panOffset.y,
    };
    setIsPanning(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. If dragging a node
    if (draggingNodeId) {
      const deltaX = (e.clientX - dragStartRef.current.mouseX) / zoom;
      const deltaY = (e.clientY - dragStartRef.current.mouseY) / zoom;

      setPositions(prev => ({
        ...prev,
        [draggingNodeId]: {
          x: Math.round(dragStartRef.current.initialX + deltaX),
          y: Math.round(dragStartRef.current.initialY + deltaY),
        },
      }));
      return;
    }

    // 2. If panning canvas
    if (isPanning) {
      const deltaX = e.clientX - panStartRef.current.mouseX;
      const deltaY = e.clientY - panStartRef.current.mouseY;
      setPanOffset({
        x: Math.round(panStartRef.current.initialPanX + deltaX),
        y: Math.round(panStartRef.current.initialPanY + deltaY),
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const isMatchedBySearch = (node: NetworkNode) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      node.name.toLowerCase().includes(q) ||
      node.username.toLowerCase().includes(q) ||
      node.trustlayerId.toLowerCase().includes(q)
    );
  };

  const getNodeColor = (node: NetworkNode) => {
    if (node.tier === 0) return '#4F46E5'; // Indigo
    if (node.businessType === 'Distributor') return '#2563EB'; // Blue
    if (node.businessType === 'Logistics Carrier') return '#D97706'; // Amber
    if (node.businessType === 'Component Supplier') return '#7C3AED'; // Purple
    if (node.businessType === 'Wholesaler') return '#0D9488'; // Teal
    return '#475569'; // Slate
  };

  return (
    <div
      className={`relative w-full h-[640px] bg-slate-50/60 overflow-hidden select-none ${
        isPanning ? 'cursor-grabbing' : draggingNodeId ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onMouseDown={handleMouseDownBackground}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Grid Pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <defs>
          <pattern id="network-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#CBD5E1" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#network-grid)" />
      </svg>

      {/* Main Interactive SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full transition-transform origin-center"
        style={{ transform: `scale(${zoom})` }}
        viewBox="0 0 920 600"
      >
        <defs>
          {/* Arrow markers for edges */}
          <marker
            id="arrow-default"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#94A3B8" />
          </marker>
          <marker
            id="arrow-selected"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#4F46E5" />
          </marker>
        </defs>

        {/* Group with pan offset */}
        <g transform={`translate(${panOffset.x}, ${panOffset.y})`}>
          {/* 1. EDGES / CONNECTIONS */}
          <g className="edges-group">
            {edges.map(edge => {
              const srcPos = positions[edge.source] || { x: 300, y: 300 };
              const tgtPos = positions[edge.target] || { x: 500, y: 300 };

              const isSelected = selectedEdgeId === edge.id;
              const midX = (srcPos.x + tgtPos.x) / 2;
              const midY = (srcPos.y + tgtPos.y) / 2;

              // Curvature control point
              const dx = tgtPos.x - srcPos.x;
              const dy = tgtPos.y - srcPos.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const curveOffset = Math.min(30, dist * 0.1);
              const ctrlX = midX - (dy / (dist || 1)) * curveOffset;
              const ctrlY = midY + (dx / (dist || 1)) * curveOffset;

              const pathD = `M ${srcPos.x} ${srcPos.y} Q ${ctrlX} ${ctrlY} ${tgtPos.x} ${tgtPos.y}`;

              const currencies = Object.keys(edge.totalsByCurrency);
              const mainCurr = currencies[0] || 'USD';
              const totalVal = edge.totalsByCurrency[mainCurr] || 0;

              return (
                <g
                  key={edge.id}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectEdge(edge);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Hit area */}
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth="24" className="cursor-pointer" />

                  {/* Edge line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isSelected ? '#4F46E5' : edge.isDemo ? '#94A3B8' : '#64748B'}
                    strokeWidth={isSelected ? '3.5' : '2'}
                    strokeDasharray={edge.isDemo ? '5 4' : undefined}
                    markerEnd={isSelected ? 'url(#arrow-selected)' : 'url(#arrow-default)'}
                    className="transition-colors group-hover:stroke-indigo-500 cursor-pointer"
                  />

                  {/* Edge Badge on center */}
                  <g transform={`translate(${ctrlX}, ${ctrlY})`} className="cursor-pointer">
                    <rect
                      x="-42"
                      y="-11"
                      width="84"
                      height="22"
                      rx="11"
                      fill={isSelected ? '#4F46E5' : '#FFFFFF'}
                      stroke={isSelected ? '#4F46E5' : '#CBD5E1'}
                      strokeWidth="1.2"
                      className="shadow-xs group-hover:stroke-indigo-400 cursor-pointer"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={isSelected ? '#FFFFFF' : '#1E293B'}
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="monospace"
                      className="pointer-events-none select-none"
                    >
                      {showVolumeOnLinks && totalVal > 0
                        ? formatCurrency(totalVal, mainCurr)
                        : `${edge.invoiceCount} inv`}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* 2. NODES / BUSINESSES */}
          <g className="nodes-group">
            {nodes.map(node => {
              const pos = positions[node.id] || { x: 450, y: 270 };
              const isSelected = selectedNodeId === node.id;
              const isMatched = isMatchedBySearch(node);
              const nodeColor = getNodeColor(node);
              const isFocal = node.tier === 0;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseDown={e => handleMouseDownNode(node.id, e)}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectNode(node);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Node selection halo */}
                  {isSelected && (
                    <circle
                      r={isFocal ? '38' : '30'}
                      fill="none"
                      stroke="#4F46E5"
                      strokeWidth="3.5"
                      strokeOpacity="0.8"
                      className="animate-pulse"
                    />
                  )}

                  {/* Search highlight */}
                  {isMatched && !isSelected && (
                    <circle
                      r={isFocal ? '38' : '30'}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3"
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={isFocal ? '32' : '24'}
                    fill="#FFFFFF"
                    stroke={nodeColor}
                    strokeWidth={isFocal ? '3.5' : '2.5'}
                    className="shadow-sm group-hover:scale-105 transition-transform"
                  />

                  {/* Icon or Monogram */}
                  <circle r={isFocal ? '24' : '18'} fill={nodeColor} />
                  <text
                    x="0"
                    y={isFocal ? '5' : '4'}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize={isFocal ? '14' : '11'}
                    fontWeight="800"
                    fontFamily="sans-serif"
                  >
                    {node.name.charAt(0)}
                  </text>

                  {/* Tier Badge */}
                  <rect
                    x="-20"
                    y={isFocal ? '25' : '18'}
                    width="40"
                    height="14"
                    rx="7"
                    fill="#0F172A"
                  />
                  <text
                    x="0"
                    y={isFocal ? '35' : '28'}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="8"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {isFocal ? 'TIER 0' : `T${node.tier}`}
                  </text>

                  {/* Node Label Card underneath */}
                  <g transform={`translate(0, ${isFocal ? 48 : 40})`}>
                    <rect
                      x="-75"
                      y="0"
                      width="150"
                      height="36"
                      rx="8"
                      fill="#FFFFFF"
                      stroke={isSelected ? '#4F46E5' : '#E2E8F0'}
                      strokeWidth={isSelected ? '1.5' : '1'}
                      className="shadow-xs"
                    />
                    <text
                      x="0"
                      y="14"
                      textAnchor="middle"
                      fill="#0F172A"
                      fontSize="10"
                      fontWeight="700"
                    >
                      {node.name.length > 20 ? `${node.name.slice(0, 18)}…` : node.name}
                    </text>
                    <text
                      x="0"
                      y="27"
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {node.username}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Floating Canvas Helper Instruction & Legend */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs text-[10px] text-slate-500 flex items-center space-x-1.5 pointer-events-none">
        <Move className="w-3 h-3 text-slate-400" />
        <span>Drag canvas to pan &bull; Drag nodes to rearrange &bull; Click node or edge for details</span>
      </div>

      {/* Floating Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200/90 shadow-sm text-[11px] space-y-1.5 z-10 max-w-xs">
        <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider">
          Network Topology Legend
        </span>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
            <span>Brand / Focal (T0)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <span>Distributor (T1)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
            <span>Logistics Carrier</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
            <span>Component Supplier</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-0.5 bg-slate-700 shrink-0" />
            <span>Direct Invoices</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-0.5 border-b border-dashed border-slate-400 shrink-0" />
            <span>Tier-2 Demo Partner</span>
          </div>
        </div>
      </div>
    </div>
  );
};
