'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import {
  getCustomRequest,
  updateCustomRequestStatus,
  createQuote,
  sendCustomRequestMessage,
  CustomRequest,
} from '@/lib/api';

const statusOptions = [
  { value: 'SUBMITTED', label: 'PENDING' },
  { value: 'UNDER_REVIEW', label: 'REVIEWING' },
  { value: 'QUOTED', label: 'QUOTED' },
  { value: 'AWAITING_APPROVAL', label: 'AWAITING APPROVAL' },
  { value: 'APPROVED', label: 'ACCEPTED' },
  { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
  { value: 'COMPLETED', label: 'COMPLETED' },
  { value: 'CANCELLED', label: 'CANCELLED' },
];

function getReferenceFileName(fileUrl: string, index: number): string {
  try {
    const url = new URL(fileUrl, 'https://wolhomes.com');
    const originalName = url.searchParams.get('name');
    if (originalName) return originalName;
    const filename = decodeURIComponent(url.pathname.split('/').pop() || '');
    return filename || `Reference file ${index + 1}`;
  } catch {
    return `Reference file ${index + 1}`;
  }
}

function isReferenceImage(fileUrl: string): boolean {
  try {
    const pathname = new URL(fileUrl, 'https://wolhomes.com').pathname;
    return /\.(?:jpe?g|png|webp|gif|avif)$/i.test(pathname);
  } catch {
    return false;
  }
}

export default function CustomRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<CustomRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  // Quote form
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteData, setQuoteData] = useState({
    amount: 0,
    description: '',
  });
  const [creatingQuote, setCreatingQuote] = useState(false);

  // Message form
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadRequest();
  }, [requestId]);

  async function loadRequest() {
    try {
      const data = await getCustomRequest(requestId);
      setRequest(data);
      setNewStatus(data.status);
    } catch (error) {
      console.error('Failed to load request:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!request || newStatus === request.status) return;

    setUpdating(true);
    try {
      const updated = await updateCustomRequestStatus(requestId, newStatus);
      setRequest(updated);
      alert('Status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  function openQuoteForm() {
    setQuoteData({
      amount: request?.quote ? Number(request.quote.amount) : 0,
      description: request?.quote?.description ?? '',
    });
    setShowQuoteForm(true);
  }

  async function handleCreateQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(quoteData.amount) || quoteData.amount <= 0) {
      alert('Enter the final deal amount greater than zero.');
      return;
    }

    const isRevision = Boolean(request?.quote);
    setCreatingQuote(true);
    try {
      await createQuote(requestId, {
        amount: Number(quoteData.amount.toFixed(2)),
        description: quoteData.description.trim(),
      });
      await loadRequest();
      setShowQuoteForm(false);
      setQuoteData({ amount: 0, description: '' });
      alert(
        isRevision
          ? 'Revised quote created. The customer must accept the new amount before paying.'
          : 'Quote created successfully',
      );
    } catch (error) {
      console.error('Failed to create quote:', error);
      alert(error instanceof Error ? error.message : 'Failed to save quote');
    } finally {
      setCreatingQuote(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      await sendCustomRequestMessage(requestId, {
        message: message.trim(),
        isAdminReply: true,
      });
      await loadRequest(); // Reload to get new message
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-[var(--color-border)]" />
          <div className="h-96 bg-[var(--color-border)]" />
        </div>
      </AdminLayout>
    );
  }

  if (!request) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-serif text-[var(--color-primary)] mb-4">Request Not Found</h2>
          <button
            onClick={() => router.push('/custom-requests')}
            className="text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
          >
             Back to Requests
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/custom-requests')}
            className="text-[var(--color-muted)] hover:text-[var(--color-accent)] mb-2 text-sm"
          >
             Back to Custom Requests
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-serif text-[var(--color-primary)]">
                {request.title}
              </h1>
              <p className="text-[var(--color-muted)] mt-1">
                Request #{request.requestNumber}  Submitted {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800`}>
              {statusOptions.find((option) => option.value === request.status)?.label ?? request.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="text-xl font-serif text-[var(--color-primary)] mb-4">
                Request Details
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-[var(--color-text)] mb-2">Description</h3>
                  <p className="text-[var(--color-text)] whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>
                {request.productCategory && (
                  <div>
                    <h3 className="font-medium text-[var(--color-text)] mb-2">Product Category</h3>
                    <p className="text-[var(--color-text)]">{request.productCategory}</p>
                  </div>
                )}
                {request.preferredStyle && (
                  <div>
                    <h3 className="font-medium text-[var(--color-text)] mb-2">Preferred Style</h3>
                    <p className="text-[var(--color-text)]">{request.preferredStyle}</p>
                  </div>
                )}
                {request.designNotes && (
                  <div>
                    <h3 className="font-medium text-[var(--color-text)] mb-2">Additional Design Notes</h3>
                    <p className="whitespace-pre-wrap text-[var(--color-text)]">{request.designNotes}</p>
                  </div>
                )}
                {request.desiredDimensions && (
                  <div>
                    <h3 className="font-medium text-[var(--color-text)] mb-2">Dimensions</h3>
                    <p className="text-[var(--color-text)]">{request.desiredDimensions}</p>
                  </div>
                )}
                {request.preferredColors && (
                  <div>
                    <h3 className="font-medium text-[var(--color-text)] mb-2">Preferred Colors</h3>
                    <p className="text-[var(--color-text)]">{request.preferredColors}</p>
                  </div>
                )}
                {request.preferredMaterials && (
                  <div>
                    <h3 className="font-medium text-[var(--color-text)] mb-2">Preferred Materials</h3>
                    <p className="text-[var(--color-text)]">{request.preferredMaterials}</p>
                  </div>
                )}
                {request.quantity != null && (
                  <div>
                    <h3 className="font-medium text-[var(--color-text)] mb-2">Quantity</h3>
                    <p className="text-[var(--color-text)]">{request.quantity}</p>
                  </div>
                )}
                {request.budget != null && Number.isFinite(Number(request.budget)) && (
                  <div>
                    <h3 className="font-medium text-[var(--color-text)] mb-2">Budget</h3>
                    <p className="text-[var(--color-text)]">
                      ${Number(request.budget).toLocaleString()}
                    </p>
                  </div>
                )}
                {request.timeline && (
                  <div>
                    <h3 className="font-medium text-[var(--color-text)] mb-2">Preferred Timeline</h3>
                    <p className="text-[var(--color-text)]">{request.timeline}</p>
                  </div>
                )}
              </div>
            </div>

            {(request.referenceFiles ?? []).length > 0 && (
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-serif text-[var(--color-primary)]">Reference Images & Files</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Customer uploads related to this custom request. Select an image to open it full size.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {(request.referenceFiles ?? []).map((fileUrl, index) => {
                    const imageFile = isReferenceImage(fileUrl);
                    const fileName = getReferenceFileName(fileUrl, index);
                    return (
                      <a
                        key={fileUrl}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)] transition hover:border-[var(--color-accent)]"
                        aria-label={`Open reference file: ${fileName}`}
                      >
                        {imageFile ? (
                          <img
                            src={fileUrl}
                            alt={`Customer reference ${index + 1}: ${fileName}`}
                            loading="lazy"
                            className="h-32 w-full bg-white object-cover transition group-hover:scale-[1.02] sm:h-40"
                          />
                        ) : (
                          <div className="flex h-32 items-center justify-center bg-[var(--color-border)]/30 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] sm:h-40">
                            File
                          </div>
                        )}
                        <div className="p-3">
                          <p className="truncate text-sm font-medium text-[var(--color-text)]" title={fileName}>{fileName}</p>
                          <p className="mt-1 text-xs text-[var(--color-accent)]">{imageFile ? 'View full image ↗' : 'Open file ↗'}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quote Section */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-[var(--color-primary)]">
                  Quote
                </h2>
                {!showQuoteForm && (
                  <button
                    onClick={openQuoteForm}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white px-4 py-2 text-sm uppercase tracking-wider transition-colors"
                  >
                    {request.quote ? 'Revise Quote' : 'Create Quote'}
                  </button>
                )}
              </div>

              {request.quote && !showQuoteForm ? (
                <div className="border border-[var(--color-border)] bg-[var(--color-bg)] p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-3xl font-serif text-[var(--color-primary)] mb-2">
                        ${Number(request.quote.amount).toLocaleString()}
                      </div>
                      <div className="text-sm text-[var(--color-muted)]">
                        Quote #{request.quote.id.substring(0, 8)}...
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium ${
                      request.quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      request.quote.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.quote.status}
                    </span>
                  </div>
                  <p className="text-[var(--color-text)] whitespace-pre-wrap">
                    {request.quote.description}
                  </p>
                  <div className="mt-4 text-xs text-[var(--color-muted)]">
                    Created {new Date(request.quote.createdAt).toLocaleString()}
                  </div>
                </div>
              ) : showQuoteForm ? (
                <form onSubmit={handleCreateQuote} className="space-y-4">
                  {request.quote && (
                    <p className="border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm text-[var(--color-muted)]">
                      Saving a revision creates a new quote version and retires unpaid checkout sessions for the previous version. The customer must accept the updated total before payment.
                    </p>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      Final Deal Amount (USD) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={quoteData.amount || ''}
                      onChange={(e) => setQuoteData({ ...quoteData, amount: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      value={quoteData.description}
                      onChange={(e) => setQuoteData({ ...quoteData, description: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                      placeholder="Detailed description of the work, materials, timeline, etc."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={creatingQuote}
                      className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white px-6 py-2 text-sm uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      {creatingQuote
                        ? request.quote ? 'Saving Revision...' : 'Creating...'
                        : request.quote ? 'Save Revised Quote' : 'Create Quote'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuoteForm(false);
                        setQuoteData({ amount: 0, description: '' });
                      }}
                      className="border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)] px-6 py-2 text-sm uppercase tracking-wider transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-[var(--color-muted)]">No quote has been created yet</p>
              )}
            </div>

            {/* Messages */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="text-xl font-serif text-[var(--color-primary)] mb-4">
                Messages
              </h2>

              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {request.messages && request.messages.length > 0 ? (
                  request.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 ${
                        msg.isAdminReply
                          ? 'bg-[var(--color-accent)]/10 border-l-4 border-[var(--color-accent)] ml-8'
                          : 'bg-[var(--color-bg)] border-l-4 border-[var(--color-border)] mr-8'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-[var(--color-muted)]">
                          {msg.isAdminReply ? 'Admin' : 'Customer'}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[var(--color-text)] whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--color-muted)] text-center py-8">No messages yet</p>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendMessage} className="space-y-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Type your message to the customer..."
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white px-6 py-2 text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h3 className="font-serif text-lg text-[var(--color-primary)] mb-4">
                Customer
              </h3>
              {request.user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--color-accent)] text-white rounded-full flex items-center justify-center font-serif text-lg">
                      {request.user.firstName.charAt(0)}{request.user.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--color-text)]">
                        {request.user.firstName} {request.user.lastName}
                      </div>
                      <div className="text-sm text-[var(--color-muted)]">
                        {request.user.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/customers/${request.userId}`)}
                    className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
                  >
                    View Customer Profile 
                  </button>
                </div>
              ) : (
                <p className="text-[var(--color-muted)] text-sm">No customer info</p>
              )}
            </div>

            {/* Status Management */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h3 className="font-serif text-lg text-[var(--color-primary)] mb-4">
                Update Status
              </h3>
              <div className="space-y-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
                >
                  {statusOptions.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === request.status}
                  className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white px-6 py-2 text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>

            {/* Request Info */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h3 className="font-serif text-lg text-[var(--color-primary)] mb-4">
                Request Info
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[var(--color-muted)]">Request ID</div>
                  <div className="font-mono text-xs text-[var(--color-text)]">{request.id}</div>
                </div>
                <div>
                  <div className="text-[var(--color-muted)]">Created</div>
                  <div className="text-[var(--color-text)]">
                    {new Date(request.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--color-muted)]">Last Updated</div>
                  <div className="text-[var(--color-text)]">
                    {new Date(request.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
