'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import {
  Coupon,
  CouponRequest,
  getCoupons,
  createCoupon,
  updateCoupon,
  deactivateCoupon,
} from '@/lib/api';

type CouponForm = {
  code: string;
  discountType: string;
  discountValue: string;
  validFrom: string;
  validTo: string;
  minOrderAmount: string;
  maxUsageCount: string;
  maxPerCustomer: string;
};

const emptyForm: CouponForm = {
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  validFrom: '',
  validTo: '',
  minOrderAmount: '',
  maxUsageCount: '',
  maxPerCustomer: '',
};

function numberOrUndefined(value: string) {
  if (value.trim() === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    try {
      setLoading(true);
      const result = await getCoupons();
      setCoupons(result.items);
    } catch (error) {
      console.error('Failed to load coupons:', error);
      alert('Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(coupon: Coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      validFrom: coupon.validFrom.slice(0, 16),
      validTo: coupon.validTo ? coupon.validTo.slice(0, 16) : '',
      minOrderAmount:
        coupon.minOrderAmount === null ? '' : String(coupon.minOrderAmount),
      maxUsageCount:
        coupon.maxUsageCount === null ? '' : String(coupon.maxUsageCount),
      maxPerCustomer:
        coupon.maxPerCustomer === null ? '' : String(coupon.maxPerCustomer),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.code.trim()) {
      alert('Enter a coupon code.');
      return;
    }

    const discountValue = Number(form.discountValue);

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      alert('Discount value must be greater than 0.');
      return;
    }

    if (form.discountType === 'PERCENTAGE' && discountValue > 100) {
      alert('Percentage discount cannot be greater than 100.');
      return;
    }

    if (!form.validFrom) {
      alert('Select a valid-from date.');
      return;
    }

    const payload: CouponRequest = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue,
      validFrom: new Date(form.validFrom).toISOString(),
      validTo: form.validTo
        ? new Date(form.validTo).toISOString()
        : undefined,
      minOrderAmount: numberOrUndefined(form.minOrderAmount),
      maxUsageCount: numberOrUndefined(form.maxUsageCount),
      maxPerCustomer: numberOrUndefined(form.maxPerCustomer),
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateCoupon(editingId, payload);
      } else {
        await createCoupon(payload);
      }

      resetForm();
      await loadCoupons();
    } catch (error) {
      console.error('Failed to save coupon:', error);
      alert('Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(coupon: Coupon) {
    if (!confirm(`Deactivate "${coupon.code}"?`)) return;

    try {
      await deactivateCoupon(coupon.id);
      await loadCoupons();
    } catch (error) {
      console.error('Failed to deactivate coupon:', error);
      alert('Failed to deactivate coupon.');
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-primary)]">
            Coupons
          </h1>
          <p className="mt-1 text-[var(--color-muted)]">
            Create and manage discount codes for your store.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif text-[var(--color-primary)]">
                {editingId ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Configure the discount and usage limits.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-primary)]"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Coupon code"
              className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm uppercase outline-none focus:border-[var(--color-accent)]"
            />

            <select
              value={form.discountType}
              onChange={(e) =>
                setForm({ ...form, discountType: e.target.value })
              }
              className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed Amount</option>
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.discountValue}
              onChange={(e) =>
                setForm({ ...form, discountValue: e.target.value })
              }
              placeholder="Discount value"
              className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.minOrderAmount}
              onChange={(e) =>
                setForm({ ...form, minOrderAmount: e.target.value })
              }
              placeholder="Minimum order"
              className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--color-muted)]">
                Valid from
              </label>
              <input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) =>
                  setForm({ ...form, validFrom: e.target.value })
                }
                className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--color-muted)]">
                Valid to
              </label>
              <input
                type="datetime-local"
                value={form.validTo}
                onChange={(e) =>
                  setForm({ ...form, validTo: e.target.value })
                }
                className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <input
              type="number"
              min="1"
              value={form.maxUsageCount}
              onChange={(e) =>
                setForm({ ...form, maxUsageCount: e.target.value })
              }
              placeholder="Maximum uses"
              className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />

            <input
              type="number"
              min="1"
              value={form.maxPerCustomer}
              onChange={(e) =>
                setForm({ ...form, maxPerCustomer: e.target.value })
              }
              placeholder="Uses per customer"
              className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <button
            disabled={saving}
            className="mt-5 bg-[var(--color-accent)] px-6 py-3 text-sm uppercase tracking-wider text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Save Coupon' : 'Create Coupon'}
          </button>
        </form>

        {loading ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-[var(--color-muted)]">
            Loading coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <h3 className="text-xl font-serif text-[var(--color-primary)]">
              No Coupons Yet
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Create your first coupon above.
            </p>
          </div>
        ) : (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-border)] p-6">
              <h2 className="text-xl font-serif text-[var(--color-primary)]">
                Coupon List
              </h2>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold tracking-wider text-[var(--color-primary)]">
                        {coupon.code}
                      </h3>

                      <span
                        className={`px-2 py-1 text-xs font-medium ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {coupon.discountType === 'PERCENTAGE'
                        ? `${coupon.discountValue}% off`
                        : `${coupon.currency} ${coupon.discountValue} off`}
                      {coupon.minOrderAmount !== null &&
                        `  Min order ${coupon.currency} ${coupon.minOrderAmount}`}
                    </p>

                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      Valid {formatDate(coupon.validFrom)}
                      {coupon.validTo
                        ? `  ${formatDate(coupon.validTo)}`
                        : '  No expiry'}
                      {'  '}
                      Used {coupon.usedCount}
                      {coupon.maxUsageCount !== null
                        ? ` / ${coupon.maxUsageCount}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(coupon)}
                      className="border border-[var(--color-accent)] px-4 py-2 text-sm uppercase tracking-wider text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
                    >
                      Edit
                    </button>

                    {coupon.isActive && (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(coupon)}
                        className="border border-red-600 px-4 py-2 text-sm uppercase tracking-wider text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
