'use client';

import { ProductFilterSetting } from '@/lib/api';

type Props = {
  filters: ProductFilterSetting[];
  selected: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
  textValues?: Record<string, string>;
  onTextChange?: (attributeSlug: string, value: string) => void;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ProductFilterFields({
  filters,
  selected,
  onChange,
  textValues = {},
  onTextChange,
}: Props) {
  function selectValue(attributeSlug: string, valueSlug: string) {
    onChange({
      ...selected,
      [attributeSlug]: valueSlug ? [valueSlug] : [],
    });
  }

  if (filters.length === 0) {
    return (
      <div className="border border-dashed border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)]">
        No product filters configured yet. Add them from Settings → Product Filters.
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {filters
        .filter((attribute) => attribute.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((attribute) => {
          const selectedValue = selected[attribute.slug]?.[0] ?? '';

          if (attribute.slug === 'color') {
            const colorValue = textValues.color ?? '';

            return (
              <div key={attribute.slug}>
                <label className="mb-2 block text-sm font-medium">
                  {attribute.name}
                </label>
                <input
                  value={colorValue}
                  onChange={(event) => {
                    const value = event.target.value;
                    onTextChange?.(attribute.slug, value);
                    selectValue(attribute.slug, value ? slugify(value) : '');
                  }}
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                  placeholder="e.g. Ivory, Sand, Charcoal"
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Enter any color name. No predefined list is required.
                </p>
              </div>
            );
          }

          return (
            <div key={attribute.slug}>
              <label className="mb-2 block text-sm font-medium">
                {attribute.name}
              </label>
              <select
                value={selectedValue}
                onChange={(event) =>
                  selectValue(attribute.slug, event.target.value)
                }
                className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
              >
                <option value="">Select {attribute.name}</option>
                {attribute.values
                  .filter((value) => value.isActive)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((value) => (
                    <option key={value.slug} value={value.slug}>
                      {value.label}
                    </option>
                  ))}
              </select>
            </div>
          );
        })}
    </div>
  );
}
