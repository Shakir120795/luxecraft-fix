'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  getFreshCurrentUser,
  closeSupportChat,
  getSupportChat,
  sendSupportChatMessage,
  SupportConversation,
} from '@/lib/api';

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [chat, setChat] = useState<SupportConversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setAuthChecked(false);

    getFreshCurrentUser()
      .then((user) => {
        if (cancelled) return;

        const authenticated = Boolean(user?.id);
        setLoggedIn(authenticated);
        setAuthChecked(true);

        if (!authenticated) {
          setChat(null);
          setLoading(false);
          return null;
        }

        return getSupportChat();
      })
      .then((conversation) => {
        if (cancelled) return;
        if (conversation) setChat(conversation);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setAuthChecked(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !loggedIn) return;

    const poll = window.setInterval(async () => {
      const conversation = await getSupportChat();
      if (conversation) setChat(conversation);
    }, 4000);

    return () => window.clearInterval(poll);
  }, [open, loggedIn]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages.length, open]);

  async function handleCloseChat() {
    if (!loggedIn || chat?.status === 'CLOSED') return;

    const result = await closeSupportChat();
    if (!result.success) {
      window.alert(result.message || 'Failed to close chat');
      return;
    }

    setChat((current) => (current ? { ...current, status: 'CLOSED' } : current));
    setOpen(false);
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || sending || !loggedIn) return;

    setSending(true);
    const result = await sendSupportChatMessage(trimmed);

    if (result.success && result.data) {
      const createdMessage = result.data;

      setChat((current) => {
        if (!current) return current;

        return {
          ...current,
          status: 'OPEN',
          lastMessageAt: createdMessage.createdAt,
          messages: [...current.messages, createdMessage],
        };
      });
      setMessage('');
    } else if (result.message) {
      window.alert(result.message);
    }

    setSending(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend(event);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close customer support chat' : 'Open customer support chat'}
        className="fixed bottom-5 right-5 z-[220] flex h-14 w-14 items-center justify-center rounded-full bg-[#2f6b36] text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#244f2a] focus:outline-none focus:ring-2 focus:ring-[#e8c98a] focus:ring-offset-2"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v6a3.5 3.5 0 0 1-3.5 3.5H12l-4.2 3v-3.1A3.5 3.5 0 0 1 5 12.5v-6Z" />
            <path d="M8 8h8M8 11h5" />
          </svg>
        )}
      </button>

      {open && (
        <section
          aria-label="Wolhomes customer support"
          className="fixed bottom-[88px] right-4 z-[219] flex h-[min(620px,calc(100vh-110px))] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-[#fffdf9] shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:right-5"
        >
          <div className="flex items-center justify-between bg-[#2f6b36] px-5 py-4 text-white">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e8c98a]">
                Wolhomes
              </p>
              <h2 className="mt-0.5 font-serif text-xl">Customer Support</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider">
                {chat?.status === 'CLOSED' ? 'Closed' : 'Chat'}
              </span>
              {chat?.status !== 'CLOSED' && (
                <button
                  type="button"
                  onClick={() => void handleCloseChat()}
                  className="rounded-md border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition hover:bg-white/20"
                >
                  Close
                </button>
              )}
            </div>
          </div>

          {!authChecked || loading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-[#7b756f]">
              Loading support chat…
            </div>
          ) : !loggedIn ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f0eb] text-[#2f6b36]">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
                </svg>
              </div>
              <h3 className="font-serif text-2xl text-[#2b2118]">Login to chat</h3>
              <p className="mt-2 text-sm leading-6 text-[#7b756f]">
                Customer support chat is available to registered Wolhomes customers.
              </p>
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="mt-5 rounded-lg bg-[#2f6b36] px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#244f2a]"
              >
                Login
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {chat?.messages?.length ? (
                  chat.messages.map((item) => {
                    const mine = item.senderType === 'CUSTOMER';

                    return (
                      <div key={item.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                        <div
                          className={
                            mine
                              ? 'max-w-[84%] rounded-2xl rounded-br-md bg-[#2f6b36] px-3.5 py-2.5 text-sm leading-5 text-white'
                              : 'max-w-[84%] rounded-2xl rounded-bl-md border border-[#e7ded4] bg-white px-3.5 py-2.5 text-sm leading-5 text-[#2b2118]'
                          }
                        >
                          <p className="whitespace-pre-wrap break-words">{item.message}</p>
                          <div className={mine ? 'mt-1 text-[9px] text-white/65' : 'mt-1 text-[9px] text-[#9b948c]'}>
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full min-h-[260px] items-center justify-center px-5 text-center">
                    <div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f0eb] text-[#2f6b36]">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v6a3.5 3.5 0 0 1-3.5 3.5H12l-4.2 3v-3.1A3.5 3.5 0 0 1 5 12.5v-6Z" />
                        </svg>
                      </div>
                      <p className="mt-3 font-serif text-lg text-[#2b2118]">How can we help?</p>
                      <p className="mt-1 text-xs leading-5 text-[#7b756f]">
                        Send us a message and our team will reply here.
                      </p>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={handleSend} className="border-t border-[#e7ded4] bg-[#faf7f2] p-3">
                <div className="flex items-end gap-2 rounded-xl border border-[#ded4c9] bg-white p-2">
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    maxLength={2000}
                    placeholder="Write a message…"
                    className="min-h-[52px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-[#2b2118] outline-none placeholder:text-[#aaa29a]"
                    aria-label="Support message"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || sending}
                    aria-label="Send support message"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2f6b36] text-white transition hover:bg-[#244f2a] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="m4 4 16 8-16 8 3-8-3-8Z" />
                      <path d="M7 12h13" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1.5 px-1 text-[9px] text-[#999188]">
                  Enter to send · Shift+Enter for a new line
                </p>
              </form>
            </>
          )}
        </section>
      )}
    </>
  );
}
