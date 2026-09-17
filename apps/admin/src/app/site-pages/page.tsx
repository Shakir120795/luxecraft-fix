'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';

interface SitePage {
  slug: string;
  title: string;
  lastUpdated: string;
  content: string;
}

const PAGE_ORDER = ['privacy', 'terms', 'about', 'returns', 'contact'];

const PAGE_LABELS: Record<string, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  about: 'About',
  returns: 'Returns & Refunds',
  contact: 'Contact',
};

export default function SitePagesPage() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('privacy');
  const [form, setForm] = useState({ title: '', lastUpdated: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const selectedPage = useMemo(
    () => pages.find((page) => page.slug === selectedSlug) ?? null,
    [pages, selectedSlug],
  );

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (!selectedPage) return;
    setForm({
      title: selectedPage.title,
      lastUpdated: selectedPage.lastUpdated,
      content: selectedPage.content,
    });
  }, [selectedPage]);

  async function loadPages() {
    try {
      setLoading(true);
      const data = await adminApi.get<SitePage[]>('/admin/settings/pages');
      setPages(data);
    } catch (error) {
      console.error('Failed to load site pages:', error);
      setMessage('Failed to load site pages.');
    } finally {
      setLoading(false);
    }
  }

  async function savePage() {
    try {
      setSaving(true);
      setMessage('');

      const saved = await adminApi.put<SitePage>(
        `/admin/settings/pages/${selectedSlug}`,
        form,
      );

      setPages((current) =>
        current.map((page) => (page.slug === saved.slug ? saved : page)),
      );
      setMessage(`${PAGE_LABELS[selectedSlug] ?? selectedSlug} saved successfully.`);
    } catch (error) {
      console.error('Failed to save site page:', error);
      setMessage('Failed to save page.');
    } finally {
      setSaving(false);
    }
  }

  function openPreview() {
    window.open(`https://wolhomes.com/${selectedSlug}`, '_blank', 'noopener,noreferrer');
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 bg-[var(--color-border)]" />
          <div className="h-24 bg-[var(--color-border)]" />
          <div className="h-[520px] bg-[var(--color-border)]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[var(--color-primary)]">Site Pages</h1>
            <p className="mt-1 text-[var(--color-muted)]">
              Edit the customer-facing Privacy, Terms, About, Returns and Contact pages.
            </p>
          </div>

          <button
            type="button"
            onClick={openPreview}
            className="border border-[var(--color-primary)] px-5 py-3 text-xs uppercase tracking-[0.15em] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
          >
            Preview Live Page
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Pages
            </p>
            <div className="space-y-1">
              {PAGE_ORDER.map((slug) => {
                const active = slug === selectedSlug;
                const page = pages.find((item) => item.slug === slug);
                const hasOverride = Boolean(page?.content?.trim());

                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => {
                      setSelectedSlug(slug);
                      setMessage('');
                    }}
                    className={`w-full border px-3 py-3 text-left text-sm transition-colors ${
                      active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                        : 'border-transparent text-[var(--color-text)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg)]'
                    }`}
                  >
                    <div>{PAGE_LABELS[slug]}</div>
                    <div className={`mt-1 text-[10px] uppercase tracking-[0.12em] ${active ? 'text-white/70' : 'text-[var(--color-muted)]'}`}>
                      {hasOverride ? 'CMS override active' : 'Using current site page'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-border)] px-6 py-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">Page Editor</p>
              <h2 className="mt-1 text-2xl font-serif text-[var(--color-primary)]">
                {PAGE_LABELS[selectedSlug]}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Existing hardcoded content stays live until you save a CMS override for this page.
              </p>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Page Title</label>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="w-full border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Last Updated</label>
                  <input
                    value={form.lastUpdated}
                    onChange={(event) => setForm((current) => ({ ...current, lastUpdated: event.target.value }))}
                    placeholder="January 1, 2024"
                    className="w-full border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-end justify-between gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)]">Page Content</label>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      Plain text is safest. Use blank lines for paragraphs. Existing site styling is applied automatically.
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-muted)]">{form.content.length} characters</span>
                </div>

                <textarea
                  value={form.content}
                  onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                  rows={26}
                  placeholder={`Write the page content here.\n\nExample:\nOur story begins...\n\nWe believe in timeless craftsmanship...`}
                  className="w-full resize-y border border-[var(--color-border)] bg-white px-4 py-4 text-sm leading-7 outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="flex flex-col gap-4 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-[var(--color-muted)]">
                  URL: <span className="font-medium text-[var(--color-text)]">/{selectedSlug}</span>
                </div>

                <div className="flex items-center gap-3">
                  {message && <p className="text-sm text-[var(--color-muted)]">{message}</p>}
                  <button
                    type="button"
                    onClick={savePage}
                    disabled={saving}
                    className="border border-[var(--color-primary)] bg-[var(--color-primary)] px-6 py-3 text-xs uppercase tracking-[0.15em] text-white disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Page'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
