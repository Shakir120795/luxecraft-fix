'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await adminLogin(formData);
      
      // Store tokens
      localStorage.setItem('adminToken', response.accessToken);
      localStorage.setItem('adminRefreshToken', response.refreshToken);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="w-full max-w-md">
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif text-[var(--color-primary)] mb-2">
              LuxeCraft
            </h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
              Admin Panel
            </p>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-serif text-[var(--color-primary)] text-center mb-6">
            Sign In
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-6 border border-red-400 bg-red-50 px-4 py-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="admin@luxecraft.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white py-3 px-6 font-serif text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Help Text */}
          <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
            For security reasons, contact your system administrator if you've forgotten your password.
          </p>
        </div>
      </div>
    </div>
  );
}
