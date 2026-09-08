'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import {
  getAdminProfile,
  getProducts,
  getHero,
  updateHero,
  Admin,
  Product,
  HeroSection,
  getDefaultCurrency,
  updateDefaultCurrency,
} from '@/lib/api';

export default function SettingsPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [hero, setHero] = useState<HeroSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingHero, setSavingHero] = useState(false);
  const [heroMessage, setHeroMessage] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [currencyMessage, setCurrencyMessage] = useState('');
  const [form, setForm] = useState({
    productId: '',
    imageUrl: '',
    eyebrow: 'LuxeCraft Collection',
    title: 'Luxury crafted. Worldwide delivered.',
    subtitle:
      'Exquisite rugs, artisan crafts, and bespoke pieces made by master craftspeople from around the world.',
    primaryCtaText: 'Shop Now',
    primaryCtaLink: '/products',
    secondaryCtaText: 'Bespoke Design',
    secondaryCtaLink: '/custom-design',
    isActive: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);

      const [profile, productList, heroData, currencyData] = await Promise.all([
        getAdminProfile(),
        getProducts(),
        getHero(),
        getDefaultCurrency(),
      ]);

      setAdmin(profile);
      setDefaultCurrency(currencyData);
      setProducts(productList);

      if (heroData) {
        setHero(heroData);
        setForm({
          productId: heroData.productId ?? '',
          imageUrl: heroData.imageUrl ?? '',
          eyebrow: heroData.eyebrow ?? '',
          title: heroData.title ?? '',
          subtitle: heroData.subtitle ?? '',
          primaryCtaText: heroData.primaryCtaText ?? '',
          primaryCtaLink: heroData.primaryCtaLink ?? '/products',
          secondaryCtaText: heroData.secondaryCtaText ?? '',
          secondaryCtaLink: heroData.secondaryCtaLink ?? '/custom-design',
          isActive: heroData.isActive,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleProductChange(productId: string) {
    const product = products.find((item) => item.id === productId);
    const firstImage =
      product?.media?.find((media) => media.isMain)?.url ||
      product?.media?.[0]?.url ||
      '';

    setForm((current) => ({
      ...current,
      productId,
      imageUrl: firstImage,
    }));
  }

  function selectImage(url: string) {
    setForm((current) => ({
      ...current,
      imageUrl: url,
    }));
  }

  async function saveHero() {
    try {
      setSavingHero(true);
      setHeroMessage('');

      const saved = await updateHero({
        productId: form.productId || null,
        imageUrl: form.imageUrl || null,
        eyebrow: form.eyebrow || null,
        title: form.title,
        subtitle: form.subtitle || null,
        primaryCtaText: form.primaryCtaText || null,
        primaryCtaLink: form.primaryCtaLink || null,
        secondaryCtaText: form.secondaryCtaText || null,
        secondaryCtaLink: form.secondaryCtaLink || null,
        isActive: form.isActive,
      });

      setHero(saved);
      setHeroMessage('Hero settings saved successfully.');
    } catch (error) {
      console.error('Failed to save hero:', error);
      setHeroMessage('Failed to save hero settings.');
    } finally {
      setSavingHero(false);
    }
  }

  async function saveCurrency() {
    try {
      setSavingCurrency(true);
      setCurrencyMessage('');
      const saved = await updateDefaultCurrency(defaultCurrency);
      setDefaultCurrency(saved);
      setCurrencyMessage(`Default currency saved as ${saved}.`);
    } catch (error) {
      console.error('Failed to save currency:', error);
      setCurrencyMessage('Failed to save default currency.');
    } finally {
      setSavingCurrency(false);
    }
  }

  const selectedProduct = products.find(
    (product) => product.id === form.productId
  );

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
      <div className="max-w-6xl space-y-8">

        <div>
          <h1 className="text-3xl font-serif text-[var(--color-primary)]">
            Settings
          </h1>
          <p className="mt-1 text-[var(--color-muted)]">
            Manage your admin account, homepage hero and preferences.
          </p>
        </div>

        {/* STORE CURRENCY */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] px-6 py-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Store Preferences
            </p>
            <h2 className="mt-1 text-2xl font-serif text-[var(--color-primary)]">
              Default Currency
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              This is the base currency used for LuxeCraft product pricing.
              Customer prices will be converted to their local currency.
            </p>
          </div>

          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
            <div className="max-w-sm flex-1">
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                Base Currency
              </label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
              >
                <option value="USD">USD ï¿½ US Dollar</option>
                <option value="INR">INR ï¿½ Indian Rupee</option>
                <option value="EUR">EUR ï¿½ Euro</option>
                <option value="GBP">GBP ï¿½ British Pound</option>
                <option value="CAD">CAD ï¿½ Canadian Dollar</option>
                <option value="AUD">AUD ï¿½ Australian Dollar</option>
                <option value="AED">AED ï¿½ UAE Dirham</option>
                <option value="JPY">JPY ï¿½ Japanese Yen</option>
                <option value="SGD">SGD ï¿½ Singapore Dollar</option>
                <option value="CHF">CHF ï¿½ Swiss Franc</option>
              </select>
            </div>

            <button
              type="button"
              onClick={saveCurrency}
              disabled={savingCurrency}
              className="border border-[var(--color-primary)] bg-[var(--color-primary)] px-6 py-3 text-xs uppercase tracking-[0.15em] text-white disabled:opacity-50"
            >
              {savingCurrency ? 'Saving...' : 'Save Currency'}
            </button>

            {currencyMessage && (
              <p className="text-sm text-[var(--color-muted)]">
                {currencyMessage}
              </p>
            )}
          </div>
        </div>
        {/* HERO MANAGEMENT */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Homepage
                </p>
                <h2 className="mt-1 text-2xl font-serif text-[var(--color-primary)]">
                  Hero Management
                </h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Choose the featured product, hero image and homepage messaging.
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      isActive: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                Hero Active
              </label>
            </div>
          </div>

          <div className="grid gap-8 p-6 lg:grid-cols-[1fr_1.05fr]">

            {/* Preview */}
            <div>
              <div className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                Live Preview
              </div>

              <div className="relative min-h-[520px] overflow-hidden bg-[#40372f]">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt={form.title || 'Hero preview'}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#5b4b3e] to-[#211d19]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                <div className="absolute left-6 top-6">
                  <span className="border border-white/60 px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-white">
                    {form.eyebrow || 'LuxeCraft Collection'}
                  </span>
                </div>

                <div className="absolute bottom-7 left-6 right-6 text-white">
                  <h3 className="max-w-xl font-serif text-4xl font-light leading-[0.98]">
                    {form.title || 'Luxury crafted.'}
                  </h3>

                  <p className="mt-4 max-w-lg text-sm leading-6 text-white/80">
                    {form.subtitle ||
                      'Your homepage hero description will appear here.'}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="bg-[#d4a556] px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-black">
                      {form.primaryCtaText || 'Shop Now'}
                    </span>

                    <span className="border border-white/60 px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-white">
                      {form.secondaryCtaText || 'Bespoke Design'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  Featured Product
                </label>
                <select
                  value={form.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="">Select a product</option>
                  {products
                    .filter(
                      (product) =>
                        product.status === 'ACTIVE' || product.isActive
                    )
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                </select>
              </div>

              {selectedProduct?.media?.length ? (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-[var(--color-text)]">
                      Hero Image
                    </label>
                    <span className="text-xs text-[var(--color-muted)]">
                      Click to select
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {selectedProduct.media
                      .filter((media) => media.type === 'IMAGE')
                      .map((media) => (
                        <button
                          key={media.id}
                          type="button"
                          onClick={() => selectImage(media.url)}
                          className={`group relative aspect-square overflow-hidden border ${
                            form.imageUrl === media.url
                              ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]'
                              : 'border-[var(--color-border)]'
                          }`}
                        >
                          <img
                            src={media.url}
                            alt={media.altText || selectedProduct.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {form.imageUrl === media.url && (
                            <span className="absolute left-2 top-2 bg-[var(--color-accent)] px-2 py-1 text-[9px] uppercase tracking-wider text-white">
                              Selected
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  Hero Image URL
                </label>
                <input
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      imageUrl: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="w-full border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  Eyebrow
                </label>
                <input
                  value={form.eyebrow}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      eyebrow: e.target.value,
                    }))
                  }
                  className="w-full border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  Main Heading
                </label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                  className="w-full border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      subtitle: e.target.value,
                    }))
                  }
                  className="w-full resize-none border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                    Primary CTA
                  </label>
                  <input
                    value={form.primaryCtaText}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        primaryCtaText: e.target.value,
                      }))
                    }
                    className="mb-2 w-full border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                    placeholder="Shop Now"
                  />
                  <input
                    value={form.primaryCtaLink}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        primaryCtaLink: e.target.value,
                      }))
                    }
                    className="w-full border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                    placeholder="/products"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                    Secondary CTA
                  </label>
                  <input
                    value={form.secondaryCtaText}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        secondaryCtaText: e.target.value,
                      }))
                    }
                    className="mb-2 w-full border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                    placeholder="Bespoke Design"
                  />
                  <input
                    value={form.secondaryCtaLink}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        secondaryCtaLink: e.target.value,
                      }))
                    }
                    className="w-full border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                    placeholder="/custom-design"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-5">
                <div className="text-sm">
                  {heroMessage && (
                    <span
                      className={
                        heroMessage.includes('success')
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {heroMessage}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={saveHero}
                  disabled={savingHero}
                  className="bg-[var(--color-accent)] px-7 py-3 text-xs uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {savingHero ? 'Saving...' : 'Save Hero'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE INFO */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-6 text-xl font-serif text-[var(--color-primary)]">
            Profile Information
          </h2>

          {admin && (
            <div className="space-y-4">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent)] font-serif text-3xl text-white">
                  {admin.firstName.charAt(0)}
                  {admin.lastName.charAt(0)}
                </div>
                <div>
                  <div className="text-2xl font-serif text-[var(--color-primary)]">
                    {admin.firstName} {admin.lastName}
                  </div>
                  <div className="text-[var(--color-muted)]">{admin.email}</div>
                  <div className="mt-1 text-sm text-[var(--color-accent)]">
                    {admin.role === 'SUPER_ADMIN'
                      ? 'Super Administrator'
                      : 'Administrator'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t border-[var(--color-border)] pt-6">
                <div>
                  <div className="mb-1 text-sm text-[var(--color-muted)]">
                    First Name
                  </div>
                  <div className="text-[var(--color-text)]">{admin.firstName}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-[var(--color-muted)]">
                    Last Name
                  </div>
                  <div className="text-[var(--color-text)]">{admin.lastName}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-[var(--color-muted)]">
                    Email
                  </div>
                  <div className="text-[var(--color-text)]">{admin.email}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-[var(--color-muted)]">
                    Role
                  </div>
                  <div className="text-[var(--color-text)]">
                    {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-[var(--color-muted)]">
                    Account Status
                  </div>
                  <div className="text-[var(--color-text)]">
                    {admin.isActive ? (
                      <span className="text-green-600"> Active</span>
                    ) : (
                      <span className="text-red-600"> Inactive</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-[var(--color-muted)]">
                    Member Since
                  </div>
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

        {/* SYSTEM INFO */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-6 text-xl font-serif text-[var(--color-primary)]">
            System Information
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-[var(--color-border)] py-2">
              <span className="text-[var(--color-muted)]">Application</span>
              <span className="font-medium text-[var(--color-text)]">
                LuxeCraft Admin
              </span>
            </div>
            <div className="flex justify-between border-b border-[var(--color-border)] py-2">
              <span className="text-[var(--color-muted)]">Version</span>
              <span className="font-medium text-[var(--color-text)]">1.0.0</span>
            </div>
            <div className="flex justify-between border-b border-[var(--color-border)] py-2">
              <span className="text-[var(--color-muted)]">Environment</span>
              <span className="font-medium text-[var(--color-text)]">Production</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[var(--color-muted)]">API Status</span>
              <span className="font-medium text-green-600"> Connected</span>
            </div>
          </div>
        </div>

        {/* HELP */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-6 text-xl font-serif text-[var(--color-primary)]">
            Help & Support
          </h2>

          <div className="space-y-4">
            <p className="text-[var(--color-text)]">
              Need assistance? Our support team is here to help you manage your
              store effectively.
            </p>
            <div className="flex gap-4">
              <a
                href="mailto:support@luxecraft.com"
                className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
              >
                 Email Support
              </a>
              <a
                href="#"
                className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
              >
                 Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}




