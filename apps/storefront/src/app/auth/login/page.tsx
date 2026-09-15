'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login({ email, password });

    if (result.success) {
      router.push(redirectTo);
    } else {
      setError(result.message || 'Login failed');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a5d38]">
            Wolhomes
          </p>
          <h1 className="mb-3 font-serif text-4xl font-light text-[#302b35] sm:text-5xl">
            Welcome Back
          </h1>
          <p className="text-base text-[#6a636b]">
            Sign in to your Wolhomes account
          </p>
        </div>

        <div className="rounded-lg border border-[#ded8d0] bg-white p-6 shadow-sm sm:p-9">
          {error && (
            <div className="mb-6 rounded-md border border-[#bf4e48]/30 bg-[#bf4e48]/5 px-4 py-3 text-sm leading-6 text-[#302b35]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block font-serif text-sm text-[#302b35]">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-[#ded8d0] bg-[#faf9f7] px-4 py-3.5 text-[#302b35] outline-none transition focus:border-[#bf4e48] focus:bg-white"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label htmlFor="password" className="block font-serif text-sm text-[#302b35]">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-[#8a5d38] transition hover:text-[#bf4e48]"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-[#ded8d0] bg-[#faf9f7] px-4 py-3.5 text-[#302b35] outline-none transition focus:border-[#bf4e48] focus:bg-white"
                autoComplete="current-password"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-[#6a636b]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#cfc7bf] text-[#bf4e48] focus:ring-[#bf4e48]"
              />
              Remember me
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#302b35] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#211e24] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#ded8d0]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-[#9a9298]">or</span>
            </div>
          </div>

          <div className="text-center">
            <p className="mb-4 text-sm text-[#6a636b]">Don't have an account?</p>
            <Link
              href={`/auth/register${redirectTo !== '/account' ? `?redirect=${redirectTo}` : ''}`}
              className="inline-block w-full rounded-md border border-[#302b35] bg-white px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-[#302b35] transition hover:bg-[#302b35] hover:text-white"
            >
              Create Account
            </Link>
          </div>
        </div>

        {redirectTo.includes('checkout') && (
          <div className="mt-6 rounded-lg border border-[#ded8d0] bg-white p-6 text-center shadow-sm">
            <p className="mb-3 text-sm text-[#6a636b]">Don't want to create an account?</p>
            <Link
              href="/checkout?guest=true"
              className="text-sm font-medium text-[#8a5d38] underline underline-offset-4 transition hover:text-[#bf4e48]"
            >
              Continue as Guest
            </Link>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-[#6a636b] transition hover:text-[#8a5d38]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8f6f2]">
          <div className="text-center text-[#6a636b]">
            <div className="mx-auto mb-3 h-3 w-3 animate-pulse rounded-full bg-[#8a5d38]" />
            <span className="font-serif">Loading...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
