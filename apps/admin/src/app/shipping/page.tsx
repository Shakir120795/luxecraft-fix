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

type ZoneForm = {
  name: string;
  countries: string;
  isActive: boolean;
};

type MethodForm = {
  zoneId: string;
  name: string;
  description: string;
  deliveryDaysMin: string;
  deliveryDaysMax: string;
  basePrice: string;
  pricePerKg: string;
  freeShippingMin: string;
  isActive: boolean;
  sortOrder: string;
};

const emptyZone: ZoneForm = {
  name: '',
  countries: '',
  isActive: true,
};

const emptyMethod: MethodForm = {
  zoneId: '',
  name: '',
  description: '',
  deliveryDaysMin: '',
  deliveryDaysMax: '',
  basePrice: '0',
  pricePerKg: '0',
  freeShippingMin: '',
  isActive: true,
  sortOrder: '0',
};

function parseCountries(value: string) {
  return [...new Set(
    value
      .split(/[\s,]+/)
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)
      .filter((item) => /^[A-Z]{2}$/.test(item)),
  )];
}

function numberOrUndefined(value: string) {
  if (value.trim() === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export default function ShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [zoneForm, setZoneForm] = useState<ZoneForm>(emptyZone);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);

  const [methodForm, setMethodForm] = useState<MethodForm>(emptyMethod);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [methodZoneId, setMethodZoneId] = useState<string | null>(null);

  useEffect(() => {
    loadZones();
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

  function startEditZone(zone: ShippingZone) {
    setEditingZoneId(zone.id);
    setZoneForm({
      name: zone.name,
      countries: zone.countries.join(', '),
      isActive: zone.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetZoneForm() {
    setEditingZoneId(null);
    setZoneForm(emptyZone);
  }

  async function handleZoneSubmit(event: FormEvent) {
    event.preventDefault();

    const countries = parseCountries(zoneForm.countries);
    if (!zoneForm.name.trim() || countries.length === 0) {
      alert('Enter a zone name and at least one valid ISO country code.');
      return;
    }

    try {
      setSaving(true);

      if (editingZoneId) {
        await updateShippingZone(editingZoneId, {
          name: zoneForm.name,
          countries,
          isActive: zoneForm.isActive,
        });
      } else {
        await createShippingZone({
          name: zoneForm.name,
          countries,
          isActive: zoneForm.isActive,
        });
      }

      resetZoneForm();
      await loadZones();
    } catch (error) {
      console.error('Failed to save shipping zone:', error);
      alert('Failed to save shipping zone.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteZone(zone: ShippingZone) {
    if (!confirm(`Delete "${zone.name}" and all of its shipping methods?`)) return;

    try {
      await deleteShippingZone(zone.id);
      await loadZones();
    } catch (error) {
      console.error('Failed to delete shipping zone:', error);
      alert('Failed to delete shipping zone.');
    }
  }

  function startAddMethod(zoneId: string) {
    setEditingMethodId(null);
    setMethodZoneId(zoneId);
    setMethodForm({ ...emptyMethod, zoneId });
  }

  function startEditMethod(zoneId: string, method: ShippingMethod) {
    setEditingMethodId(method.id);
    setMethodZoneId(zoneId);
    setMethodForm({
      zoneId,
      name: method.name,
      description: method.description ?? '',
      deliveryDaysMin: method.deliveryDaysMin?.toString() ?? '',
      deliveryDaysMax: method.deliveryDaysMax?.toString() ?? '',
      basePrice: method.basePrice.toString(),
      pricePerKg: method.pricePerKg.toString(),
      freeShippingMin: method.freeShippingMin?.toString() ?? '',
      isActive: method.isActive,
      sortOrder: method.sortOrder.toString(),
    });
  }

  function resetMethodForm() {
    setEditingMethodId(null);
    setMethodZoneId(null);
    setMethodForm(emptyMethod);
  }

  async function handleMethodSubmit(event: FormEvent) {
    event.preventDefault();

    if (!methodForm.zoneId || !methodForm.name.trim()) {
      alert('Select a zone and enter a method name.');
      return;
    }

    const basePrice = Number(methodForm.basePrice);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      alert('Base price must be a valid non-negative number.');
      return;
    }

    const payload = {
      zoneId: methodForm.zoneId,
      name: methodForm.name,
      description: methodForm.description || undefined,
      deliveryDaysMin: numberOrUndefined(methodForm.deliveryDaysMin),
      deliveryDaysMax: numberOrUndefined(methodForm.deliveryDaysMax),
      basePrice,
      pricePerKg: numberOrUndefined(methodForm.pricePerKg) ?? 0,
      freeShippingMin:
        methodForm.freeShippingMin.trim() === ''
          ? null
          : numberOrUndefined(methodForm.freeShippingMin),
      isActive: methodForm.isActive,
      sortOrder: numberOrUndefined(methodForm.sortOrder) ?? 0,
    };

    try {
      setSaving(true);

      if (editingMethodId) {
        await updateShippingMethod(editingMethodId, payload);
      } else {
        await createShippingMethod(payload);
      }

      resetMethodForm();
      await loadZones();
    } catch (error) {
      console.error('Failed to save shipping method:', error);
      alert('Failed to save shipping method.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMethod(method: ShippingMethod) {
    if (!confirm(`Delete "${method.name}"?`)) return;

    try {
      await deleteShippingMethod(method.id);
      await loadZones();
    } catch (error) {
      console.error('Failed to delete shipping method:', error);
      alert('Failed to delete shipping method.');
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-primary)]">Shipping</h1>
          <p className="mt-1 text-[var(--color-muted)]">
            Manage country zones and shipping rates for checkout.
          </p>
        </div>

        <form
          onSubmit={handleZoneSubmit}
          className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif text-[var(--color-primary)]">
                {editingZoneId ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Use 2-letter ISO country codes such as US, IN, GB.
              </p>
            </div>
            {editingZoneId && (
              <button
                type="button"
                onClick={resetZoneForm}
                className="text-sm uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-primary)]"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              value={zoneForm.name}
              onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
              placeholder="Zone name"
              className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <input
              value={zoneForm.countries}
              onChange={(e) => setZoneForm({ ...zoneForm, countries: e.target.value })}
              placeholder="US, IN, GB"
              className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <label className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={zoneForm.isActive}
                onChange={(e) => setZoneForm({ ...zoneForm, isActive: e.target.checked })}
              />
              Active zone
            </label>
          </div>

          <button
            disabled={saving}
            className="mt-4 bg-[var(--color-accent)] px-6 py-3 text-sm uppercase tracking-wider text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingZoneId ? 'Save Zone' : 'Add Zone'}
          </button>
        </form>

        {loading ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-[var(--color-muted)]">
            Loading shipping settings...
          </div>
        ) : zones.length === 0 ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <h3 className="text-xl font-serif text-[var(--color-primary)]">
              No Shipping Zones Yet
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Add your first country-based shipping zone above.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <div className="flex flex-col gap-4 border-b border-[var(--color-border)] p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-serif text-[var(--color-primary)]">
                        {zone.name}
                      </h2>
                      <span
                        className={`px-2 py-1 text-xs font-medium ${
                          zone.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {zone.countries.map((country) => (
                        <span
                          key={country}
                          className="border border-[var(--color-border)] px-2 py-1 text-xs uppercase tracking-wider text-[var(--color-muted)]"
                        >
                          {country}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditZone(zone)}
                      className="border border-[var(--color-accent)] px-4 py-2 text-sm uppercase tracking-wider text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone)}
                      className="border border-red-600 px-4 py-2 text-sm uppercase tracking-wider text-red-600 hover:bg-red-600 hover:text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-serif text-[var(--color-primary)]">
                      Shipping Methods
                    </h3>
                    <button
                      onClick={() => startAddMethod(zone.id)}
                      className="bg-[var(--color-accent)] px-4 py-2 text-xs uppercase tracking-wider text-white hover:bg-[var(--color-accent-strong)]"
                    >
                      + Add Method
                    </button>
                  </div>

                  {methodZoneId === zone.id && (
                    <form
                      onSubmit={handleMethodSubmit}
                      className="mb-5 border border-[var(--color-border)] bg-[var(--color-bg)] p-5"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-serif text-[var(--color-primary)]">
                          {editingMethodId ? 'Edit Method' : 'New Shipping Method'}
                        </h4>
                        <button
                          type="button"
                          onClick={resetMethodForm}
                          className="text-xs uppercase tracking-wider text-[var(--color-muted)]"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <input
                          value={methodForm.name}
                          onChange={(e) =>
                            setMethodForm({ ...methodForm, name: e.target.value })
                          }
                          placeholder="Method name"
                          className="border border-[var(--color-border)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                        />
                        <input
                          value={methodForm.description}
                          onChange={(e) =>
                            setMethodForm({ ...methodForm, description: e.target.value })
                          }
                          placeholder="Description"
                          className="border border-[var(--color-border)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                        />
                        <input
                          type="number"
                          min="0"
                          value={methodForm.basePrice}
                          onChange={(e) =>
                            setMethodForm({ ...methodForm, basePrice: e.target.value })
                          }
                          placeholder="Base price"
                          className="border border-[var(--color-border)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                        />
                        <input
                          type="number"
                          min="0"
                          value={methodForm.pricePerKg}
                          onChange={(e) =>
                            setMethodForm({ ...methodForm, pricePerKg: e.target.value })
                          }
                          placeholder="Price per kg"
                          className="border border-[var(--color-border)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                        />
                        <input
                          type="number"
                          min="0"
                          value={methodForm.deliveryDaysMin}
                          onChange={(e) =>
                            setMethodForm({
                              ...methodForm,
                              deliveryDaysMin: e.target.value,
                            })
                          }
                          placeholder="Min delivery days"
                          className="border border-[var(--color-border)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                        />
                        <input
                          type="number"
                          min="0"
                          value={methodForm.deliveryDaysMax}
                          onChange={(e) =>
                            setMethodForm({
                              ...methodForm,
                              deliveryDaysMax: e.target.value,
                            })
                          }
                          placeholder="Max delivery days"
                          className="border border-[var(--color-border)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                        />
                        <input
                          type="number"
                          min="0"
                          value={methodForm.freeShippingMin}
                          onChange={(e) =>
                            setMethodForm({
                              ...methodForm,
                              freeShippingMin: e.target.value,
                            })
                          }
                          placeholder="Free shipping above"
                          className="border border-[var(--color-border)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                        />
                        <input
                          type="number"
                          min="0"
                          value={methodForm.sortOrder}
                          onChange={(e) =>
                            setMethodForm({ ...methodForm, sortOrder: e.target.value })
                          }
                          placeholder="Sort order"
                          className="border border-[var(--color-border)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                        />
                      </div>

                      <label className="mt-4 flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={methodForm.isActive}
                          onChange={(e) =>
                            setMethodForm({ ...methodForm, isActive: e.target.checked })
                          }
                        />
                        Active method
                      </label>

                      <button
                        disabled={saving}
                        className="mt-4 bg-[var(--color-accent)] px-5 py-2.5 text-xs uppercase tracking-wider text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : editingMethodId ? 'Save Method' : 'Add Method'}
                      </button>
                    </form>
                  )}

                  {zone.methods.length === 0 ? (
                    <div className="border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]">
                      No shipping methods configured for this zone.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {zone.methods.map((method) => (
                        <div
                          key={method.id}
                          className="border border-[var(--color-border)] p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="font-serif text-lg text-[var(--color-primary)]">
                                  {method.name}
                                </h4>
                                <span
                                  className={`px-2 py-1 text-xs ${
                                    method.isActive
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {method.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>

                              {method.description && (
                                <p className="mt-1 text-sm text-[var(--color-muted)]">
                                  {method.description}
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--color-muted)]">
                                <span>Base: ${Number(method.basePrice).toFixed(2)}</span>
                                <span>Per kg: ${Number(method.pricePerKg).toFixed(2)}</span>
                                <span>
                                  Delivery:{' '}
                                  {method.deliveryDaysMin ?? method.deliveryDaysMax ?? '-'}
                                  {method.deliveryDaysMin && method.deliveryDaysMax
                                    ? `-${method.deliveryDaysMax}`
                                    : ''}{' '}
                                  days
                                </span>
                                {method.freeShippingMin !== null &&
                                  method.freeShippingMin !== undefined && (
                                    <span>Free above: ${Number(method.freeShippingMin).toFixed(2)}</span>
                                  )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditMethod(zone.id, method)}
                                className="border border-[var(--color-accent)] px-4 py-2 text-xs uppercase tracking-wider text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMethod(method)}
                                className="border border-red-600 px-4 py-2 text-xs uppercase tracking-wider text-red-600 hover:bg-red-600 hover:text-white"
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
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}