import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { InvoiceBuilder } from './components/InvoiceBuilder';
import { MessagingView } from './components/MessagingView';
import { VerificationView } from './components/VerificationView';
import { SettingsView } from './components/SettingsView';
import { NetworkView } from './components/NetworkView';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { PaymentEvidenceModal } from './components/PaymentEvidenceModal';
import { RejectInvoiceModal } from './components/RejectInvoiceModal';
import { Invoice } from './types';

const MainLayout: React.FC = () => {
  const {
    currentTab,
    selectedInvoice,
    setSelectedInvoice,
    submitPaymentEvidence,
    rejectReceivedInvoice,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Modals for payment evidence and rejection
  const [evidenceInvoice, setEvidenceInvoice] = useState<Invoice | null>(null);
  const [rejectInvoice, setRejectInvoice] = useState<Invoice | null>(null);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar: hidden on mobile unless mobileMenuOpen is true */}
      <div className={`fixed inset-0 z-40 lg:static lg:z-auto ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <div className="relative z-50 h-full flex">
          <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'home' && <HomeDashboard />}
          {currentTab === 'create' && <InvoiceBuilder />}
          {currentTab === 'network' && <NetworkView />}
          {currentTab === 'messages' && <MessagingView />}
          {currentTab === 'verification' && <VerificationView />}
          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Detail Inspection Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        onOpenPaymentEvidenceModal={inv => {
          setSelectedInvoice(null);
          setEvidenceInvoice(inv);
        }}
      />

      {/* Payment Evidence Submission Modal */}
      {evidenceInvoice && (
        <PaymentEvidenceModal
          invoice={evidenceInvoice}
          isOpen={Boolean(evidenceInvoice)}
          onClose={() => setEvidenceInvoice(null)}
          onSubmit={evidenceData => {
            submitPaymentEvidence(evidenceData);
          }}
        />
      )}

      {/* Rejection Modal */}
      {rejectInvoice && (
        <RejectInvoiceModal
          invoice={rejectInvoice}
          isOpen={Boolean(rejectInvoice)}
          onClose={() => setRejectInvoice(null)}
          onConfirmReject={(invId, reason) => {
            rejectReceivedInvoice(invId, reason);
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
