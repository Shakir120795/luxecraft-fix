'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { getAdminProfile, Admin } from '@/lib/api';

export default function SettingsPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const profile = await getAdminProfile();
      setAdmin(profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
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

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-primary)]">Settings</h1>
          <p className="text-[var(--color-muted)] mt-1">
            Manage your admin account and preferences
          </p>
        </div>

        {/* Profile Info */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-serif text-[var(--color-primary)] mb-6">
            Profile Information
          </h2>

          {admin && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-[var(--color-accent)] text-white rounded-full flex items-center justify-center font-serif text-3xl">
                  {admin.firstName.charAt(0)}{admin.lastName.charAt(0)}
                </div>
                <div>
                  <div className="text-2xl font-serif text-[var(--color-primary)]">
                    {admin.firstName} {admin.lastName}
                  </div>
                  <div className="text-[var(--color-muted)]">{admin.email}</div>
                  <div className="text-sm text-[var(--color-accent)] mt-1">
                    {admin.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[var(--color-border)]">
                <div>
                  <div className="text-sm text-[var(--color-muted)] mb-1">First Name</div>
                  <div className="text-[var(--color-text)]">{admin.firstName}</div>
                </div>
                <div>
                  <div className="text-sm text-[var(--color-muted)] mb-1">Last Name</div>
                  <div className="text-[var(--color-text)]">{admin.lastName}</div>
                </div>
                <div>
                  <div className="text-sm text-[var(--color-muted)] mb-1">Email</div>
                  <div className="text-[var(--color-text)]">{admin.email}</div>
                </div>
                <div>
                  <div className="text-sm text-[var(--color-muted)] mb-1">Role</div>
                  <div className="text-[var(--color-text)]">
                    {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[var(--color-muted)] mb-1">Account Status</div>
                  <div className="text-[var(--color-text)]">
                    {admin.isActive ? (
                      <span className="text-green-600">✓ Active</span>
                    ) : (
                      <span className="text-red-600">✗ Inactive</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[var(--color-muted)] mb-1">Member Since</div>
                  <div className="text-[var(--color-text)]">
                    {new Date(admin.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-serif text-[var(--color-primary)] mb-6">
            System Information
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-muted)]">Application</span>
              <span className="text-[var(--color-text)] font-medium">LuxeCraft Admin</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-muted)]">Version</span>
              <span className="text-[var(--color-text)] font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-muted)]">Environment</span>
              <span className="text-[var(--color-text)] font-medium">Production</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[var(--color-muted)]">API Status</span>
              <span className="text-green-600 font-medium">● Connected</span>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-serif text-[var(--color-primary)] mb-6">
            Help & Support
          </h2>

          <div className="space-y-4">
            <p className="text-[var(--color-text)]">
              Need assistance? Our support team is here to help you manage your store effectively.
            </p>
            <div className="flex gap-4">
              <a
                href="mailto:support@luxecraft.com"
                className="text-[var(--color-accent)] hover:text-[var(--color-accent-strong)] text-sm"
              >
                → Email Support
              </a>
              <a
                href="#"
                className="text-[var(--color-accent)] hover:text-[var(--color-accent-strong)] text-sm"
              >
                → Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
