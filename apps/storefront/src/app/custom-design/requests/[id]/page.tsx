'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getCustomRequest,
  sendCustomMessage,
  acceptQuote,
  createCustomQuoteCheckout,
  getPaymentConfiguration,
  capturePayPalPayment,
  verifyRazorpayPayment,
  verifyCryptoPayment,
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
  const [quoteProviders, setQuoteProviders] = useState<Array<'paypal' | 'razorpay' | 'crypto'>>([]);
  const [quoteProvider, setQuoteProvider] = useState<'paypal' | 'razorpay' | 'crypto'>('razorpay');
  const [quoteCryptoOptions, setQuoteCryptoOptions] = useState<Array<{ network: string; asset: string }>>([]);
  const [quoteCryptoNetwork, setQuoteCryptoNetwork] = useState('ethereum');
  const [quoteCryptoAsset, setQuoteCryptoAsset] = useState('USDT');
  const [quoteCryptoTxHash, setQuoteCryptoTxHash] = useState('');
  const [startingQuotePayment, setStartingQuotePayment] = useState(false);
  const [quotePaymentError, setQuotePaymentError] = useState<string | null>(null);
  const [quotePaymentMessage, setQuotePaymentMessage] = useState<string | null>(null);
  const [quotePayment, setQuotePayment] = useState<{
    orderId: string;
    orderNumber: string;
    provider: 'paypal' | 'razorpay' | 'crypto';
    providerOrderId?: string;
    approveUrl?: string;
    publicKey?: string;
    currency: string;
    total: number;
    crypto?: {
      network: string;
      asset: string;
      address: string;
      amount: number;
      currency: string;
      instructions: string;
      qrPayload: string;
    };
  } | null>(null);

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

        const latest = data.quotes[0];
        const activePayment = latest?.order?.payments?.find(
          (payment) => payment.status === 'PENDING' || payment.status === 'AUTHORIZED',
        );
        if (latest?.order && activePayment) {
          const metadata = activePayment.metadata && typeof activePayment.metadata === 'object'
            ? activePayment.metadata
            : {};
          const provider = activePayment.provider.toLowerCase();
          if (provider === 'crypto') {
            const network = String(metadata.network || '').toLowerCase();
            const asset = String(metadata.asset || '').toUpperCase();
            const address = String(metadata.receivingAddress || '');
            const cryptoAmount = Number(metadata.expectedAmount || latest.total);
            if (network && asset && address && Number.isFinite(cryptoAmount) && cryptoAmount > 0) {
              setQuoteProvider('crypto');
              setQuotePayment({
                orderId: latest.order.id,
                orderNumber: latest.order.orderNumber,
                provider: 'crypto',
                currency: latest.currency,
                total: latest.total,
                crypto: {
                  network,
                  asset,
                  address,
                  amount: cryptoAmount,
                  currency: String(metadata.settlementCurrency || 'USD'),
                  instructions: String(metadata.instructions || `Send exactly ${cryptoAmount.toFixed(2)} ${asset} on ${network} network to the address shown above. Do not send through another network.`),
                  qrPayload: String(metadata.qrPayload || address),
                },
              });
              setQuotePaymentMessage('A crypto payment session is already open. Send the exact amount on the selected network, then submit the transaction hash for verification.');
            }
          } else {
            const providerOrderId = provider === 'paypal'
              ? String(metadata.paypalOrderId || activePayment.providerPaymentId || '')
              : String(metadata.razorpayOrderId || activePayment.providerPaymentId || '');
            if ((provider === 'paypal' || provider === 'razorpay') && providerOrderId) {
              setQuoteProvider(provider);
              setQuotePayment({
                orderId: latest.order.id,
                orderNumber: latest.order.orderNumber,
                provider,
                providerOrderId,
                approveUrl: typeof metadata.approveUrl === 'string' ? metadata.approveUrl : undefined,
                currency: latest.currency,
                total: latest.total,
              });
              setQuotePaymentMessage('A payment session is already open for this accepted quote. Continue with the same payment to avoid creating a duplicate.');
            }
          }
        }
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
    if (!confirm('Accept this quote? You will be able to pay only after accepting it.')) return;

    setQuotePaymentError(null);
    setQuotePaymentMessage(null);
    const result = await acceptQuote(quoteId);

    if (result.success) {
      setQuotePaymentMessage('Quote accepted. Review the payment method below when you are ready to place the custom-design order.');
      await loadRequest();
    } else {
      alert(result.message || 'Failed to accept quote');
    }
  }

  useEffect(() => {
    const latest = quotes[0];
    if (!latest) {
      setQuoteProviders([]);
      return;
    }

    let active = true;
    getPaymentConfiguration(latest.currency || 'USD').then((configuration) => {
      if (!active) return;
      const configured = (configuration.providers || [])
        .map((provider) => provider.toLowerCase())
        .filter((provider): provider is 'paypal' | 'razorpay' | 'crypto' =>
          provider === 'paypal' || provider === 'razorpay' || provider === 'crypto',
        );
      const providers: Array<'paypal' | 'razorpay' | 'crypto'> = configured.length
        ? Array.from(new Set(configured))
        : configuration.configured &&
          (configuration.provider === 'paypal' || configuration.provider === 'razorpay' || configuration.provider === 'crypto')
          ? [configuration.provider]
          : [];
      const cryptoOptions = (configuration.cryptoPaymentOptions || []).map((option) => ({
        network: String(option.network).toLowerCase(),
        asset: String(option.asset).toUpperCase(),
      }));
      setQuoteCryptoOptions(cryptoOptions);
      if (quotePayment?.provider === 'crypto' && quotePayment.crypto) {
        setQuoteCryptoNetwork(quotePayment.crypto.network);
        setQuoteCryptoAsset(quotePayment.crypto.asset);
      } else if (cryptoOptions.length > 0) {
        setQuoteCryptoNetwork(cryptoOptions[0].network);
        setQuoteCryptoAsset(cryptoOptions[0].asset);
      }
      setQuoteProviders(providers);
      setQuoteProvider((current) => providers.includes(current) ? current : providers[0] || 'paypal');
    }).catch(() => {
      if (active) setQuoteProviders([]);
    });

    return () => { active = false; };
  }, [quotes, quotePayment?.provider, quotePayment?.crypto?.network, quotePayment?.crypto?.asset]);

  async function handleStartQuotePayment() {
    const latest = quotes[0];
    if (!latest || latest.status !== 'Accepted') {
      setQuotePaymentError('Accept the latest quote before paying.');
      return;
    }
    if (!quoteProviders.includes(quoteProvider)) {
      setQuotePaymentError('No configured payment gateway supports this quote currency. Please contact Wolhomes.');
      return;
    }

    setStartingQuotePayment(true);
    setQuotePaymentError(null);
    setQuotePaymentMessage(null);
    try {
      const result = await createCustomQuoteCheckout(
        latest.id,
        quoteProvider,
        quoteProvider === 'crypto' ? { network: quoteCryptoNetwork, asset: quoteCryptoAsset } : undefined,
      );
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Could not prepare custom-design payment.');
      }

      const payment = result.data;
      if (payment.alreadyPaid) {
        setQuotePaymentMessage('Payment is already confirmed for this custom-design order.');
        await loadRequest();
        return;
      }

      const providerValue = String(payment.provider || quoteProvider).toLowerCase();
      if (
        (providerValue !== 'paypal' && providerValue !== 'razorpay' && providerValue !== 'crypto') ||
        !payment.orderId ||
        (providerValue !== 'crypto' && !payment.providerOrderId)
      ) {
        throw new Error('Payment session details were incomplete. Please refresh and try again.');
      }
      const provider = providerValue as 'paypal' | 'razorpay' | 'crypto';

      const crypto = provider === 'crypto' ? payment.crypto : undefined;
      if (provider === 'crypto' && (!crypto?.network || !crypto?.asset || !crypto?.address || !Number.isFinite(Number(crypto.amount)))) {
        throw new Error('Crypto payment details are incomplete. Please refresh the quote or contact support.');
      }

      const paymentState = {
        orderId: String(payment.orderId),
        orderNumber: String(payment.orderNumber || ''),
        provider,
        providerOrderId: payment.providerOrderId ? String(payment.providerOrderId) : undefined,
        approveUrl: typeof payment.approveUrl === 'string' ? payment.approveUrl : undefined,
        publicKey: typeof payment.publicKey === 'string' ? payment.publicKey : undefined,
        currency: String(payment.currency || latest.currency || 'USD'),
        total: Number(payment.total ?? latest.total),
        crypto: crypto ? {
          network: String(crypto.network),
          asset: String(crypto.asset),
          address: String(crypto.address),
          amount: Number(crypto.amount),
          currency: String(crypto.currency || 'USD'),
          instructions: String(crypto.instructions || ''),
          qrPayload: String(crypto.qrPayload || crypto.address),
        } : undefined,
      } as const;
      setQuotePayment(paymentState);

      if (provider === 'crypto') {
        setQuoteCryptoTxHash('');
        setQuotePaymentMessage(`Send exactly ${Number(paymentState.crypto?.amount).toFixed(6)} ${paymentState.crypto?.asset} on the ${paymentState.crypto?.network} network, then submit the transaction hash below. Payment is confirmed only after blockchain verification.`);
        return;
      }

      if (provider === 'paypal') {
        if (!paymentState.approveUrl) {
          throw new Error('PayPal did not return a checkout link. Check PayPal live/sandbox credentials and try again.');
        }
        setQuotePaymentMessage('Your secure PayPal session is ready. Open PayPal below; after approval, Wolhomes will confirm the payment automatically.');
        return;
      }

      if (!paymentState.publicKey) {
        throw new Error('Razorpay payment could not be initialized because its public key is missing.');
      }

      const loadRazorpay = () => new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) {
          resolve();
          return;
        }
        const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]') as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('Razorpay Checkout could not be loaded.')), { once: true });
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Razorpay Checkout could not be loaded.'));
        document.body.appendChild(script);
      });

      await loadRazorpay();
      const RazorpayConstructor = (window as any).Razorpay;
      if (!RazorpayConstructor) throw new Error('Razorpay Checkout is unavailable.');

      const checkout = new RazorpayConstructor({
        key: paymentState.publicKey,
        order_id: paymentState.providerOrderId,
        amount: Math.round(paymentState.total * 100),
        currency: paymentState.currency,
        name: 'Wolhomes',
        description: `Custom design ${latest.quoteNumber}`,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setStartingQuotePayment(true);
          try {
            const verification = await verifyRazorpayPayment({
              orderId: paymentState.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (!verification.success) {
              setQuotePaymentError(verification.message || 'Payment confirmation is pending. Do not pay again; refresh this request to check status.');
              return;
            }
            router.push(`/order-confirmation?orderId=${encodeURIComponent(paymentState.orderId)}`);
          } finally {
            setStartingQuotePayment(false);
          }
        },
        modal: {
          ondismiss: () => setQuotePaymentMessage('The payment window was closed. Your accepted quote is saved; you can continue payment later.'),
        },
        theme: { color: '#bf4e48' },
      });
      checkout.open();
    } catch (error) {
      setQuotePaymentError(error instanceof Error ? error.message : 'Could not prepare custom-design payment.');
    } finally {
      setStartingQuotePayment(false);
    }
  }

  async function handleVerifyQuoteCrypto() {
    if (!quotePayment || quotePayment.provider !== 'crypto' || !quotePayment.crypto) {
      setQuotePaymentError('Prepare a crypto payment session first.');
      return;
    }
    const txHash = quoteCryptoTxHash.trim();
    if (!txHash) {
      setQuotePaymentError('Enter the transaction hash from your wallet.');
      return;
    }

    setStartingQuotePayment(true);
    setQuotePaymentError(null);
    try {
      const verification = await verifyCryptoPayment({
        orderId: quotePayment.orderId,
        txHash,
        network: quotePayment.crypto.network,
        asset: quotePayment.crypto.asset,
      });
      if (!verification.success || verification.verified === false || verification.data?.verified === false) {
        setQuotePaymentError(verification.message || 'Blockchain payment is not confirmed yet. Do not pay again; double-check the transaction hash and network.');
        return;
      }
      setQuotePaymentMessage('Crypto payment verified successfully. Opening your custom-design order confirmation.');
      router.push(`/order-confirmation?orderId=${encodeURIComponent(quotePayment.orderId)}`);
    } catch (error) {
      setQuotePaymentError(error instanceof Error ? error.message : 'Could not verify the crypto transaction.');
    } finally {
      setStartingQuotePayment(false);
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

                {quotePaymentError && (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    {quotePaymentError}
                  </div>
                )}
                {quotePaymentMessage && (
                  <div className="mb-4 rounded-md border border-[#ded8d0] bg-[#faf9f7] p-3 text-sm leading-6 text-[#6a636b]">
                    {quotePaymentMessage}
                  </div>
                )}

                {latestQuote.status === 'Pending' && (
                  <button
                    onClick={() => handleAcceptQuote(latestQuote.id)}
                    className="w-full rounded-md bg-[#bf4e48] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#a9443e]"
                  >
                    Accept Quote to Continue
                  </button>
                )}

                {latestQuote.status === 'Accepted' && latestQuote.order?.paymentStatus === 'PAID' && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800">
                    Payment received for order {latestQuote.order.orderNumber}. The Wolhomes team can now begin production.
                    <Link
                      href={`/order-confirmation?orderId=${encodeURIComponent(latestQuote.order.id)}`}
                      className="mt-3 block font-semibold underline underline-offset-4"
                    >
                      View order confirmation
                    </Link>
                  </div>
                )}

                {latestQuote.status === 'Accepted' && latestQuote.order?.paymentStatus !== 'PAID' && (
                  <div className="space-y-3">
                    <p className="text-xs leading-5 text-[#6a636b]">
                      Your quote is accepted. Choose a payment gateway and pay the approved amount to place the custom-design order.
                    </p>
                    {quoteProviders.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {quoteProviders.map((provider) => (
                            <button
                              type="button"
                              key={provider}
                              onClick={() => {
                                if (quotePayment && quotePayment.provider !== provider) {
                                  const previousMethod = quotePayment.provider === 'paypal'
                                    ? 'PayPal'
                                    : quotePayment.provider === 'razorpay'
                                      ? 'Razorpay'
                                      : 'Crypto';
                                  if (!confirm(`This quote has an active ${previousMethod} checkout. Switch only if you have not approved or paid through it. The old checkout session will be retired. Continue?`)) return;
                                  setQuotePayment(null);
                                  setQuoteCryptoTxHash('');
                                  setQuotePaymentMessage(null);
                                  setQuotePaymentError(null);
                                }
                                setQuoteProvider(provider);
                              }}
                              disabled={startingQuotePayment}
                              className={`rounded-md border px-3 py-3 text-sm font-semibold uppercase tracking-[0.08em] transition ${
                                quoteProvider === provider
                                  ? 'border-[#bf4e48] bg-[#bf4e48]/5 text-[#bf4e48]'
                                  : 'border-[#ded8d0] bg-white text-[#302b35]'
                              }`}
                            >
                              {provider === 'paypal' ? 'PayPal' : provider === 'crypto' ? 'Crypto' : 'Razorpay'}
                            </button>
                          ))}
                        </div>
                        {quoteProvider === 'crypto' && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label htmlFor="custom-quote-crypto-network" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5d38]">
                                Crypto Network
                              </label>
                              <select
                                id="custom-quote-crypto-network"
                                value={quoteCryptoNetwork}
                                onChange={(e) => {
                                  const network = e.target.value;
                                  const firstForNetwork = quoteCryptoOptions.find((option) => option.network === network);
                                  setQuoteCryptoNetwork(network);
                                  if (firstForNetwork) setQuoteCryptoAsset(firstForNetwork.asset);
                                  setQuoteCryptoTxHash('');
                                }}
                                disabled={startingQuotePayment || quotePayment?.provider === 'crypto'}
                                className="w-full rounded-md border border-[#ded8d0] bg-white px-3 py-3 text-sm text-[#302b35]"
                              >
                                {Array.from(new Set(quoteCryptoOptions.map((option) => option.network))).map((network) => (
                                  <option key={network} value={network}>
                                    {network.charAt(0).toUpperCase() + network.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label htmlFor="custom-quote-crypto-asset" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5d38]">
                                Stablecoin
                              </label>
                              <select
                                id="custom-quote-crypto-asset"
                                value={quoteCryptoAsset}
                                onChange={(e) => {
                                  setQuoteCryptoAsset(e.target.value);
                                  setQuoteCryptoTxHash('');
                                }}
                                disabled={startingQuotePayment || quotePayment?.provider === 'crypto'}
                                className="w-full rounded-md border border-[#ded8d0] bg-white px-3 py-3 text-sm text-[#302b35]"
                              >
                                {quoteCryptoOptions.filter((option) => option.network === quoteCryptoNetwork).map((option) => (
                                  <option key={option.asset} value={option.asset}>{option.asset}</option>
                                ))}
                              </select>
                            </div>
                            <p className="text-xs leading-5 text-[#6a636b] sm:col-span-2">
                              Crypto checkout is available for USD quotes using the configured USDT/USDC networks only.
                            </p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleStartQuotePayment}
                          disabled={startingQuotePayment}
                          className="w-full rounded-md bg-[#bf4e48] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#a9443e] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {startingQuotePayment ? 'Preparing secure payment…' : 'Continue to Secure Payment'}
                        </button>
                        {quotePayment?.provider === 'paypal' && quotePayment.approveUrl && (
                          <a
                            href={quotePayment.approveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full rounded-md border border-[#ded8d0] bg-white px-6 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.08em] text-[#302b35] transition hover:border-[#bf4e48] hover:text-[#bf4e48]"
                          >
                            Open PayPal to Pay
                          </a>
                        )}
                        {quotePayment?.provider === 'crypto' && quotePayment.crypto && (
                          <div className="space-y-4 rounded-md border border-[#ded8d0] bg-[#faf9f7] p-4">
                            <div className="rounded-md border border-[#ded8d0] bg-white p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5d38]">Send exactly</p>
                              <p className="mt-1 font-serif text-2xl text-[#302b35]">
                                {Number(quotePayment.crypto.amount).toFixed(6)} {quotePayment.crypto.asset}
                              </p>
                              <p className="mt-1 text-xs text-[#6a636b]">
                                {quotePayment.crypto.network} network · settlement value in {quotePayment.crypto.currency}
                              </p>
                            </div>
                            <div className="rounded-md border border-[#ded8d0] bg-white p-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5d38]">Receiving address</p>
                              <p className="break-all font-mono text-xs text-[#302b35]">{quotePayment.crypto.address}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(quotePayment.crypto!.address)
                                    .then(() => setQuotePaymentMessage('Wallet address copied. Send only the exact amount on the selected network.'))
                                    .catch(() => setQuotePaymentError('Could not copy automatically. Please select and copy the receiving address.'));
                                }}
                                className="mt-3 rounded-md border border-[#ded8d0] px-3 py-2 text-xs font-semibold text-[#302b35] hover:border-[#bf4e48]"
                              >
                                Copy address
                              </button>
                            </div>
                            <div className="rounded-md border border-[#ded8d0] bg-white p-4 text-center">
                              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5d38]">Scan to pay</p>
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(quotePayment.crypto.qrPayload)}`}
                                alt={`${quotePayment.crypto.asset} payment QR code on ${quotePayment.crypto.network}`}
                                className="mx-auto h-44 w-44 rounded-md border border-[#ded8d0] bg-white p-2"
                              />
                              <p className="mt-3 text-xs text-[#6a636b]">{quotePayment.crypto.asset} · {quotePayment.crypto.network}</p>
                            </div>
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                              <p className="font-semibold">Important</p>
                              <p>{quotePayment.crypto.instructions}</p>
                              <p className="mt-1">Do not send another token or use another network. Payment is not confirmed until blockchain verification succeeds.</p>
                            </div>
                            <div>
                              <label htmlFor="custom-quote-crypto-tx" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5d38]">
                                Transaction hash
                              </label>
                              <input
                                id="custom-quote-crypto-tx"
                                value={quoteCryptoTxHash}
                                onChange={(e) => setQuoteCryptoTxHash(e.target.value)}
                                placeholder="Paste the transaction hash after sending"
                                autoComplete="off"
                                className="w-full rounded-md border border-[#ded8d0] bg-white px-3 py-3 text-sm text-[#302b35] placeholder:text-[#9a9298]"
                                disabled={startingQuotePayment}
                              />
                              <button
                                type="button"
                                onClick={handleVerifyQuoteCrypto}
                                disabled={startingQuotePayment || !quoteCryptoTxHash.trim()}
                                className="mt-3 w-full rounded-md bg-[#302b35] px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#211e24] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {startingQuotePayment ? 'Verifying transaction…' : 'Verify Crypto Payment'}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                        No payment gateway is configured for {latestQuote.currency}. Please contact Wolhomes to arrange payment before production starts.
                      </p>
                    )}
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



