'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { getCustomRequests, CustomRequest } from '@/lib/api';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEWING: 'bg-blue-100 text-blue-800',
  QUOTED: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-200 text-green-900',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function CustomRequestsPage() {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const data = await getCustomRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load custom requests:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[var(--color-primary)]">Custom Requests</h1>
            <p className="text-[var(--color-muted)] mt-1">
              Manage custom design requests from customers
            </p>
          </div>
          <div className="text-2xl font-serif text-[var(--color-accent)]">
            {requests.length} Total
          </div>
        </div>

        {/* Filters */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="search"
                placeholder="Search by request number, title, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="QUOTED">Quoted</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="animate-pulse text-[var(--color-muted)]">Loading requests...</div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-serif text-[var(--color-primary)] mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No Requests Found' : 'No Custom Requests Yet'}
            </h3>
            <p className="text-[var(--color-muted)]">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Custom design requests will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredRequests.map((request) => (
              <Link
                key={request.id}
                href={`/custom-requests/${request.id}`}
                className="border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-colors p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-serif text-[var(--color-primary)]">
                        {request.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium ${statusColors[request.status] || 'bg-gray-100 text-gray-800'}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--color-muted)]">
                      Request #{request.requestNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[var(--color-muted)]">
                      {new Date(request.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                <p className="text-[var(--color-text)] mb-4 line-clamp-2">
                  {request.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-6 text-sm">
                    {request.user && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[var(--color-accent)] text-white rounded-full flex items-center justify-center text-xs font-serif">
                          {request.user.firstName.charAt(0)}{request.user.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--color-text)]">
                            {request.user.firstName} {request.user.lastName}
                          </div>
                          <div className="text-xs text-[var(--color-muted)]">
                            {request.user.email}
                          </div>
                        </div>
                      </div>
                    )}
                    {request.budget && (
                      <div>
                        <div className="text-[var(--color-muted)]">Budget</div>
                        <div className="font-medium text-[var(--color-text)]">
                          ${Number(request.budget).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {request.timeline && (
                      <div>
                        <div className="text-[var(--color-muted)]">Timeline</div>
                        <div className="font-medium text-[var(--color-text)]">
                          {request.timeline}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]">
                    View Details →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredRequests.length > 0 && (
          <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
            <div>Showing {filteredRequests.length} of {requests.length} requests</div>
            <div className="flex gap-4">
              <span>Pending: {requests.filter(r => r.status === 'PENDING').length}</span>
              <span>Quoted: {requests.filter(r => r.status === 'QUOTED').length}</span>
              <span>In Progress: {requests.filter(r => r.status === 'IN_PROGRESS').length}</span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
