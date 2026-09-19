'use client';

import { ProductFilterSetting } from '@/lib/api';

type Props = {
  filters: ProductFilterSetting[];
  selected: Record<string, string>;
  onSelect: (slug: string, value: string) => void;
  selectedAvailability: string;
  onAvailabilityChange: (value: string) => void;
  priceRange: string;
  onPriceRangeChange: (value: string) => void;
  onClear: () => void;
};

export function ProductFilterBar({
  filters,
  selected,
  onSelect,
  selectedAvailability,
  onAvailabilityChange,
  priceRange,
  onPriceRangeChange,
  onClear,
}: Props) {
  return (
    <div className="mb-10 border-y border-[rgb(var(--luxecraft-border))] py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--luxecraft-muted))]">
          Filter by
        </span>

        {filters
          .filter((filter) => filter.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((filter) => (
            <select
              key={filter.slug}
              value={selected[filter.slug] ?? ''}
              onChange={(event) => onSelect(filter.slug, event.target.value)}
              className="min-w-[140px] border border-[rgb(var(--luxecraft-border))] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--luxecraft-ink))] outline-none focus:border-[rgb(var(--luxecraft-olive))]"
            >
              <option value="">{filter.name}</option>
              {filter.values
                .filter((value) => value.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((value) => (
                  <option key={value.slug} value={value.slug}>
                    {value.label}
                  </option>
                ))}
            </select>
          ))}

        <select
          value={priceRange}
          onChange={(event) => onPriceRangeChange(event.target.value)}
          className="min-w-[140px] border border-[rgb(var(--luxecraft-border))] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--luxecraft-ink))] outline-none focus:border-[rgb(var(--luxecraft-olive))]"
        >
          <option value="">Price</option>
          <option value="0-500">$0 - $500</option>
          <option value="500-1000">$500 - $1,000</option>
          <option value="1000-2500">$1,000 - $2,500</option>
          <option value="2500-5000">$2,500 - $5,000</option>
          <option value="5000-10000">$5,000+</option>
        </select>

        <select
          value={selectedAvailability}
          onChange={(event) => onAvailabilityChange(event.target.value)}
          className="min-w-[155px] border border-[rgb(var(--luxecraft-border))] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--luxecraft-ink))] outline-none focus:border-[rgb(var(--luxecraft-olive))]"
        >
          <option value="">Availability</option>
          <option value="in-stock">In Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>

        <button
          type="button"
          onClick={onClear}
          className="ml-auto px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--luxecraft-olive))] transition-colors hover:text-[rgb(var(--luxecraft-ink))]"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
