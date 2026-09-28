'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import {
  getSupportConversations,
  getSupportConversation,
  sendSupportReply,
  updateSupportConversationStatus,
  SupportConversation,
} from '@/lib/api';

function customerName(conversation: SupportConversation) {
  const name = [conversation.user?.firstName, conversation.user?.lastName]
    .filter(Boolean)
    .join(' ');
  return name || conversation.user?.email || 'Customer';
}

function formatDate(value: string | null) {
  if (!value) return 'No messages yet';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SupportChatPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SupportConversation | null>(null);
  const [message, setMessage] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);

  async function loadConversations(selectFirst = false) {
    try {
      const data = await getSupportConversations('OPEN');
      setConversations(data);

      if ((selectFirst || !selectedId) && data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load support conversations:', error);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadConversation(id: string) {
    setLoadingChat(true);
    try {
      const data = await getSupportConversation(id);
      setSelected(data);
      setConversations((current) =>
        current.map((item) =>
          item.id === data.id ? { ...item, unreadCount: 0, messages: data.messages } : item,
        ),
      );
    } catch (error) {
      console.error('Failed to load support conversation:', error);
    } finally {
      setLoadingChat(false);
    }
  }

  useEffect(() => {
    void loadConversations(true);

    const interval = window.setInterval(() => {
      void loadConversations();
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    void loadConversation(selectedId);

    const interval = window.setInterval(() => {
      void loadConversation(selectedId);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [selectedId]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !selectedId || sending) return;

    setSending(true);
    try {
      const created = await sendSupportReply(selectedId, trimmed);
      setSelected((current) => {
        if (!current) return current;
        return {
          ...current,
          status: 'OPEN',
          lastMessageAt: created.createdAt,
          messages: [...current.messages, created],
        };
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send support reply:', error);
      window.alert('Failed to send reply.');
    } finally {
      setSending(false);
    }
  }

  async function handleClose() {
    if (!selectedId) return;

    try {
      await updateSupportConversationStatus(selectedId, 'CLOSED');
      setConversations((current) => current.filter((item) => item.id !== selectedId));
      setSelected(null);
      setSelectedId(null);
    } catch (error) {
      console.error('Failed to close support chat:', error);
      window.alert('Failed to close chat.');
    }
  }

  return (
    <AdminLayout>
      <div className="flex h-full min-h-[calc(100vh-7rem)] flex-col gap-5">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-primary)]">Live Chat</h1>
          <p className="mt-1 text-[var(--color-muted)]">
            Reply to logged-in customers from one support inbox.
          </p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-h-0 border-b border-[var(--color-border)] lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
              <div className="font-medium text-[var(--color-text)]">Open conversations</div>
              <div className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-xs text-[var(--color-muted)]">
                {conversations.length}
              </div>
            </div>

            {loadingList ? (
              <div className="p-6 text-sm text-[var(--color-muted)]">Loading chats…</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--color-muted)]">
                No open conversations.
              </div>
            ) : (
              <div className="max-h-[42vh] overflow-y-auto lg:max-h-none lg:h-[calc(100%-65px)]">
                {conversations.map((conversation) => {
                  const active = conversation.id === selectedId;
                  const latest = conversation.messages?.[0];

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      className={
                        active
                          ? 'block w-full border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-4 text-left'
                          : 'block w-full border-b border-[var(--color-border)] px-4 py-4 text-left transition-colors hover:bg-[var(--color-bg)]'
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[var(--color-text)]">
                            {customerName(conversation)}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                            {conversation.user?.email}
                          </div>
                        </div>
                        {conversation.unreadCount ? (
                          <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 truncate text-xs text-[var(--color-muted)]">
                        {latest?.message || 'Start the conversation'}
                      </div>
                      <div className="mt-1 text-[10px] text-[var(--color-muted)]">
                        {formatDate(conversation.lastMessageAt)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="flex min-h-[520px] min-w-0 flex-1 flex-col">
            {!selectedId ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-[var(--color-muted)]">
                Select a conversation to reply.
              </div>
            ) : loadingChat && !selected ? (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">
                Loading conversation…
              </div>
            ) : selected ? (
              <>
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                  <div>
                    <div className="font-serif text-xl text-[var(--color-primary)]">
                      {customerName(selected)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      {selected.user?.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleClose()}
                    className="border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
                  >
                    Close Chat
                  </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--color-bg)] p-5">
                  {selected.messages.map((item) => {
                    const admin = item.senderType === 'ADMIN';

                    return (
                      <div key={item.id} className={admin ? 'flex justify-end' : 'flex justify-start'}>
                        <div
                          className={
                            admin
                              ? 'max-w-[78%] rounded-2xl rounded-br-md bg-[var(--color-accent)] px-4 py-3 text-sm text-white'
                              : 'max-w-[78%] rounded-2xl rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)]'
                          }
                        >
                          <div className="mb-1 text-[10px] uppercase tracking-wider opacity-60">
                            {admin ? 'Admin' : 'Customer'}
                          </div>
                          <p className="whitespace-pre-wrap break-words">{item.message}</p>
                          <div className="mt-1.5 text-[10px] opacity-55">
                            {formatDate(item.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSend} className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="Type your reply…"
                      className="min-h-[76px] flex-1 resize-none border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || sending}
                      className="rounded-lg bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                  <div className="mt-2 text-[10px] text-[var(--color-muted)]">
                    Messages are limited to 2000 characters.
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">
                Conversation not found.
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
