'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import {
  SupportConversationDetail,
  SupportConversationSummary,
  getSupportConversation,
  getSupportConversations,
  replySupportMessage,
  setSupportConversationStatus,
} from '@/lib/api';

function customerName(c: { firstName: string | null; lastName: string | null; email: string }) {
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email;
}

export default function SupportChatPage() {
  const [conversations, setConversations] = useState<SupportConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<SupportConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadList() {
    try {
      setConversations(await getSupportConversations());
    } catch (error) {
      console.error('Failed to load support conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadThread(id: string) {
    try {
      setThread(await getSupportConversation(id));
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }

  useEffect(() => {
    void loadList();
    const timer = setInterval(() => void loadList(), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    void loadThread(selectedId);
    const timer = setInterval(() => void loadThread(selectedId), 8000);
    return () => clearInterval(timer);
  }, [selectedId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages]);

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const sent = await replySupportMessage(selectedId, draft.trim());
      setDraft('');
      setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, sent] } : prev));
      void loadList();
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  }

  async function onToggleStatus() {
    if (!thread) return;
    const next = thread.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      await setSupportConversationStatus(thread.id, next);
      setThread({ ...thread, status: next });
      void loadList();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Chat</h1>
        <p className="text-sm text-gray-500">Live chat with signed-in customers from the storefront widget.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {loading ? (
            <p className="p-4 text-sm text-gray-500">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`block w-full px-4 py-3 text-left hover:bg-gray-50 ${selectedId === c.id ? 'bg-green-50' : ''}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-gray-900">{customerName(c.user)}</span>
                      {c.unreadCount > 0 && (
                        <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">{c.unreadCount}</span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                      {c.lastMessage ? `${c.lastMessage.senderType === 'ADMIN' ? 'You: ' : ''}${c.lastMessage.body}` : '—'}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-gray-400">
                      {new Date(c.lastMessageAt).toLocaleString()} · {c.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex min-h-[480px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
          {!thread ? (
            <p className="p-6 text-sm text-gray-500">Select a conversation to reply.</p>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{customerName(thread.user)}</p>
                  <p className="text-xs text-gray-500">{thread.user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={onToggleStatus}
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  {thread.status === 'OPEN' ? 'Close chat' : 'Reopen chat'}
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-gray-50 px-4 py-4">
                {thread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      m.senderType === 'ADMIN'
                        ? 'ml-auto bg-green-700 text-white'
                        : 'mr-auto border border-gray-200 bg-white text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`mt-1 text-[10px] ${m.senderType === 'ADMIN' ? 'text-green-100' : 'text-gray-400'}`}>
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={onReply} className="flex gap-2 border-t border-gray-100 p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your reply…"
                  maxLength={2000}
                  className="min-w-0 flex-1 rounded-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
                />
                <button
                  type="submit"
                  disabled={sending || draft.trim().length === 0}
                  className="rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
