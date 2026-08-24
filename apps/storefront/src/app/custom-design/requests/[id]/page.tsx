'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCustomRequest, sendCustomMessage, acceptQuote, isAuthenticated, CustomRequest, CustomMessage, CustomQuote } from '@/lib/api';

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
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-luxury-brown">
            <div className="w-4 h-4 bg-luxury-gold rounded-full animate-pulse" />
            <span className="font-serif">Loading request...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-serif font-light text-luxury-charcoal mb-4">Request Not Found</h1>
          <p className="text-luxury-brown mb-8">{error || 'The request could not be found'}</p>
          <Link href="/custom-design/requests" className="btn-luxury px-10 py-4 inline-block">
            Back to Requests →
          </Link>
        </div>
      </div>
    );
  }

  const latestQuote = quotes.length > 0 ? quotes[0] : null;

  return (
    <main className="min-h-screen bg-luxury-cream">
      {/* Header */}
      <div className="bg-luxury-beige border-b border-luxury-sand py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/custom-design/requests" className="text-luxury-gold hover:text-luxury-darkGold">
              ← Back
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-3">
                {request.title}
              </h1>
              <p className="text-luxury-brown text-lg">Request #{request.requestNumber}</p>
            </div>
            <span className={`text-sm px-4 py-2 self-start ${
              request.status === 'Completed' ? 'bg-luxury-gold/20 text-luxury-gold' :
              request.status === 'In Progress' ? 'bg-luxury-gold/10 text-luxury-gold' :
              request.status === 'Quoted' ? 'bg-luxury-gold/10 text-luxury-gold' :
              'bg-luxury-sand text-luxury-brown'
            }`}>
              {request.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Request Details */}
            <div className="border border-luxury-sand bg-luxury-beige p-8">
              <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Request Details</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">Description</h3>
                  <p className="text-luxury-brown leading-relaxed">{request.description}</p>
                </div>

                {request.productCategory && (
                  <div>
                    <h3 className="text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">Category</h3>
                    <p className="text-luxury-brown">{request.productCategory}</p>
                  </div>
                )}

                {request.desiredDimensions && (
                  <div>
                    <h3 className="text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">Dimensions</h3>
                    <p className="text-luxury-brown">{request.desiredDimensions}</p>
                  </div>
                )}

                {request.preferredColors && (
                  <div>
                    <h3 className="text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">Preferred Colors</h3>
                    <p className="text-luxury-brown">{request.preferredColors}</p>
                  </div>
                )}

                {request.preferredMaterials && (
                  <div>
                    <h3 className="text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">Preferred Materials</h3>
                    <p className="text-luxury-brown">{request.preferredMaterials}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">Quantity</h3>
                  <p className="text-luxury-brown">{request.quantity}</p>
                </div>

                {request.estimatedBudget && (
                  <div>
                    <h3 className="text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">Budget</h3>
                    <p className="text-luxury-brown">${request.estimatedBudget.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="border border-luxury-sand bg-luxury-beige p-8">
              <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Conversation</h2>

              {messages.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`p-4 ${
                        message.senderType === 'CUSTOMER'
                          ? 'bg-luxury-gold/10 ml-auto max-w-[80%]'
                          : message.senderType === 'ADMIN'
                          ? 'bg-luxury-sand max-w-[80%]'
                          : 'bg-luxury-cream text-center text-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-luxury-charcoal">
                          {message.senderType === 'CUSTOMER' ? 'You' : 
                           message.senderType === 'ADMIN' ? 'LuxeCraft Team' : 'System'}
                        </span>
                        <span className="text-xs text-luxury-brown/70">
                          {new Date(message.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-luxury-brown leading-relaxed">{message.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-luxury-brown mb-6 text-center py-8">
                  No messages yet. Start the conversation!
                </p>
              )}

              {/* Send Message */}
              <form onSubmit={handleSendMessage} className="space-y-4">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  className="input-luxury"
                  placeholder="Type your message..."
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="btn-luxury px-6 py-3 disabled:opacity-50"
                >
                  {sendingMessage ? 'Sending...' : 'Send Message →'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Latest Quote */}
            {latestQuote && (
              <div className="sticky top-24 border border-luxury-sand bg-luxury-beige p-6">
                <h2 className="text-xl font-serif text-luxury-charcoal mb-4">Quote</h2>
                
                <div className="space-y-3 mb-6 pb-6 border-b border-luxury-sand text-sm">
                  <div className="flex justify-between">
                    <span className="text-luxury-brown">Quote #{latestQuote.quoteNumber}</span>
                    <span className={`text-xs px-2 py-1 ${
                      latestQuote.status === 'Accepted' ? 'bg-luxury-gold/20 text-luxury-gold' :
                      'bg-luxury-sand text-luxury-brown'
                    }`}>
                      {latestQuote.status}
                    </span>
                  </div>

                  {latestQuote.version > 1 && (
                    <div className="text-xs text-luxury-brown/70">
                      Version {latestQuote.version}
                    </div>
                  )}

                  <div className="flex justify-between text-luxury-brown">
                    <span>Base Price</span>
                    <span>${latestQuote.basePrice.toFixed(2)}</span>
                  </div>

                  {latestQuote.designFee && latestQuote.designFee > 0 && (
                    <div className="flex justify-between text-luxury-brown">
                      <span>Design Fee</span>
                      <span>${latestQuote.designFee.toFixed(2)}</span>
                    </div>
                  )}

                  {latestQuote.materialFee && latestQuote.materialFee > 0 && (
                    <div className="flex justify-between text-luxury-brown">
                      <span>Material Fee</span>
                      <span>${latestQuote.materialFee.toFixed(2)}</span>
                    </div>
                  )}

                  {latestQuote.discount && latestQuote.discount > 0 && (
                    <div className="flex justify-between text-luxury-terracotta">
                      <span>Discount</span>
                      <span>-${latestQuote.discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-2xl font-serif text-luxury-charcoal mb-6">
                  <span>Total</span>
                  <span>${latestQuote.total.toFixed(2)}</span>
                </div>

                {latestQuote.notes && (
                  <div className="mb-6 p-4 bg-luxury-cream border border-luxury-sand">
                    <p className="text-sm text-luxury-brown">{latestQuote.notes}</p>
                  </div>
                )}

                {latestQuote.validUntil && (
                  <p className="text-xs text-luxury-brown/70 mb-6">
                    Valid until {new Date(latestQuote.validUntil).toLocaleDateString()}
                  </p>
                )}

                {latestQuote.status === 'Pending' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleAcceptQuote(latestQuote.id)}
                      className="btn-luxury w-full px-6 py-3"
                    >
                      Accept Quote →
                    </button>
                    <button className="w-full border border-luxury-sand bg-luxury-cream px-6 py-3 text-sm text-luxury-brown hover:border-luxury-gold transition-colors">
                      Request Revision
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Status Info */}
            <div className="border border-luxury-sand bg-luxury-beige p-6">
              <h3 className="font-serif text-lg text-luxury-charcoal mb-4">Request Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-luxury-brown/70">Created:</span>
                  <p className="text-luxury-charcoal">
                    {new Date(request.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-luxury-brown/70">Last Updated:</span>
                  <p className="text-luxury-charcoal">
                    {new Date(request.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
