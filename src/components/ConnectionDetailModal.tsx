import React from 'react';
import { AuthorizedConnection } from '../services/networkService';
import { formatCurrency } from '../utils/finance';
import {
  X,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  Globe,
  ExternalLink,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ConnectionDetailModalProps {
  connection: AuthorizedConnection | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionDetailModal: React.FC<ConnectionDetailModalProps> = ({
  connection,
  isOpen,
  onClose,
}) => {
  const { setCurrentTab, threads } = useApp();

  if (!isOpen || !connection) return null;

  const entity = connection.business;

  const handleStartMessage = () => {
    onClose();
    setCurrentTab('messages');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              {entity.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {entity.name}
                </h3>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  {connection.category}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500 font-mono">
                <span>{entity.username}</span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-slate-600 font-semibold">{entity.id}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Status & Credential Pills */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-emerald-700 font-semibold block leading-tight">
                  Connection Status
                </span>
                <span className="font-bold text-emerald-950 text-xs">
                  Authorized Direct Partner
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] text-blue-700 font-semibold block leading-tight">
                  TrustLayer Identity
                </span>
                <span className="font-bold text-blue-950 text-xs">
                  {entity.verified ? 'Verified Entity Registry' : 'Documented Counterparty'}
                </span>
              </div>
            </div>
          </div>

          {/* Relationship Metrics */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Direct Trading Activity
            </span>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
                <span className="text-slate-400 block text-[10px]">Invoices Exchanged</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {connection.invoiceCount}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
                <span className="text-slate-400 block text-[10px]">Documented Volume</span>
                <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                  {formatCurrency(connection.totalVolume, connection.currency)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
                <span className="text-slate-400 block text-[10px]">Connected Since</span>
                <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block">
                  {connection.establishedAt}
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Registration Information */}
          <div className="space-y-2.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Business Information
            </span>

            <div className="space-y-2 divide-y divide-slate-100 text-slate-700">
              {entity.contactPerson && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Contact Person:</span>
                  <span className="font-semibold text-slate-900">{entity.contactPerson}</span>
                </div>
              )}

              {entity.email && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <a
                    href={`mailto:${entity.email}`}
                    className="font-mono text-indigo-600 hover:underline flex items-center space-x-1"
                  >
                    <Mail className="w-3.5 h-3.5 mr-1" />
                    <span>{entity.email}</span>
                  </a>
                </div>
              )}

              {entity.phone && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <span className="font-mono text-slate-800 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <span>{entity.phone}</span>
                  </span>
                </div>
              )}

              {entity.address && (
                <div className="flex items-start justify-between py-1.5">
                  <span className="text-slate-500 font-medium shrink-0 mr-4">Address:</span>
                  <span className="text-right text-slate-800 flex items-start space-x-1">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0 mt-0.5" />
                    <span>{entity.address}, {entity.country}</span>
                  </span>
                </div>
              )}

              {entity.taxId && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Tax ID / EIN:</span>
                  <span className="font-mono font-semibold text-slate-800">{entity.taxId}</span>
                </div>
              )}

              {entity.website && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Website:</span>
                  <a
                    href={entity.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-indigo-600 hover:underline flex items-center space-x-1"
                  >
                    <Globe className="w-3.5 h-3.5 mr-1" />
                    <span>{entity.website.replace('https://', '')}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start space-x-2 text-[11px] text-slate-500 leading-relaxed">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              This is a verified direct commercial trading partner. Under TrustLayer privacy protocols, downstream connections of this partner remain strictly confidential.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleStartMessage}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Message Partner</span>
          </button>
        </div>
      </div>
    </div>
  );
};
