'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeRegistration, sendEmailVerification, verifyEmail } from '@/lib/api';

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
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [registrationToken, setRegistrationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (name === 'email' && emailVerified) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePhoneNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 15);
    setPhoneNumber(digits);
    setFormData((prev) => ({
      ...prev,
      phone: digits ? phoneCountryCode + digits : '',
    }));
  }

  function handleCountryCodeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    setPhoneCountryCode(code);
    setFormData((prev) => ({
      ...prev,
      phone: phoneNumber ? code + phoneNumber : '',
    }));
  }

  function validateEmail() {
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    return true;
  }

  function validateRegistrationFields() {
    if (!validateEmail()) return false;

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

    if (!validateEmail()) return;

    setSendingOtp(true);

    const result = await sendEmailVerification(formData.email);

    if (result.success) {
      setOtpSent(true);
      setSuccess(
        'Verification code sent. Check your email and enter the 6-digit code below.',
      );
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

    const result = await completeRegistration(registrationToken, {
      password: formData.password,
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      phone: formData.phone || undefined,
    });

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
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#2f6b36]">
            WOLHOMES / ACCOUNT
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-[-0.02em] text-[#28231f] sm:text-5xl">
            Create your account
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#6d655e]">
            Verify your email and then create your Wolhomes account.
          </p>
        </div>

        <div className="border border-[#ded5ca] bg-[#fffdf9] shadow-[0_20px_55px_rgba(48,43,53,0.08)]">
          <div className="border-b border-[#ded5ca] px-6 py-5 sm:px-8">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#2f6b36]">
              Secure registration
            </p>
            <h2 className="mt-1 font-serif text-2xl text-[#28231f]">
              Your details
            </h2>
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

            <form onSubmit={handleCreateAccount} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d655e]">
                  Email address *
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={emailVerified}
                    className="min-w-0 flex-1 border border-[#d8cfc5] bg-white px-4 py-3.5 text-sm text-[#28231f] outline-none transition focus:border-[#2f6b36] disabled:cursor-not-allowed disabled:bg-[#f1eee9]"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || emailVerified}
                    className="shrink-0 bg-[#302b35] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#211e24] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                </div>

                {otpSent && !emailVerified && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="min-w-0 flex-1 border border-[#d8cfc5] bg-white px-4 py-3.5 text-center text-lg font-semibold tracking-[0.28em] text-[#28231f] outline-none transition focus:border-[#2f6b36]"
                      placeholder="6-digit OTP"
                      maxLength={6}
                      autoComplete="one-time-code"
                    />

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otp.length !== 6}
                      className="shrink-0 bg-[#302b35] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#211e24] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {verifyingOtp ? 'Verifying...' : 'Verify Email'}
                    </button>
                  </div>
                )}

                {otpSent && !emailVerified && (
                  <p className="mt-2 text-[10px] leading-5 text-[#77716c]">
                    Didn&apos;t find the OTP in your inbox? Please check your <span className="font-semibold text-[#302b35]">Spam or Junk</span> folder.
                  </p>
                )}

                <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[#77716c]">
                  <span>
                    {emailVerified
                      ? 'Email verified successfully.'
                      : 'We will send a 6-digit code to this email.'}
                  </span>
                  {emailVerified && (
                    <span className="shrink-0 font-bold uppercase tracking-[0.12em] text-[#2f6b36]">
                      Verified
                    </span>
                  )}
                </div>
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
                    className="w-full border border-[#d8cfc5] bg-white px-4 py-3.5 text-sm text-[#28231f] outline-none transition focus:border-[#2f6b36] disabled:cursor-not-allowed disabled:bg-[#f1eee9]"
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
                    className="w-full border border-[#d8cfc5] bg-white px-4 py-3.5 text-sm text-[#28231f] outline-none transition focus:border-[#2f6b36] disabled:cursor-not-allowed disabled:bg-[#f1eee9]"
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
                    className="w-full border border-[#d8cfc5] bg-white px-4 py-3.5 text-sm text-[#28231f] outline-none transition focus:border-[#2f6b36] disabled:cursor-not-allowed disabled:bg-[#f1eee9]"
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
                    required
                    className="w-full border border-[#d8cfc5] bg-white px-4 py-3.5 text-sm text-[#28231f] outline-none transition focus:border-[#2f6b36] disabled:cursor-not-allowed disabled:bg-[#f1eee9]"
                    autoComplete="new-password"
                  />
                  <p className="mt-1.5 text-[10px] text-[#77716c]">
                    8+ characters with uppercase, lowercase and a number.
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
                    required
                    className="w-full border border-[#d8cfc5] bg-white px-4 py-3.5 text-sm text-[#28231f] outline-none transition focus:border-[#2f6b36] disabled:cursor-not-allowed disabled:bg-[#f1eee9]"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="border-t border-[#ded5ca] pt-5">
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
                    </Link>.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading || !emailVerified || !registrationToken}
                  className="mt-5 w-full bg-[#302b35] px-8 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#211e24] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loading ? 'Creating Account...' : emailVerified ? 'Create Account' : 'Verify Email to Continue'}
                </button>
              </div>
            </form>

            <div className="mt-7 border-t border-[#ded5ca] pt-5 text-center">
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
