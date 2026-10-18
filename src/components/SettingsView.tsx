import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  FileText,
  Palette,
  Bell,
  Shield,
  Layers,
  Save,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { activeProfile, setActiveProfile, resetDemoData } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'defaults' | 'brand' | 'integrations'>('profile');
  const [formData, setFormData] = useState(activeProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your registered business profile, invoice defaults, and security preferences.
          </p>
        </div>

        <button
          onClick={resetDemoData}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
          title="Reset demonstration records"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-slate-100 rounded-lg text-xs">
        {[
          { id: 'profile', label: 'Business Profile', icon: Building2 },
          { id: 'defaults', label: 'Invoice Defaults', icon: FileText },
          { id: 'brand', label: 'Brand & Appearance', icon: Palette },
          { id: 'integrations', label: 'Marketplace Integrations', icon: Layers },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Registered Entity Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legal Business Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">TrustLayer Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Officer</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Physical / Registered Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tax Identification / EIN</label>
                <input
                  type="text"
                  value={formData.taxId || ''}
                  onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === 'defaults' && (
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Default Invoicing Parameters
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Currency</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <option>USD ($) — US Dollar</option>
                  <option>EUR (€) — Euro</option>
                  <option>GBP (£) — British Pound</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Payment Terms</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <option>Net 14 (Standard)</option>
                  <option>Net 30</option>
                  <option>Due on Receipt</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Number Prefix</label>
                <input
                  type="text"
                  defaultValue="INV-2026-"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Template Style</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <option>Professional (Navy)</option>
                  <option>Modern (Indigo)</option>
                  <option>Minimal (Slate)</option>
                  <option>Corporate</option>
                  <option>Classic</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 2000);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
              >
                Save Defaults
              </button>
            </div>
          </div>
        )}

        {activeTab === 'brand' && (
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Brand Accent & Styling
            </h2>

            <p className="text-slate-500">
              Customize the corporate palette applied to rendered invoices, PDFs, and verification seals.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div>
                <div className="font-bold text-slate-800">Apex Supply Co.</div>
                <div className="text-slate-400 text-[11px]">Primary Brand Color: #4F46E5</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-4 text-xs">
            <div className="pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Marketplace & ERP Integrations</h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Authorized automated record verification hooks.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: 'Amazon Seller Central',
                  desc: 'Direct supplier verification hook for Amazon brand registry compliance.',
                  status: 'Roadmap (Inactive in Prototype)',
                },
                {
                  name: 'eBay Commerce',
                  desc: 'Automated wholesale authenticity record clearance for enterprise sellers.',
                  status: 'Roadmap (Inactive in Prototype)',
                },
                {
                  name: 'QuickBooks Online / Xero',
                  desc: 'Bidirectional sync for ledger reconciliation.',
                  status: 'Roadmap (Inactive in Prototype)',
                },
              ].map((integ, i) => (
                <div
                  key={i}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-slate-900">{integ.name}</h3>
                    <p className="text-slate-500 text-[11px] mt-0.5">{integ.desc}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                    {integ.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
