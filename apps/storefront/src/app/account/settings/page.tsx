'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { changePassword, getCurrentUser, isAuthenticated, logout, updateProfile, User } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login?redirect=/account/settings');
      return;
    }

    const userData = getCurrentUser();
    setUser(userData);
    setLoading(false);
  }, []);

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-luxury-brown">
            <div className="w-4 h-4 bg-luxury-gold rounded-full animate-pulse" />
            <span className="font-serif">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-luxury-cream">
      {/* Header */}
      <div className="bg-luxury-beige border-b border-luxury-sand py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-3">Account Settings</h1>
          <p className="text-luxury-brown text-lg">Manage your profile and preferences</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-luxury-sand bg-luxury-beige p-6 sticky top-24">
              <Link href="/account" className="text-sm text-luxury-gold hover:text-luxury-darkGold underline">
                ← Back to Account
              </Link>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Profile Information */}
            <div className="border border-luxury-sand bg-luxury-beige p-8">
              <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Profile Information</h2>
              
              <ProfileForm user={user} />
            </div>

            {/* Email & Verification */}
            <div className="border border-luxury-sand bg-luxury-beige p-8">
              <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Email & Verification</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-luxury-sand">
                  <div>
                    <p className="text-luxury-charcoal font-medium mb-1">{user.email}</p>
                    <p className="text-sm text-luxury-brown">
                      {user.emailVerified ? (
                        <span className="text-luxury-gold">✓ Verified</span>
                      ) : (
                        <span className="text-luxury-terracotta">Not verified</span>
                      )}
                    </p>
                  </div>
                  {!user.emailVerified && (
                    <Link
                      href={`/auth/verify-email?email=${encodeURIComponent(user.email)}`}
                      className="text-sm text-luxury-gold hover:text-luxury-darkGold underline"
                    >
                      Verify Now →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="border border-luxury-sand bg-luxury-beige p-8">
              <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Change Password</h2>
              
              <PasswordForm />
            </div>

            {/* Account Actions */}
            <div className="border border-luxury-sand bg-luxury-beige p-8">
              <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Account Actions</h2>
              
              <div className="space-y-4">
                <button
                  onClick={handleLogout}
                  className="w-full border border-luxury-sand bg-luxury-cream px-6 py-3 text-luxury-brown hover:border-luxury-gold transition-colors"
                >
                  Logout
                </button>
                
                <button className="w-full border border-luxury-terracotta bg-luxury-terracotta/10 px-6 py-3 text-luxury-terracotta hover:bg-luxury-terracotta/20 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProfileForm({ user }: { user: User }) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    const result = await updateProfile(formData);
    setSubmitting(false);
    setSuccess(result.success);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && (
        <div className="border border-luxury-gold/50 bg-luxury-gold/10 px-4 py-3 text-luxury-charcoal text-sm">
          Profile updated successfully!
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-serif text-luxury-charcoal mb-2">First Name</label>
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="input-luxury"
          />
        </div>
        <div>
          <label className="block text-sm font-serif text-luxury-charcoal mb-2">Last Name</label>
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="input-luxury"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-serif text-luxury-charcoal mb-2">Phone</label>
        <input
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          className="input-luxury"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-luxury px-8 py-3 disabled:opacity-50"
      >
        {submitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);

    const result = await changePassword(formData.currentPassword, formData.newPassword);
    setSubmitting(false);
    if (!result.success) {
      setError(result.message || 'Password change failed');
      return;
    }
    setSuccess(true);
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-4 py-3 text-luxury-charcoal text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="border border-luxury-gold/50 bg-luxury-gold/10 px-4 py-3 text-luxury-charcoal text-sm">
          Password changed successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-serif text-luxury-charcoal mb-2">Current Password</label>
        <input
          name="currentPassword"
          type="password"
          value={formData.currentPassword}
          onChange={handleChange}
          required
          className="input-luxury"
          autoComplete="current-password"
        />
      </div>

      <div>
        <label className="block text-sm font-serif text-luxury-charcoal mb-2">New Password</label>
        <input
          name="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={handleChange}
          required
          className="input-luxury"
          autoComplete="new-password"
        />
        <p className="text-xs text-luxury-brown/70 mt-1">Minimum 8 characters</p>
      </div>

      <div>
        <label className="block text-sm font-serif text-luxury-charcoal mb-2">Confirm New Password</label>
        <input
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="input-luxury"
          autoComplete="new-password"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-luxury px-8 py-3 disabled:opacity-50"
      >
        {submitting ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
}
