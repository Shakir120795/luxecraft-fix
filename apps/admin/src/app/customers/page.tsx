'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { getCustomers, updateCustomerStatus, Customer } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      const updated = await updateCustomerStatus(id, !currentStatus);
      setCustomers(customers.map(c => c.id === id ? updated : c));
    } catch (error) {
      console.error('Failed to update customer status:', error);
      alert('Failed to update customer status');
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && customer.isActive) ||
      (filterStatus === 'inactive' && !customer.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[var(--color-primary)]">Customers</h1>
            <p className="text-[var(--color-muted)] mt-1">
              Manage your customer accounts
            </p>
          </div>
          <div className="text-2xl font-serif text-[var(--color-accent)]">
            {customers.length} Total
          </div>
        </div>

        {/* Filters */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Customers Table */}
        {loading ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="animate-pulse text-[var(--color-muted)]">Loading customers...</div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-serif text-[var(--color-primary)] mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No Customers Found' : 'No Customers Yet'}
            </h3>
            <p className="text-[var(--color-muted)]">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Customers will appear here once they register'}
            </p>
          </div>
        ) : (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-[var(--color-bg)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[var(--color-accent)] text-white rounded-full flex items-center justify-center font-serif">
                            {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--color-text)]">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-xs text-[var(--color-muted)]">
                              ID: {customer.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[var(--color-text)]">
                          {customer.email}
                        </div>
                        {customer.phoneNumber && (
                          <div className="text-xs text-[var(--color-muted)]">
                            {customer.phoneNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text)]">
                        {new Date(customer.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text)]">
                        {customer._count?.orders || 0} orders
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium ${
                          customer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-2">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(customer.id, customer.isActive)}
                          className={customer.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                        >
                          {customer.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
            <div>Showing {filteredCustomers.length} of {customers.length} customers</div>
            <div>
              Active: {customers.filter(c => c.isActive).length} | 
              Inactive: {customers.filter(c => !c.isActive).length}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
