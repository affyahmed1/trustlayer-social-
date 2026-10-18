import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Invoice,
  MessageThread,
  ActivityEvent,
  BusinessEntity,
  InvoiceStatus,
  PaymentEvidence,
} from '../types';
import {
  CURRENT_BUSINESS,
  COUNTERPARTIES,
  INITIAL_INVOICES,
  INITIAL_THREADS,
  INITIAL_ACTIVITY,
} from '../data/mockData';
import {
  generateTrustLayerReference,
  createCanonicalInvoicePayload,
  computeSha256FingerprintSync,
  verifyInvoiceRecord,
  VerificationResult,
} from '../utils/reference';

export type NavigationTab =
  | 'home'
  | 'create'
  | 'issued'
  | 'received'
  | 'network'
  | 'messages'
  | 'activity'
  | 'verification'
  | 'settings';

interface AppContextType {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  issuedFilter: 'all' | 'paid' | 'unpaid' | 'due_today' | 'overdue';
  setIssuedFilter: (filter: 'all' | 'paid' | 'unpaid' | 'due_today' | 'overdue') => void;
  receivedFilter: 'all' | 'pending_review' | 'accepted' | 'rejected' | 'paid';
  setReceivedFilter: (filter: 'all' | 'pending_review' | 'accepted' | 'rejected' | 'paid') => void;

  invoices: Invoice[];
  threads: MessageThread[];
  activities: ActivityEvent[];
  activeProfile: BusinessEntity;
  setActiveProfile: (profile: BusinessEntity) => void;
  counterparties: BusinessEntity[];

  // Selected invoice for detail preview/modal
  selectedInvoice: Invoice | null;
  setSelectedInvoice: (invoice: Invoice | null) => void;

  // Invoice draft for editing in builder
  editingInvoice: Invoice | null;
  setEditingInvoice: (invoice: Invoice | null) => void;

  // Actions
  saveInvoiceDraft: (invoice: Invoice) => void;
  registerInvoice: (invoice: Invoice) => Invoice;
  sendInvoice: (invoiceId: string, recipientUsername?: string) => void;
  correctInvoice: (originalInvoice: Invoice, corrections: Partial<Invoice>) => Invoice;
  acceptReceivedInvoice: (invoiceId: string) => void;
  rejectReceivedInvoice: (invoiceId: string, reason: string) => void;
  submitPaymentEvidence: (evidence: Omit<PaymentEvidence, 'id' | 'submittedAt' | 'status'>) => void;
  reviewPaymentEvidence: (evidenceId: string, decision: 'confirmed' | 'rejected', notes?: string) => void;
  verifyReference: (reference: string, inspectData?: any) => VerificationResult;
  sendMessage: (threadId: string, text: string) => void;
  shareInvoiceInThread: (threadId: string, invoice: Invoice) => void;

  // Search
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Quick stats
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [issuedFilter, setIssuedFilter] = useState<'all' | 'paid' | 'unpaid' | 'due_today' | 'overdue'>('all');
  const [receivedFilter, setReceivedFilter] = useState<'all' | 'pending_review' | 'accepted' | 'rejected' | 'paid'>('all');

  const [activeProfile, setActiveProfile] = useState<BusinessEntity>(() => {
    try {
      const saved = localStorage.getItem('trustlayer_profile');
      return saved ? JSON.parse(saved) : CURRENT_BUSINESS;
    } catch {
      return CURRENT_BUSINESS;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('trustlayer_invoices');
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [threads, setThreads] = useState<MessageThread[]>(() => {
    try {
      const saved = localStorage.getItem('trustlayer_threads');
      return saved ? JSON.parse(saved) : INITIAL_THREADS;
    } catch {
      return INITIAL_THREADS;
    }
  });

  const [activities, setActivities] = useState<ActivityEvent[]>(() => {
    try {
      const saved = localStorage.getItem('trustlayer_activities');
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITY;
    } catch {
      return INITIAL_ACTIVITY;
    }
  });

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('trustlayer_invoices', JSON.stringify(invoices));
    } catch {
      // ignore
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem('trustlayer_threads', JSON.stringify(threads));
    } catch {
      // ignore
    }
  }, [threads]);

  useEffect(() => {
    try {
      localStorage.setItem('trustlayer_activities', JSON.stringify(activities));
    } catch {
      // ignore
    }
  }, [activities]);

  useEffect(() => {
    try {
      localStorage.setItem('trustlayer_profile', JSON.stringify(activeProfile));
    } catch {
      // ignore
    }
  }, [activeProfile]);

  const addActivity = (
    type: ActivityEvent['type'],
    details: string,
    inv?: { id?: string; reference?: string; invoiceNumber?: string }
  ) => {
    const newAct: ActivityEvent = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      invoiceId: inv?.id,
      invoiceRef: inv?.reference,
      invoiceNumber: inv?.invoiceNumber,
      actor: `${activeProfile.contactPerson} (${activeProfile.username})`,
      timestamp: new Date().toISOString(),
      details,
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const saveInvoiceDraft = (invoice: Invoice) => {
    const existingIndex = invoices.findIndex(i => i.id === invoice.id);
    const draft: Invoice = {
      ...invoice,
      status: 'draft',
      verificationStatus: 'unregistered',
    };

    if (existingIndex >= 0) {
      setInvoices(prev => {
        const next = [...prev];
        next[existingIndex] = draft;
        return next;
      });
    } else {
      setInvoices(prev => [draft, ...prev]);
    }
    addActivity('draft_created', `Invoice draft ${draft.invoiceNumber} saved.`, draft);
  };

  const registerInvoice = (invoice: Invoice): Invoice => {
    // Generate systematic TrustLayer reference
    const reference = invoice.reference || generateTrustLayerReference(new Date().getFullYear());
    const registeredAt = new Date().toISOString();

    const canonical = createCanonicalInvoicePayload({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      total: invoice.financials.total,
      issuerId: invoice.issuer.id,
      issuerName: invoice.issuer.name,
      buyerName: invoice.buyer.name,
      itemsCount: invoice.items.length,
    });
    const fingerprint = computeSha256FingerprintSync(canonical);

    // Initial status: if due date passed -> overdue, if today -> due_today, else registered
    const today = new Date().toISOString().split('T')[0];
    let status: InvoiceStatus = 'registered';
    if (invoice.dueDate < today) {
      status = 'overdue';
    } else if (invoice.dueDate === today) {
      status = 'due_today';
    }

    const registeredInvoice: Invoice = {
      ...invoice,
      reference,
      registeredAt,
      fingerprint,
      status,
      verificationStatus: 'verified',
    };

    setInvoices(prev => {
      const idx = prev.findIndex(i => i.id === invoice.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = registeredInvoice;
        return copy;
      }
      return [registeredInvoice, ...prev];
    });

    addActivity(
      'registered',
      `Registered with reference ${reference}. Canonical SHA-256 fingerprint allocated.`,
      registeredInvoice
    );

    return registeredInvoice;
  };

  const sendInvoice = (invoiceId: string, recipientUsername?: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    // Must be registered before sending
    let target = inv;
    if (!inv.reference) {
      target = registerInvoice(inv);
    }

    setInvoices(prev =>
      prev.map(i => (i.id === invoiceId ? { ...target, status: 'sent' } : i))
    );

    addActivity('sent', `Invoice ${target.invoiceNumber} (${target.reference}) sent to ${target.buyer.name}.`, target);

    // Also share into message thread if one exists or create thread
    const targetUsername = recipientUsername || target.buyer.username;
    if (targetUsername) {
      const thread = threads.find(t => t.participant.username === targetUsername);
      if (thread) {
        shareInvoiceInThread(thread.id, target);
      }
    }
  };

  const correctInvoice = (originalInvoice: Invoice, corrections: Partial<Invoice>): Invoice => {
    // Preserve original record as cancelled / corrected
    const newRef = generateTrustLayerReference(new Date().getFullYear());
    const amendedNumber = `${originalInvoice.invoiceNumber}-REV`;

    const newInvoice: Invoice = {
      ...originalInvoice,
      ...corrections,
      id: `inv-${Date.now()}`,
      reference: newRef,
      invoiceNumber: amendedNumber,
      status: 'registered',
      verificationStatus: 'verified',
      originalInvoiceReference: originalInvoice.reference,
      registeredAt: new Date().toISOString(),
    };

    // Calculate new fingerprint
    const canonical = createCanonicalInvoicePayload({
      invoiceNumber: newInvoice.invoiceNumber,
      issueDate: newInvoice.issueDate,
      dueDate: newInvoice.dueDate,
      currency: newInvoice.currency,
      total: newInvoice.financials.total,
      issuerId: newInvoice.issuer.id,
      issuerName: newInvoice.issuer.name,
      buyerName: newInvoice.buyer.name,
      itemsCount: newInvoice.items.length,
    });
    newInvoice.fingerprint = computeSha256FingerprintSync(canonical);

    setInvoices(prev => {
      return prev.map(inv => {
        if (inv.id === originalInvoice.id) {
          const cancelledInv: Invoice = {
            ...inv,
            status: 'cancelled',
            correctedInvoiceReference: newRef,
          };
          return cancelledInv;
        }
        return inv;
      }).concat(newInvoice);
    });

    addActivity(
      'corrected',
      `Original invoice ${originalInvoice.reference} amended. Successor record ${newRef} generated.`,
      newInvoice
    );

    return newInvoice;
  };

  const acceptReceivedInvoice = (invoiceId: string) => {
    setInvoices(prev =>
      prev.map(i => (i.id === invoiceId ? { ...i, status: 'accepted' } : i))
    );
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      addActivity('accepted', `Invoice ${inv.invoiceNumber} accepted for payment workflow.`, inv);
    }
  };

  const rejectReceivedInvoice = (invoiceId: string, reason: string) => {
    setInvoices(prev =>
      prev.map(i =>
        i.id === invoiceId ? { ...i, status: 'rejected', rejectionReason: reason } : i
      )
    );
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      addActivity('rejected', `Invoice ${inv.invoiceNumber} rejected. Reason: ${reason || 'Unspecified'}`, inv);
    }
  };

  const submitPaymentEvidence = (
    evidenceData: Omit<PaymentEvidence, 'id' | 'submittedAt' | 'status'>
  ) => {
    const evidence: PaymentEvidence = {
      ...evidenceData,
      id: `pe-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'pending_review',
    };

    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === evidence.invoiceId) {
          const currentEv = inv.paymentEvidence || [];
          return {
            ...inv,
            status: 'pending_review',
            paymentEvidence: [evidence, ...currentEv],
          };
        }
        return inv;
      })
    );

    addActivity(
      'payment_evidence_submitted',
      `Payment claim submitted: ${evidence.paymentMethod} ($${evidence.amount.toFixed(2)}). Awaiting issuer confirmation.`,
      { id: evidence.invoiceId, reference: evidence.invoiceRef }
    );
  };

  const reviewPaymentEvidence = (
    evidenceId: string,
    decision: 'confirmed' | 'rejected',
    notes?: string
  ) => {
    setInvoices(prev =>
      prev.map(inv => {
        if (!inv.paymentEvidence?.some(e => e.id === evidenceId)) return inv;

        const updatedEv = (inv.paymentEvidence || []).map(e => {
          if (e.id === evidenceId) {
            return {
              ...e,
              status: decision,
              reviewedAt: new Date().toISOString(),
              reviewNotes: notes,
            };
          }
          return e;
        });

        if (decision === 'confirmed') {
          return {
            ...inv,
            status: 'paid',
            financials: {
              ...inv.financials,
              amountPaid: inv.financials.total,
              amountDue: 0,
            },
            paymentEvidence: updatedEv,
          };
        } else {
          return {
            ...inv,
            status: 'rejected',
            paymentEvidence: updatedEv,
          };
        }
      })
    );

    const inv = invoices.find(i => i.paymentEvidence?.some(e => e.id === evidenceId));
    if (decision === 'confirmed') {
      addActivity('payment_confirmed', `Payment confirmed for ${inv?.reference || 'invoice'}. Marked Paid.`, inv);
    } else {
      addActivity('payment_rejected', `Payment evidence rejected for ${inv?.reference || 'invoice'}.`, inv);
    }
  };

  const verifyReference = (reference: string, inspectData?: any): VerificationResult => {
    const res = verifyInvoiceRecord(reference, invoices, inspectData);
    if (res.status === 'FOUND') {
      if (res.integrity === 'MATCH') {
        addActivity('verified', `Verification performed for ${reference}: Integrity MATCH.`);
      } else {
        addActivity('mismatch_detected', `Verification performed for ${reference}: Integrity MISMATCH.`);
      }
    }
    return res;
  };

  const sendMessage = (threadId: string, text: string) => {
    const newMsg = {
      id: `m-${Date.now()}`,
      senderId: 'me',
      text,
      timestamp: 'Just now',
    };

    setThreads(prev =>
      prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            lastMessage: text,
            lastTimestamp: 'Just now',
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );
  };

  const shareInvoiceInThread = (threadId: string, invoice: Invoice) => {
    const newMsg = {
      id: `m-${Date.now()}`,
      senderId: 'me',
      timestamp: 'Just now',
      isInvoiceShare: true,
      sharedInvoiceRef: invoice.reference,
      sharedInvoice: {
        reference: invoice.reference,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.financials.total,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        status: invoice.status,
      },
    };

    setThreads(prev =>
      prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            lastMessage: `Shared invoice ${invoice.invoiceNumber} (${invoice.reference})`,
            lastTimestamp: 'Just now',
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );
  };

  const resetDemoData = () => {
    setInvoices(INITIAL_INVOICES);
    setThreads(INITIAL_THREADS);
    setActivities(INITIAL_ACTIVITY);
    setActiveProfile(CURRENT_BUSINESS);
    localStorage.removeItem('trustlayer_invoices');
    localStorage.removeItem('trustlayer_threads');
    localStorage.removeItem('trustlayer_activities');
    localStorage.removeItem('trustlayer_profile');
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        issuedFilter,
        setIssuedFilter,
        receivedFilter,
        setReceivedFilter,
        invoices,
        threads,
        activities,
        activeProfile,
        setActiveProfile,
        counterparties: COUNTERPARTIES,
        selectedInvoice,
        setSelectedInvoice,
        editingInvoice,
        setEditingInvoice,
        saveInvoiceDraft,
        registerInvoice,
        sendInvoice,
        correctInvoice,
        acceptReceivedInvoice,
        rejectReceivedInvoice,
        submitPaymentEvidence,
        reviewPaymentEvidence,
        verifyReference,
        sendMessage,
        shareInvoiceInThread,
        globalSearch,
        setGlobalSearch,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
