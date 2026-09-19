'use client';

import { ProductFilterSetting } from '@/lib/api';

type Props = {
  filters: ProductFilterSetting[];
  selected: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
};

export function ProductFilterFields({ filters, selected, onChange }: Props) {
  function toggle(attributeSlug: string, valueSlug: string, checked: boolean) {
    const current = selected[attributeSlug] ?? [];
    const nextValues = checked
      ? Array.from(new Set([...current, valueSlug]))
      : current.filter((item) => item !== valueSlug);

    onChange({
      ...selected,
      [attributeSlug]: nextValues,
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
    <div className="space-y-6">
      {filters
        .filter((attribute) => attribute.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((attribute) => (
          <div key={attribute.slug}>
            <label className="mb-3 block text-sm font-medium">
              {attribute.name}
            </label>

            <div className="flex flex-wrap gap-2">
              {attribute.values
                .filter((value) => value.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((value) => {
                  const checked = (selected[attribute.slug] ?? []).includes(value.slug);

                  return (
                    <label
                      key={value.slug}
                      className={`inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm transition-colors ${
                        checked
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                          : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          toggle(attribute.slug, value.slug, event.target.checked)
                        }
                        className="sr-only"
                      />
                      {value.label}
                    </label>
                  );
                })}
            </div>
          </div>
        ))}
    </div>
  );
}
