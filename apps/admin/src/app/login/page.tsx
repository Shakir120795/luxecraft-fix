'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin, verifyAdminTwoFactor } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [step, setStep] = useState<'credentials' | 'twoFactor'>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (step === 'twoFactor') {
        if (!twoFactorToken || !/^\d{6}$/.test(twoFactorCode)) {
          setError('Enter the 6-digit authenticator code.');
          return;
        }

        await verifyAdminTwoFactor(twoFactorToken, twoFactorCode);
        router.push('/dashboard');
        return;
      }

      const response = await adminLogin(formData);
      if ('requiresTwoFactor' in response && response.requiresTwoFactor) {
        setTwoFactorToken(response.twoFactorToken);
        setTwoFactorCode('');
        setStep('twoFactor');
        return;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="w-full max-w-md">
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif text-[var(--color-primary)] mb-2">
              Wolhomes
            </h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
              Admin Panel
            </p>
          </div>

          <h2 className="text-2xl font-serif text-[var(--color-primary)] text-center mb-6">
            {step === 'twoFactor' ? 'Two-Factor Authentication' : 'Sign In'}
          </h2>

          {error && (
            <div className="mb-6 border border-red-400 bg-red-50 px-4 py-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 'credentials' ? (
              <>
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
                    placeholder="admin@wolhomes.com"
                    autoComplete="username"
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
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white py-3 px-6 font-serif text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="twoFactorCode" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Authenticator Code
                  </label>
                  <input
                    type="text"
                    id="twoFactorCode"
                    required
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] tracking-[0.35em] text-center text-lg focus:outline-none focus:border-[var(--color-accent)]"
                    placeholder="123456"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white py-3 px-6 font-serif text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setStep('credentials');
                    setTwoFactorToken('');
                    setTwoFactorCode('');
                    setError('');
                  }}
                  className="w-full border border-[var(--color-border)] px-4 py-3 text-xs uppercase tracking-wider text-[var(--color-muted)]"
                >
                  Back to Sign In
                </button>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
            For security reasons, contact your system administrator if you've forgotten your password or authenticator device.
          </p>
        </div>
      </div>
    </div>
  );
}
