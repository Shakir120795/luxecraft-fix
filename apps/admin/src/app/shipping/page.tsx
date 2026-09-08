'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import {
  ShippingZone,
  ShippingMethod,
  getShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
} from '@/lib/api';

type CountryForm = {
  country: string;
  rate: string;
  deliveryDays: string;
  isActive: boolean;
};

const CURRENCIES: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  AU: 'AUD',
  AE: 'AED',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  JP: 'JPY',
  SG: 'SGD',
  NZ: 'NZD',
  CH: 'CHF',
  CN: 'CNY',
};

const SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  CAD: 'C$',
  GBP: '£',
  AUD: 'A$',
  AED: 'د.إ',
  EUR: '€',
  JPY: '¥',
  SGD: 'S$',
  NZD: 'NZ$',
  CHF: 'CHF ',
  CNY: '¥',
};

function currencyForCountry(country: string) {
  return CURRENCIES[country.toUpperCase()] ?? 'USD';
}

function emptyForm(): CountryForm {
  return {
    country: '',
    rate: '',
    deliveryDays: '7',
    isActive: true,
  };
}

export default function ShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [form, setForm] = useState<CountryForm>(emptyForm());
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadZones();
  }, []);

  async function loadZones() {
    try {
      setLoading(true);
      setZones(await getShippingZones());
    } catch (error) {
      console.error('Failed to load shipping zones:', error);
      alert('Failed to load shipping settings.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingZoneId(null);
    setEditingMethodId(null);
    setForm(emptyForm());
  }

  function startEdit(zone: ShippingZone) {
    const country = zone.countries[0] ?? '';
    const method = zone.methods[0];

    setEditingZoneId(zone.id);
    setEditingMethodId(method?.id ?? null);
    setForm({
      country,
      rate: method ? String(Number(method.basePrice)) : '',
      deliveryDays: method
        ? String(method.deliveryDaysMax ?? method.deliveryDaysMin ?? 7)
        : '7',
      isActive: zone.isActive,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const country = form.country.trim().toUpperCase();
    const rate = Number(form.rate);
    const days = Number(form.deliveryDays);

    if (!/^[A-Z]{2}$/.test(country)) {
      alert('Enter a valid 2-letter ISO country code, e.g. IN, US, CA.');
      return;
    }

    if (!Number.isFinite(rate) || rate < 0) {
      alert('Enter a valid shipping rate.');
      return;
    }

    if (!Number.isFinite(days) || days < 1) {
      alert('Enter valid delivery days.');
      return;
    }

    try {
      setSaving(true);

      if (editingZoneId) {
        const zone = zones.find((item) => item.id === editingZoneId);
        const existingMethod = zone?.methods.find((item) => item.id === editingMethodId);

        await updateShippingZone(editingZoneId, {
          name: country,
          countries: [country],
          isActive: form.isActive,
        });

        if (existingMethod) {
          await updateShippingMethod(existingMethod.id, {
            zoneId: editingZoneId,
            name: `${country} Shipping`,
            description: `Shipping to ${country}`,
            deliveryDaysMin: days,
            deliveryDaysMax: days,
            basePrice: rate,
            pricePerKg: 0,
            freeShippingMin: null,
            isActive: form.isActive,
            sortOrder: 1,
          });
        } else {
          await createShippingMethod({
            zoneId: editingZoneId,
            name: `${country} Shipping`,
            description: `Shipping to ${country}`,
            deliveryDaysMin: days,
            deliveryDaysMax: days,
            basePrice: rate,
            pricePerKg: 0,
            freeShippingMin: null,
            isActive: form.isActive,
            sortOrder: 1,
          });
        }
      } else {
        const zone = await createShippingZone({
          name: country,
          countries: [country],
          isActive: form.isActive,
        });

        await createShippingMethod({
          zoneId: zone.id,
          name: `${country} Shipping`,
          description: `Shipping to ${country}`,
          deliveryDaysMin: days,
          deliveryDaysMax: days,
          basePrice: rate,
          pricePerKg: 0,
          freeShippingMin: null,
          isActive: form.isActive,
          sortOrder: 1,
        });
      }

      resetForm();
      await loadZones();
    } catch (error) {
      console.error('Failed to save shipping country:', error);
      alert('Failed to save shipping country.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(zone: ShippingZone) {
    if (!confirm(`Delete shipping for ${zone.countries.join(', ')}?`)) return;

    try {
      await deleteShippingZone(zone.id);
      await loadZones();
    } catch (error) {
      console.error('Failed to delete shipping country:', error);
      alert('Failed to delete shipping country.');
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-primary)]">Shipping</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Add one shipping rate for each country. Currency is selected automatically.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif text-[var(--color-primary)]">
                {editingZoneId ? 'Edit Country Shipping' : 'Add Country Shipping'}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Example: IN + 100 = ₹100, US + 50 = $50, CA + 50 = C$50.
              </p>
            </div>

            {editingZoneId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs uppercase tracking-wider text-[var(--color-muted)]"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
              maxLength={2}
              placeholder="Country code (IN)"
              className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm uppercase outline-none focus:border-[var(--color-accent)]"
            />

            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="Shipping rate"
                className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
              />
              {form.country && (
                <span className="absolute right-3 top-3 text-xs text-[var(--color-muted)]">
                  {SYMBOLS[currencyForCountry(form.country)] ?? '$'}
                </span>
              )}
            </div>

            <input
              type="number"
              min="1"
              value={form.deliveryDays}
              onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
              placeholder="Delivery days"
              className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />

            <label className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
          </div>

          {form.country && (
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              Currency: {currencyForCountry(form.country)}
            </p>
          )}

          <button
            disabled={saving}
            className="mt-4 bg-[var(--color-accent)] px-6 py-3 text-sm uppercase tracking-wider text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingZoneId ? 'Save Country Rate' : 'Add Country Rate'}
          </button>
        </form>

        {loading ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-sm text-[var(--color-muted)]">
            Loading shipping settings...
          </div>
        ) : zones.length === 0 ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <h3 className="text-xl font-serif text-[var(--color-primary)]">
              No Country Shipping Rates
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Add your first country shipping rate above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {zones.map((zone) => {
              const method: ShippingMethod | undefined = zone.methods[0];
              const country = zone.countries[0] ?? '';
              const currency = currencyForCountry(country);
              const symbol = SYMBOLS[currency] ?? '$';
              const rate = method ? Number(method.basePrice) : 0;
              const days = method?.deliveryDaysMax ?? method?.deliveryDaysMin ?? null;

              return (
                <div
                  key={zone.id}
                  className="border border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-serif text-[var(--color-primary)]">
                          {country}
                        </h2>

                        <span
                          className={`px-2 py-1 text-xs ${
                            zone.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-6 text-sm text-[var(--color-muted)]">
                        <span>
                          Rate: {symbol}{rate.toFixed(2)}
                        </span>
                        <span>Currency: {currency}</span>
                        {days && <span>Delivery: {days} days</span>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(zone)}
                        className="border border-[var(--color-accent)] px-4 py-2 text-xs uppercase tracking-wider text-[var(--color-accent)]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(zone)}
                        className="border border-red-600 px-4 py-2 text-xs uppercase tracking-wider text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
