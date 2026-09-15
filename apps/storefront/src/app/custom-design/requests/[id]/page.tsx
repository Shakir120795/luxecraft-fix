'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getCustomRequest,
  sendCustomMessage,
  acceptQuote,
  isAuthenticated,
  CustomRequest,
  CustomMessage,
  CustomQuote,
} from '@/lib/api';

export default function CustomRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<CustomRequest | null>(null);
  const [messages, setMessages] = useState<CustomMessage[]>([]);
  const [quotes, setQuotes] = useState<CustomQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login?redirect=/custom-design/requests');
      return;
    }

    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  async function loadRequest() {
    try {
      setLoading(true);
      const data = await getCustomRequest(requestId);

      if (data) {
        setRequest(data.request);
        setMessages(data.messages);
        setQuotes(data.quotes);
      } else {
        setError('Request not found');
      }
    } catch (err) {
      setError('Failed to load request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setSendingMessage(true);
    const result = await sendCustomMessage(requestId, newMessage);

    if (result.success) {
      setNewMessage('');
      await loadRequest();
    } else {
      alert(result.message || 'Failed to send message');
    }

    setSendingMessage(false);
  }

  async function handleAcceptQuote(quoteId: string) {
    if (!confirm('Accept this quote and proceed to checkout?')) return;

    const result = await acceptQuote(quoteId);

    if (result.success) {
      await loadRequest();
      router.push('/checkout');
    } else {
      alert(result.message || 'Failed to accept quote');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f2]">
        <div className="text-center text-[#6a636b]">
          <div className="mx-auto mb-3 h-3 w-3 animate-pulse rounded-full bg-[#8a5d38]" />
          <span className="font-serif">Loading request...</span>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f2] px-4 py-16">
        <div className="w-full max-w-lg rounded-lg border border-[#ded8d0] bg-white p-10 text-center shadow-sm">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5d38]">
            Wolhomes Bespoke
          </p>
          <h1 className="mb-4 font-serif text-4xl font-light text-[#302b35]">
            Request Not Found
          </h1>
          <p className="mb-8 text-[#6a636b]">
            {error || 'The request could not be found'}
          </p>
          <Link
            href="/custom-design/requests"
            className="inline-block rounded-md bg-[#302b35] px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#211e24]"
          >
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  const latestQuote = quotes.length > 0 ? quotes[0] : null;

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <header className="border-b border-[#ded8d0] bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/custom-design/requests"
            className="mb-7 inline-flex items-center rounded-md border border-[#ded8d0] bg-white px-4 py-2 text-sm text-[#302b35] transition hover:border-[#bf4e48] hover:text-[#bf4e48]"
          >
            ? Back to Requests
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5d38]">
                Wolhomes Bespoke
              </p>
              <h1 className="mb-2 font-serif text-4xl font-light text-[#302b35] sm:text-5xl">
                {request.title}
              </h1>
              <p className="text-base text-[#6a636b]">
                Request #{request.requestNumber}
              </p>
            </div>

            <span
              className={`inline-flex self-start rounded-sm px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] sm:self-auto ${
                request.status === 'Completed'
                  ? 'bg-[#8a5d38]/10 text-[#8a5d38]'
                  : request.status === 'In Progress'
                    ? 'bg-[#bf4e48]/10 text-[#bf4e48]'
                    : request.status === 'Quoted'
                      ? 'bg-[#bf4e48]/10 text-[#bf4e48]'
                      : 'bg-[#f0ece7] text-[#6a636b]'
              }`}
            >
              {request.status}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-lg border border-[#ded8d0] bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-7 flex items-end justify-between border-b border-[#eee9e3] pb-5">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a5d38]">
                    Project
                  </p>
                  <h2 className="font-serif text-2xl text-[#302b35]">Request Details</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]">
                    Description
                  </h3>
                  <p className="leading-7 text-[#6a636b]">{request.description}</p>
                </div>

                {request.productCategory && (
                  <div>
                    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]">
                      Category
                    </h3>
                    <p className="text-[#302b35]">{request.productCategory}</p>
                  </div>
                )}

                {request.desiredDimensions && (
                  <div>
                    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]">
                      Dimensions
                    </h3>
                    <p className="text-[#302b35]">{request.desiredDimensions}</p>
                  </div>
                )}

                {request.preferredColors && (
                  <div>
                    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]">
                      Preferred Colors
                    </h3>
                    <p className="text-[#302b35]">{request.preferredColors}</p>
                  </div>
                )}

                {request.preferredMaterials && (
                  <div>
                    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]">
                      Preferred Materials
                    </h3>
                    <p className="text-[#302b35]">{request.preferredMaterials}</p>
                  </div>
                )}

                <div>
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]">
                    Quantity
                  </h3>
                  <p className="text-[#302b35]">{request.quantity}</p>
                </div>

                {request.estimatedBudget != null &&
                  Number.isFinite(Number(request.estimatedBudget)) && (
                    <div>
                      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]">
                        Budget
                      </h3>
                      <p className="font-serif text-lg text-[#302b35]">
                        ${Number(request.estimatedBudget).toFixed(2)}
                      </p>
                    </div>
                  )}
              </div>
            </section>

            <section className="rounded-lg border border-[#ded8d0] bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-7 flex items-end justify-between border-b border-[#eee9e3] pb-5">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a5d38]">
                    Messages
                  </p>
                  <h2 className="font-serif text-2xl text-[#302b35]">Conversation</h2>
                </div>
                <span className="text-xs text-[#8b8389]">
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </span>
              </div>

              {messages.length > 0 ? (
                <div className="mb-7 space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`rounded-lg border p-4 sm:p-5 ${
                        message.senderType === 'CUSTOMER'
                          ? 'ml-auto max-w-[92%] border border-[#bf4e48]/20 bg-[#bf4e48]/5 sm:max-w-[82%]'
                          : message.senderType === 'ADMIN'
                            ? 'max-w-[92%] border border-[#ded8d0] bg-[#faf9f7] sm:max-w-[82%]'
                            : 'mx-auto max-w-full border-[#eee9e3] bg-[#f8f6f2] text-center'
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#302b35]">
                          {message.senderType === 'CUSTOMER'
                            ? 'You'
                            : message.senderType === 'ADMIN'
                              ? 'Wolhomes Team'
                              : 'System'}
                        </span>
                        <span className="text-xs text-[#6f666d]">
                          {new Date(message.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="leading-7 font-normal text-[#403a42]">{message.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-7 rounded-lg border border-dashed border-[#ded8d0] bg-[#faf9f7] px-6 py-10 text-center">
                  <p className="mb-1 font-serif text-lg text-[#302b35]">
                    No messages yet
                  </p>
                  <p className="text-sm text-[#6a636b]">
                    Start the conversation with the Wolhomes team.
                  </p>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="border-t border-[#eee9e3] pt-6">
                <label
                  htmlFor="request-message"
                  className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]"
                >
                  Send a Message
                </label>

                <textarea
                  id="request-message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  className="min-h-[120px] w-full resize-y rounded-md border border-[#ded8d0] bg-[#fcfbf9] px-4 py-3 text-sm leading-6 text-[#403a42] placeholder:text-[#807780] outline-none transition focus:border-[#bf4e48] focus:bg-white"
                  placeholder="Type your message..."
                  disabled={sendingMessage}
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="rounded-md bg-[#bf4e48] px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#a9443e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <aside className="space-y-6">
            {latestQuote && (
              <section className="rounded-lg border border-[#ded8d0] bg-white p-6 shadow-sm lg:sticky lg:top-24">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a5d38]">
                  Your Quote
                </p>
                <h2 className="mb-5 font-serif text-2xl text-[#302b35]">
                  {latestQuote.quoteNumber}
                </h2>

                <div className="mb-6 space-y-3 border-b border-[#eee9e3] pb-6 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#6a636b]">Status</span>
                    <span
                      className={`rounded-sm px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                        latestQuote.status === 'Accepted'
                          ? 'bg-[#8a5d38]/10 text-[#8a5d38]'
                          : 'bg-[#f0ece7] text-[#6a636b]'
                      }`}
                    >
                      {latestQuote.status}
                    </span>
                  </div>

                  {latestQuote.version > 1 && (
                    <div className="flex justify-between text-[#8b8389]">
                      <span>Version</span>
                      <span>{latestQuote.version}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#6a636b]">
                    <span>Base Price</span>
                    <span>${Number(latestQuote.basePrice ?? 0).toFixed(2)}</span>
                  </div>

                  {latestQuote.designFee && latestQuote.designFee > 0 && (
                    <div className="flex justify-between text-[#6a636b]">
                      <span>Design Fee</span>
                      <span>${Number(latestQuote.designFee ?? 0).toFixed(2)}</span>
                    </div>
                  )}

                  {latestQuote.materialFee && latestQuote.materialFee > 0 && (
                    <div className="flex justify-between text-[#6a636b]">
                      <span>Material Fee</span>
                      <span>${Number(latestQuote.materialFee ?? 0).toFixed(2)}</span>
                    </div>
                  )}

                  {latestQuote.discount && latestQuote.discount > 0 && (
                    <div className="flex justify-between text-[#a9443e]">
                      <span>Discount</span>
                      <span>-${Number(latestQuote.discount ?? 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="mb-6 flex items-end justify-between gap-4">
                  <span className="font-serif text-lg text-[#302b35]">Total</span>
                  <span className="font-serif text-3xl text-[#302b35]">
                    ${Number(latestQuote.total ?? 0).toFixed(2)}
                  </span>
                </div>

                {latestQuote.notes && (
                  <div className="mb-5 rounded-md border border-[#eee9e3] bg-[#faf9f7] p-4">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a5d38]">
                      Notes
                    </p>
                    <p className="text-sm leading-6 text-[#6a636b]">{latestQuote.notes}</p>
                  </div>
                )}

                {latestQuote.validUntil && (
                  <p className="mb-6 text-xs text-[#8b8389]">
                    Valid until {new Date(latestQuote.validUntil).toLocaleDateString()}
                  </p>
                )}

                {latestQuote.status === 'Pending' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleAcceptQuote(latestQuote.id)}
                      className="w-full rounded-md bg-[#bf4e48] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#a9443e]"
                    >
                      Accept Quote
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-md border border-[#ded8d0] bg-white px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-[#302b35] transition hover:border-[#bf4e48] hover:text-[#bf4e48]"
                    >
                      Request Revision
                    </button>
                  </div>
                )}
              </section>
            )}

            <section className="rounded-lg border border-[#ded8d0] bg-white p-6 shadow-sm">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a5d38]">
                Timeline
              </p>
              <h3 className="mb-5 font-serif text-xl text-[#302b35]">Request Info</h3>

              <div className="space-y-5 text-sm">
                <div>
                  <span className="text-xs uppercase tracking-[0.1em] text-[#9a9298]">
                    Created
                  </span>
                  <p className="mt-1 text-[#302b35]">
                    {new Date(request.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-[0.1em] text-[#9a9298]">
                    Last Updated
                  </span>
                  <p className="mt-1 text-[#302b35]">
                    {new Date(request.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </section>

            <Link
              href="/custom-design/requests"
              className="block rounded-lg border border-[#302b35] bg-white px-6 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.1em] text-[#302b35] transition hover:bg-[#302b35] hover:text-white"
            >
              All Custom Requests
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}



