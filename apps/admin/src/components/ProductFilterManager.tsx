'use client';

import { useEffect, useState } from 'react';
import {
  getProductFilters,
  updateProductFilters,
  ProductFilterSetting,
} from '@/lib/api';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function blankAttribute(sortOrder: number): ProductFilterSetting {
  return {
    slug: '',
    name: '',
    sortOrder,
    isActive: true,
    values: [],
  };
}

export function ProductFilterManager() {
  const [filters, setFilters] = useState<ProductFilterSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setMessage('');
      setFilters(await getProductFilters());
    } catch (error) {
      console.error(error);
      setMessage('Failed to load product filters.');
    } finally {
      setLoading(false);
    }
  }

  function updateAttribute(index: number, changes: Partial<ProductFilterSetting>) {
    setFilters((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    );
  }

  function updateValue(
    attributeIndex: number,
    valueIndex: number,
    changes: Partial<ProductFilterSetting['values'][number]>,
  ) {
    setFilters((current) =>
      current.map((attribute, index) =>
        index !== attributeIndex
          ? attribute
          : {
              ...attribute,
              values: attribute.values.map((value, index2) =>
                index2 === valueIndex ? { ...value, ...changes } : value,
              ),
            },
      ),
    );
  }

  function addAttribute() {
    setFilters((current) => [
      ...current,
      blankAttribute(current.length),
    ]);
  }

  function removeAttribute(index: number) {
    setFilters((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function addValue(attributeIndex: number) {
    setFilters((current) =>
      current.map((attribute, index) =>
        index !== attributeIndex
          ? attribute
          : {
              ...attribute,
              values: [
                ...attribute.values,
                {
                  slug: '',
                  label: '',
                  sortOrder: attribute.values.length,
                  isActive: true,
                },
              ],
            },
      ),
    );
  }

  function removeValue(attributeIndex: number, valueIndex: number) {
    setFilters((current) =>
      current.map((attribute, index) =>
        index !== attributeIndex
          ? attribute
          : {
              ...attribute,
              values: attribute.values.filter((_, index2) => index2 !== valueIndex),
            },
      ),
    );
  }

  function normalizeBeforeSave() {
    return filters
      .filter((attribute) => attribute.name.trim())
      .map((attribute, index) => ({
        ...attribute,
        slug: slugify(attribute.slug || attribute.name),
        sortOrder: index,
        values: attribute.values
          .filter((value) => value.label.trim())
          .map((value, valueIndex) => ({
            ...value,
            slug: slugify(value.slug || value.label),
            sortOrder: valueIndex,
            isActive: value.isActive !== false,
          })),
        isActive: attribute.isActive !== false,
      }));
  }

  async function save() {
    try {
      setSaving(true);
      setMessage('');
      const saved = await updateProductFilters(normalizeBeforeSave());
      setFilters(saved);
      setMessage('Product filters saved successfully.');
    } catch (error) {
      console.error(error);
      setMessage('Failed to save product filters.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        Loading product filters...
      </div>
    );
  }

  return (
    <section className="border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Catalog
          </p>
          <h2 className="mt-1 text-2xl font-serif text-[var(--color-primary)]">
            Product Filters
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Create the filter attributes and values shown on the storefront and product form.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={addAttribute}
            className="border border-[var(--color-primary)] px-4 py-2 text-xs font-semibold uppercase tracking-wider"
          >
            + Add Filter
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="bg-[var(--color-accent)] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Filters'}
          </button>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {filters.length === 0 ? (
          <div className="border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
            No filters configured yet.
          </div>
        ) : (
          filters.map((attribute, attributeIndex) => (
            <div
              key={`${attribute.slug}-${attributeIndex}`}
              className="border border-[var(--color-border)] bg-[var(--color-bg)] p-5"
            >
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                    Filter Name
                  </label>
                  <input
                    value={attribute.name}
                    onChange={(event) =>
                      updateAttribute(attributeIndex, {
                        name: event.target.value,
                        slug: attribute.slug || slugify(event.target.value),
                      })
                    }
                    className="w-full border border-[var(--color-border)] bg-white px-3 py-2.5"
                    placeholder="Shape"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                    Slug
                  </label>
                  <input
                    value={attribute.slug}
                    onChange={(event) =>
                      updateAttribute(attributeIndex, {
                        slug: slugify(event.target.value),
                      })
                    }
                    className="w-full border border-[var(--color-border)] bg-white px-3 py-2.5"
                    placeholder="shape"
                  />
                </div>

                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={attribute.isActive}
                    onChange={(event) =>
                      updateAttribute(attributeIndex, {
                        isActive: event.target.checked,
                      })
                    }
                  />
                  Active
                </label>

                <button
                  type="button"
                  onClick={() => removeAttribute(attributeIndex)}
                  className="self-end pb-2 text-xs font-semibold uppercase tracking-wider text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                    Values
                  </h3>
                  <button
                    type="button"
                    onClick={() => addValue(attributeIndex)}
                    className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]"
                  >
                    + Add Value
                  </button>
                </div>

                {attribute.values.length === 0 ? (
                  <div className="border border-dashed border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-muted)]">
                    No values yet.
                  </div>
                ) : (
                  attribute.values.map((value, valueIndex) => (
                    <div
                      key={`${value.slug}-${valueIndex}`}
                      className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]"
                    >
                      <input
                        value={value.label}
                        onChange={(event) =>
                          updateValue(attributeIndex, valueIndex, {
                            label: event.target.value,
                            slug: value.slug || slugify(event.target.value),
                          })
                        }
                        className="w-full border border-[var(--color-border)] bg-white px-3 py-2.5"
                        placeholder="Round Rugs"
                      />
                      <input
                        value={value.slug}
                        onChange={(event) =>
                          updateValue(attributeIndex, valueIndex, {
                            slug: slugify(event.target.value),
                          })
                        }
                        className="w-full border border-[var(--color-border)] bg-white px-3 py-2.5"
                        placeholder="round-rugs"
                      />
                      <label className="flex items-center gap-2 px-2 text-sm">
                        <input
                          type="checkbox"
                          checked={value.isActive}
                          onChange={(event) =>
                            updateValue(attributeIndex, valueIndex, {
                              isActive: event.target.checked,
                            })
                          }
                        />
                        Active
                      </label>
                      <button
                        type="button"
                        onClick={() => removeValue(attributeIndex, valueIndex)}
                        className="px-2 text-xs font-semibold uppercase tracking-wider text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}

        {message && (
          <p className={message.includes('successfully') ? 'text-sm text-green-600' : 'text-sm text-red-600'}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
