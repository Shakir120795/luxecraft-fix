'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeRegistration, register, verifyEmail } from '@/lib/api';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/account';
  const loginHref = redirectTo !== '/account'
    ? '/auth/login?redirect=' + encodeURIComponent(redirectTo)
    : '/auth/login';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [registrationToken, setRegistrationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (name === 'email' && (otpSent || emailVerified)) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validateRegistrationFields() {
    if (!formData.email) {
      setError('Please enter your email address.');
      return false;
    }

    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  }

  async function handleSendOtp() {
    setError(null);
    setSuccess(null);

    if (!validateRegistrationFields()) return;

    setSendingOtp(true);

    const result = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      phone: formData.phone || undefined,
    });

    if (result.success) {
      setOtpSent(true);
      setSuccess('Verification code sent. Check your email and enter the 6-digit code below.');
    } else {
      setError(result.message || 'Unable to send verification code.');
    }

    setSendingOtp(false);
  }

  async function handleVerifyOtp() {
    setError(null);
    setSuccess(null);

    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setVerifyingOtp(true);

    const result = await verifyEmail({
      email: formData.email,
      code: otp,
    });

    if (result.success && result.registrationToken) {
      setRegistrationToken(result.registrationToken);
      setEmailVerified(true);
      setSuccess('Email verified successfully. You can now create your Wolhomes account.');
    } else if (result.success) {
      setSuccess('Email verified successfully. This email already belongs to an account. Please sign in.');
      setTimeout(() => router.push(loginHref), 1200);
    } else {
      setError(result.message || 'Verification failed.');
    }

    setVerifyingOtp(false);
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!emailVerified || !registrationToken) {
      setError('Please verify your email before creating your account.');
      return;
    }

    setLoading(true);

    const result = await completeRegistration(registrationToken);

    if (result.success) {
      const nextUrl = loginHref + (loginHref.includes('?') ? '&' : '?') + 'registered=1';
      router.push(nextUrl);
      return;
    }

    setError(result.message || 'Unable to create your account.');
    setLoading(false);
  }

  return (
    <main className="min-h-[calc(100vh-78px)] bg-[#f4f0eb] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#2f6b36]">
            WOLHOMES / ACCOUNT
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-[-0.02em] text-[#28231f] sm:text-5xl">
            Create your account
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6d655e]">
            Verify your email first. Your Wolhomes account is created only after the email is confirmed.
          </p>
        </div>

        <div className="overflow-hidden border border-[#ded5ca] bg-[#fffdf9] shadow-[0_20px_55px_rgba(48,43,53,0.08)]">
          <div className="border-b border-[#ded5ca] bg-[#28231f] px-6 py-5 text-white sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#d4a556]">
                  Secure registration
                </p>
                <p className="mt-1 font-serif text-xl">One quick email check</p>
              </div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.16em]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25">1</span>
                <span className="hidden text-white/45 sm:inline">→</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25">2</span>
                <span className="hidden text-white/45 sm:inline">→</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25">3</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 border border-[#b94740]/30 bg-[#b94740]/8 px-4 py-3 text-sm text-[#54201d]">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 border border-[#2f6b36]/25 bg-[#2f6b36]/8 px-4 py-3 text-sm text-[#214a27]">
                {success}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-7">
              <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#2f6b36]">
                      Step 01
                    </p>
                    <h2 className="mt-1 font-serif text-2xl text-[#28231f]">Verify your email</h2>
                  </div>

                  {emailVerified && (
                    <span className="border border-[#2f6b36]/20 bg-[#2f6b36]/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#2f6b36]">
                      Verified
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-[#ded5ca] bg-[#f8f5f0] p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label htmlFor="email" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d655e]">
                        Email address *
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={otpSent || emailVerified}
                        className="w-full border border-[#d8cfc5] bg-white px-4 py-3.5 text-sm text-[#28231f] outline-none transition focus:border-[#2f6b36] disabled:cursor-not-allowed disabled:bg-[#f1eee9]"
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || emailVerified}
                      className="shrink-0 bg-[#d4a556] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#28231f] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  </div>

                  {otpSent && !emailVerified && (
                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#ded5ca] pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
                      <div>
                        <label htmlFor="otp" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d655e]">
                          Verification code
                        </label>
                        <input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full border border-[#d8cfc5] bg-white px-4 py-3.5 text-center text-xl font-semibold tracking-[0.28em] text-[#28231f] outline-none transition focus:border-[#2f6b36]"
                          placeholder="000000"
                          maxLength={6}
                          autoComplete="one-time-code"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otp.length !== 6}
                        className="bg-[#2f6b36] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#28231f] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {verifyingOtp ? 'Verifying...' : 'Verify Email'}
                      </button>
                    </div>
                  )}

                  <p className="mt-3 text-[11px] leading-5 text-[#77716c]">
                    {emailVerified
                      ? 'This email has been confirmed. You can now complete the account creation.'
                      : 'Enter your email and request a one-time 6-digit code. The code expires shortly.'}
                  </p>
                </div>
              </section>

              <section>
                <div className="mb-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#2f6b36]">
                    Step 02
                  </p>
                  <h2 className="mt-1 font-serif text-2xl text-[#28231f]">Your details</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d655e]">
                      First name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={otpSent || emailVerified}
                      className="w-full border border-[#d8cfc5] bg-white px-4 py-3.5 text-sm text-[#28231f] outline-none transition focus:border-[#2f6b36]"
                      placeholder="John"
                      autoComplete="given-name"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d655e]">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={otpSent || emailVerified}
                      className="w-full border border-[#d8cfc5] bg-white px-4 py-3.5 text-sm text-[#28231f] outline-none transition focus:border-[#2f6b36]"
                      placeholder="Doe"
                      autoComplete="family-name"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d655e]">
                      Phone number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={otpSent || emailVerified}
                      className="w-full border border-[#d8cfc5] bg-white px-4 py-3.5 text-sm text-[#28231f] outline-none transition focus:border-[#2f6b36]"
                      placeholder="+1 (555) 000-0000"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="hidden sm:block" />

                  <div>
                    <label htmlFor="password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d655e]">
                      Password *
                    </label>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={otpSent || emailVerified}
                      required
                      className="w-full border border-[#d8cfc5] bg-white px-4 py-3.5 text-sm text-[#28231f] outline-none transition focus:border-[#2f6b36]"
                      autoComplete="new-password"
                    />
                    <p className="mt-1.5 text-[10px] text-[#77716c]">
                      Minimum 8 characters, including uppercase, lowercase and a number. Complete these details before sending the OTP.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d655e]">
                      Confirm password *
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={otpSent || emailVerified}
                      required
                      className="w-full border border-[#d8cfc5] bg-white px-4 py-3.5 text-sm text-[#28231f] outline-none transition focus:border-[#2f6b36]"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-[#ded5ca] pt-6">
                <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#2f6b36]">
                  Step 03
                </p>

                <label className="flex items-start gap-3">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 accent-[#2f6b36]"
                  />
                  <span className="text-sm leading-6 text-[#6d655e]">
                    I agree to the{' '}
                    <Link href="/terms" className="font-medium text-[#2f6b36] underline underline-offset-2">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="font-medium text-[#2f6b36] underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading || !emailVerified || !registrationToken}
                  className="mt-6 w-full bg-[#d4a556] px-8 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition hover:bg-[#28231f] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loading ? 'Creating Account...' : emailVerified ? 'Create Account' : 'Verify Email to Continue'}
                </button>
              </section>
            </form>

            <div className="mt-8 border-t border-[#ded5ca] pt-6 text-center">
              <p className="text-sm text-[#6d655e]">Already have an account?</p>
              <Link
                href={loginHref}
                className="mt-2 inline-block text-[10px] font-bold uppercase tracking-[0.16em] text-[#2f6b36] underline underline-offset-4"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.14em] text-[#6d655e] transition hover:text-[#2f6b36]"
          >
            Back to Wolhomes
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f0eb] flex items-center justify-center text-sm text-[#6d655e]">
          Loading...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
