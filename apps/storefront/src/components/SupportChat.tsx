'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  getSupportConversation,
  isAuthenticated,
  sendSupportMessage,
  type SupportMessage,
} from '@/lib/api';

/**
 * Customer support chat, mirroring the live build's widget:
 * green round button bottom-right; guests are told support chat is for
 * registered customers and offered a login link; signed-in customers get a
 * real thread backed by the support-chat API (admin replies from the admin
 * panel). The thread polls while the panel is open — the stack has no
 * websocket layer, and chat does not need one at this volume.
 */
export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const data = await getSupportConversation();
    if (data) setMessages(data.messages);
  }, []);

  useEffect(() => {
    setSignedIn(isAuthenticated());
  }, [open]);

  useEffect(() => {
    if (!open || !signedIn) return;
    void refresh();
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
  }, [open, signedIn, refresh]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    const sent = await sendSupportMessage(body);
    setSending(false);
    if (!sent) {
      setError('Message could not be sent. Please try again.');
      return;
    }
    setDraft('');
    setMessages((prev) => [...prev, sent]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open customer support chat"
        className="fixed bottom-5 right-5 z-[11000] flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:bg-green-700"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.2 13.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.2 1.1 2.3 1.5 2.6 1.6.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4 0 .1 0 .7-.2 1.2Z" />
        </svg>
      </button>

      {open && (
        <div
          role="region"
          aria-label="Wolhomes customer support"
          className="fixed bottom-24 right-5 z-[11000] flex max-h-[70vh] w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
        >
          <div className="bg-green-700 px-4 py-3 text-white">
            <p className="text-sm font-semibold">Customer Support</p>
            <p className="text-xs text-green-100">
              {signedIn ? 'We usually reply within a few hours.' : 'Login to chat'}
            </p>
          </div>

          {!signedIn ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-neutral-600">
                Customer support chat is available to registered Wolhomes customers.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block rounded-full bg-green-700 px-6 py-2 text-sm font-semibold text-white hover:bg-green-800"
              >
                LOGIN
              </Link>
              <p className="mt-3 text-xs text-neutral-400">
                New here? <Link href="/register" className="underline">Create an account</Link>
              </p>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-neutral-50 px-3 py-3">
                {messages.length === 0 && (
                  <p className="py-6 text-center text-sm text-neutral-500">
                    Hi there! Ask us anything about your order or our products — we reply right here.
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.senderType === 'CUSTOMER'
                        ? 'ml-auto bg-green-600 text-white'
                        : 'mr-auto border border-neutral-200 bg-white text-neutral-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    <p className={`mt-1 text-[10px] ${m.senderType === 'CUSTOMER' ? 'text-green-100' : 'text-neutral-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
              {error && <p className="px-3 pt-2 text-xs text-red-600">{error}</p>}
              <form onSubmit={onSend} className="flex gap-2 border-t border-neutral-200 p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your message…"
                  maxLength={2000}
                  className="min-w-0 flex-1 rounded-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-600"
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
      )}
    </>
  );
}
