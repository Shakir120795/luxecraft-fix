'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import {
  ContactMessage,
  getContactMessages,
  updateContactMessageStatus,
} from '@/lib/api';

const statusStyles: Record<string, string> = {
  NEW: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-700',
};

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      const data = await getContactMessages();
      setMessages(data);
    } catch (error) {
      console.error('Failed to load contact messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      setUpdatingId(id);
      const updated = await updateContactMessageStatus(id, status);
      setMessages((current) =>
        current.map((message) => (message.id === id ? updated : message)),
      );
    } catch (error) {
      console.error('Failed to update contact message:', error);
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredMessages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return messages.filter((message) => {
      const matchesSearch =
        !query ||
        message.name.toLowerCase().includes(query) ||
        message.email.toLowerCase().includes(query) ||
        message.subject.toLowerCase().includes(query) ||
        message.message.toLowerCase().includes(query);

      const matchesStatus =
        filterStatus === 'all' || message.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [messages, searchTerm, filterStatus]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[var(--color-primary)]">
              Contact Messages
            </h1>
            <p className="mt-1 text-[var(--color-muted)]">
              Manage customer enquiries and contact requests.
            </p>
          </div>
          <div className="text-2xl font-serif text-[var(--color-accent)]">
            {messages.length} Total
          </div>
        </div>

        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <input
                type="search"
                placeholder="Search by name, email, subject, or message..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="animate-pulse text-[var(--color-muted)]">
              Loading contact messages...
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <h3 className="mb-2 text-xl font-serif text-[var(--color-primary)]">
              {searchTerm || filterStatus !== 'all'
                ? 'No Messages Found'
                : 'No Contact Messages Yet'}
            </h3>
            <p className="text-[var(--color-muted)]">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'New customer enquiries will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <article
                key={message.id}
                className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-serif text-[var(--color-primary)]">
                        {message.subject}
                      </h2>
                      <span
                        className={`px-2 py-1 text-xs font-medium ${
                          statusStyles[message.status] ||
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {message.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {new Date(message.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <select
                    value={message.status}
                    disabled={updatingId === message.id}
                    onChange={(event) =>
                      handleStatusChange(message.id, event.target.value)
                    }
                    className="border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-60"
                  >
                    <option value="NEW">New</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div className="grid gap-5 py-5 md:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      Customer
                    </div>
                    <div className="mt-1 font-medium text-[var(--color-text)]">
                      {message.name}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      Email
                    </div>
                    <a
                      href={`mailto:${message.email}`}
                      className="mt-1 block break-all font-medium text-[var(--color-accent)] hover:underline"
                    >
                      {message.email}
                    </a>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      Phone
                    </div>
                    <div className="mt-1 font-medium text-[var(--color-text)]">
                      {message.phone || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div className="border-t border-[var(--color-border)] pt-5">
                  <div className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    Message
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--color-text)]">
                    {message.message}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}