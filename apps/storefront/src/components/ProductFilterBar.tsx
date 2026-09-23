'use client';

import { useEffect, useRef, useState } from 'react';
import { ProductFilterSetting } from '@/lib/api';

type Props = {
  filters: ProductFilterSetting[];
  valueOptions?: Record<string, { slug: string; label: string }[]>;
  selected: Record<string, string>;
  onSelect: (slug: string, value: string) => void;
  priceRange: string;
  onPriceRangeChange: (value: string) => void;
  onClear: () => void;
};

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 transition-transform duration-200">
      <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
    </svg>
  );
}

export function ProductFilterBar({
  filters,
  valueOptions = {},
  selected,
  onSelect,
  priceRange,
  onPriceRangeChange,
  onClear,
}: Props) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!barRef.current?.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const activeFilters = filters
    .filter((filter) => filter.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  function getOptions(filter: ProductFilterSetting) {
    return valueOptions[filter.slug] ?? filter.values;
  }

  function getSelectedLabel(filter: ProductFilterSetting) {
    const selectedValue = selected[filter.slug];
    if (!selectedValue) return filter.name;
    return getOptions(filter).find((value) => value.slug === selectedValue)?.label ?? filter.name;
  }

  const priceOptions = [
    { slug: '', label: 'All prices' },
    { slug: '0-500', label: '$0 – $500' },
    { slug: '500-1000', label: '$500 – $1,000' },
    { slug: '1000-2500', label: '$1,000 – $2,500' },
    { slug: '2500-5000', label: '$2,500 – $5,000' },
    { slug: '5000-10000', label: '$5,000+' },
  ];

  const selectedPriceLabel =
    priceOptions.find((option) => option.slug === priceRange)?.label ?? 'Price';

  return (
    <div
      ref={barRef}
      className="relative mb-10 border-y border-[#e5ddd3] bg-[#fbf9f6] py-4 sm:py-5"
    >
      <div className="flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mr-1 flex shrink-0 items-center gap-2 pr-2">
          <span className="h-2 w-2 rounded-full bg-[#b94740]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6f665f]">
            Filter by
          </span>
        </div>

        {activeFilters.map((filter) => {
          const isOpen = openFilter === filter.slug;
          const hasSelected = Boolean(selected[filter.slug]);
          const options = getOptions(filter);

          return (
            <div key={filter.slug} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setOpenFilter((current) => (current === filter.slug ? null : filter.slug))}
                className={[
                  'group flex min-h-11 items-center gap-4 rounded-xl border px-4 py-2.5 text-left transition-all duration-200',
                  hasSelected
                    ? 'border-[#b94740] bg-white text-[#2b2118] shadow-[0_6px_18px_rgba(48,43,53,0.08)]'
                    : 'border-[#ddd4ca] bg-white text-[#2b2118] hover:border-[#c8b79e] hover:bg-[#fffdfa]',
                ].join(' ')}
                aria-haspopup="menu"
                aria-expanded={isOpen}
              >
                <span className="min-w-[76px] text-[11px] font-bold uppercase tracking-[0.11em]">
                  {getSelectedLabel(filter)}
                </span>
                <ChevronIcon />
              </button>

              {isOpen && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[220px] overflow-hidden rounded-2xl border border-[#e3d8cb] bg-[#fffdf9] p-2 shadow-[0_18px_40px_rgba(48,43,53,0.16)]">
                  <div className="px-3 pb-2 pt-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2f6b36]">
                      {filter.name}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelect(filter.slug, '');
                      setOpenFilter(null);
                    }}
                    className={[
                      'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors',
                      !selected[filter.slug]
                        ? 'bg-[#f4eee6] font-semibold text-[#2b2118]'
                        : 'text-[#5f5750] hover:bg-[#f7f2ec] hover:text-[#2f6b36]',
                    ].join(' ')}
                  >
                    <span>All {filter.name.toLowerCase()}</span>
                    {!selected[filter.slug] && <span className="text-[#b94740]">✓</span>}
                  </button>

                  {options.map((value) => {
                    const active = selected[filter.slug] === value.slug;

                    return (
                      <button
                        type="button"
                        key={value.slug}
                        onClick={() => {
                          onSelect(filter.slug, value.slug);
                          setOpenFilter(null);
                        }}
                        className={[
                          'group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                          active
                            ? 'bg-[#2f6b36] font-semibold text-white'
                            : 'text-[#2b2118] hover:bg-[#f4eee6] hover:pl-4 hover:text-[#2f6b36]',
                        ].join(' ')}
                      >
                        <span>{value.label}</span>
                        <span className={active ? 'text-white/90' : 'text-[#b94740] opacity-0 transition-opacity group-hover:opacity-100'}>
                          →
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpenFilter((current) => (current === '__price__' ? null : '__price__'))}
            className={[
              'flex min-h-11 items-center gap-4 rounded-xl border px-4 py-2.5 text-left transition-all duration-200',
              priceRange
                ? 'border-[#b94740] bg-white text-[#2b2118] shadow-[0_6px_18px_rgba(48,43,53,0.08)]'
                : 'border-[#ddd4ca] bg-white text-[#2b2118] hover:border-[#c8b79e] hover:bg-[#fffdfa]',
            ].join(' ')}
            aria-haspopup="menu"
            aria-expanded={openFilter === '__price__'}
          >
            <span className="min-w-[76px] text-[11px] font-bold uppercase tracking-[0.11em]">
              {selectedPriceLabel}
            </span>
            <ChevronIcon />
          </button>

          {openFilter === '__price__' && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[220px] overflow-hidden rounded-2xl border border-[#e3d8cb] bg-[#fffdf9] p-2 shadow-[0_18px_40px_rgba(48,43,53,0.16)]">
              <div className="px-3 pb-2 pt-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2f6b36]">
                  Price
                </p>
              </div>
              {priceOptions.map((option) => {
                const active = priceRange === option.slug;

                return (
                  <button
                    type="button"
                    key={option.slug || 'all'}
                    onClick={() => {
                      onPriceRangeChange(option.slug);
                      setOpenFilter(null);
                    }}
                    className={[
                      'group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                      active
                        ? 'bg-[#2f6b36] font-semibold text-white'
                        : 'text-[#2b2118] hover:bg-[#f4eee6] hover:pl-4 hover:text-[#2f6b36]',
                    ].join(' ')}
                  >
                    <span>{option.label}</span>
                    {active && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onClear();
            setOpenFilter(null);
          }}
          className="ml-auto shrink-0 rounded-full border border-transparent px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a5a2c] transition-all duration-200 hover:border-[#d9c8a9] hover:bg-white hover:text-[#2f6b36]"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
