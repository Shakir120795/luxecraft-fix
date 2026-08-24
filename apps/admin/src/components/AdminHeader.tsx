'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogout, getAdminProfile, Admin } from '@/lib/api';

export function AdminHeader() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminProfile();
  }, []);

  async function loadAdminProfile() {
    try {
      const profile = await getAdminProfile();
      setAdmin(profile);
    } catch (error) {
      console.error('Failed to load admin profile:', error);
      // If auth fails, redirect to login
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await adminLogout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search / Breadcrumb Area */}
        <div className="flex-1">
          <input
            type="search"
            placeholder="Search products, orders, customers..."
            className="w-full max-w-md px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {/* User Menu */}
        <div className="relative">
          {loading ? (
            <div className="w-10 h-10 bg-[var(--color-border)] animate-pulse rounded-full" />
          ) : admin ? (
            <>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 hover:bg-[var(--color-bg)] px-3 py-2 transition-colors"
              >
                <div className="w-10 h-10 bg-[var(--color-accent)] text-white rounded-full flex items-center justify-center font-serif text-lg">
                  {admin.firstName.charAt(0)}{admin.lastName.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-medium text-[var(--color-text)]">
                    {admin.firstName} {admin.lastName}
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">
                    {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-[var(--color-muted)] transition-transform ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg z-20">
                    <div className="px-4 py-3 border-b border-[var(--color-border)]">
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        {admin.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          router.push('/settings');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
                      >
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
