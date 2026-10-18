import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/finance';
import {
  Send,
  Search,
  Paperclip,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Plus,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const MessagingView: React.FC = () => {
  const {
    threads,
    invoices,
    sendMessage,
    shareInvoiceInThread,
    setSelectedInvoice,
  } = useApp();

  const [activeThreadId, setActiveThreadId] = useState<string>(() => threads[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');

  const activeThread = useMemo(() => {
    return threads.find(t => t.id === activeThreadId) || threads[0];
  }, [threads, activeThreadId]);

  const filteredThreads = useMemo(() => {
    if (!threadSearch.trim()) return threads;
    const q = threadSearch.toLowerCase();
    return threads.filter(
      t =>
        t.participant.name.toLowerCase().includes(q) ||
        t.participant.username.toLowerCase().includes(q)
    );
  }, [threads, threadSearch]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;
    sendMessage(activeThread.id, inputText.trim());
    setInputText('');
  };

  const handleSelectInvoiceToShare = (inv: Invoice) => {
    if (!activeThread) return;
    shareInvoiceInThread(activeThread.id, inv);
    setShowShareModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] min-h-[600px] flex flex-col">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs flex-1 flex overflow-hidden">
        {/* Left Column: Threads List (320px) */}
        <div className="w-80 border-r border-slate-200/80 flex flex-col shrink-0">
          {/* Search Header */}
          <div className="p-3.5 border-b border-slate-100 space-y-2.5">
            <h2 className="text-sm font-bold text-slate-900">B2B Conversations</h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search business contacts..."
                value={threadSearch}
                onChange={e => setThreadSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredThreads.map(thread => {
              const isActive = thread.id === activeThread?.id;

              return (
                <div
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start space-x-3 ${
                    isActive ? 'bg-indigo-50/60' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {thread.participant.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 truncate">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {thread.participant.name}
                        </span>
                        {thread.participant.verified && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {thread.lastTimestamp}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {thread.participant.username}
                    </div>

                    <p className="text-xs text-slate-600 truncate mt-1">
                      {thread.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chat View */}
        {activeThread ? (
          <div className="flex-1 flex flex-col bg-slate-50/40 min-w-0">
            {/* Chat Header */}
            <div className="p-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                  {activeThread.participant.avatar}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-bold text-xs text-slate-900">
                      {activeThread.participant.name}
                    </h3>
                    <span className="font-mono text-[11px] text-indigo-600 font-medium">
                      {activeThread.participant.username}
                    </span>
                    {activeThread.participant.verified && (
                      <span className="inline-flex items-center text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                        Verified Business
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {activeThread.participant.rating}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Share Invoice</span>
              </button>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeThread.messages.map(msg => {
                const isMe = msg.senderId === 'me';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Invoice Card inside Chat */}
                    {msg.isInvoiceShare && msg.sharedInvoice ? (
                      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center space-x-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {msg.sharedInvoice.reference}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {msg.sharedInvoice.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-[11px] text-slate-400 block">Invoice #</span>
                            <span className="font-mono font-bold text-xs text-slate-800">
                              {msg.sharedInvoice.invoiceNumber}
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-1">
                              Due: {msg.sharedInvoice.dueDate}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 block">Total Amount</span>
                            <span className="font-mono font-extrabold text-base text-slate-900">
                              {formatCurrency(msg.sharedInvoice.amount, msg.sharedInvoice.currency)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const found = invoices.find(
                              i => i.reference === msg.sharedInvoice?.reference
                            );
                            if (found) setSelectedInvoice(found);
                          }}
                          className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <span>Open Invoice Details</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Standard Message Bubble */
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200/80 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                title="Attach or share invoice"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type a message or share an invoice..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Select a conversation to start messaging.
          </div>
        )}
      </div>

      {/* Share Invoice Dialog Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Share Invoice in Thread</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select a registered commercial invoice to attach to the conversation with{' '}
              <strong>{activeThread?.participant.name}</strong>.
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {invoices.filter(i => i.reference).map(inv => (
                <div
                  key={inv.id}
                  onClick={() => handleSelectInvoiceToShare(inv)}
                  className="p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900">{inv.reference}</div>
                    <div className="text-[11px] text-slate-500">
                      {inv.invoiceNumber} &bull; {inv.buyer.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">
                      {formatCurrency(inv.financials.total, inv.currency)}
                    </div>
                    <span className="text-[10px] text-slate-400">{inv.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
