'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import {
  FaqItem,
  CreateFaqRequest,
  createFaq,
  deleteFaq,
  getFaqs,
  updateFaq,
} from '@/lib/api';

const emptyForm: CreateFaqRequest = {
  category: 'Orders & Shipping',
  question: '',
  answer: '',
  sortOrder: 0,
  isActive: true,
};

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [form, setForm] = useState<CreateFaqRequest>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFaqs();
  }, []);

  async function loadFaqs() {
    try {
      setLoading(true);
      setFaqs(await getFaqs());
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(faq: FaqItem) {
    setEditingId(faq.id);
    setForm({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sortOrder,
      isActive: faq.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);

      const saved = editingId
        ? await updateFaq(editingId, form)
        : await createFaq(form);

      setFaqs((current) =>
        editingId
          ? current.map((faq) => (faq.id === editingId ? saved : faq))
          : [...current, saved].sort(
              (a, b) => a.sortOrder - b.sortOrder,
            ),
      );

      resetForm();
    } catch (error) {
      console.error('Failed to save FAQ:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this FAQ?')) return;

    try {
      await deleteFaq(id);
      setFaqs((current) => current.filter((faq) => faq.id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-primary)]">
            FAQ Management
          </h1>
          <p className="mt-1 text-[var(--color-muted)]">
            Create, edit and organize customer-facing frequently asked questions.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                {editingId ? 'Edit FAQ' : 'New FAQ'}
              </p>
              <h2 className="mt-1 text-2xl font-serif text-[var(--color-primary)]">
                {editingId ? 'Update Question' : 'Add a Question'}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                Category
              </label>
              <input
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder ?? 0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value),
                  }))
                }
                className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                Question
              </label>
              <input
                value={form.question}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    question: event.target.value,
                  }))
                }
                className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                Answer
              </label>
              <textarea
                value={form.answer}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    answer: event.target.value,
                  }))
                }
                rows={6}
                className="w-full resize-y border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm leading-6 focus:border-[var(--color-accent)] focus:outline-none"
                required
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Visible on storefront
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--color-accent)] px-7 py-3 text-xs uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update FAQ' : 'Add FAQ'}
            </button>
          </div>
        </form>

        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] px-6 py-5">
            <h2 className="text-2xl font-serif text-[var(--color-primary)]">
              Published FAQs
            </h2>
          </div>

          {loading ? (
            <div className="p-10 text-center text-[var(--color-muted)]">
              Loading FAQs...
            </div>
          ) : faqs.length === 0 ? (
            <div className="p-10 text-center text-[var(--color-muted)]">
              No FAQs created yet.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {faqs.map((faq) => (
                <div key={faq.id} className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="bg-[var(--color-bg)] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--color-accent)]">
                          {faq.category}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">
                          Order {faq.sortOrder}
                        </span>
                        {!faq.isActive && (
                          <span className="bg-gray-100 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-gray-600">
                            Hidden
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-serif text-[var(--color-primary)]">
                        {faq.question}
                      </h3>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-muted)]">
                        {faq.answer}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(faq)}
                        className="border border-[var(--color-border)] px-4 py-2 text-xs uppercase tracking-[0.12em] text-[var(--color-text)] hover:border-[var(--color-accent)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(faq.id)}
                        className="border border-red-200 px-4 py-2 text-xs uppercase tracking-[0.12em] text-red-600 hover:border-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}