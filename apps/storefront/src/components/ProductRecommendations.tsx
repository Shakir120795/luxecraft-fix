'use client';

import { useRef } from 'react';
import { Product } from '@/lib/api';
import { ProductCard } from './ProductCard';

type ProductRecommendationsProps = {
  title: string;
  products: Product[];
};

export function ProductRecommendations({
  title,
  products,
}: ProductRecommendationsProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!products.length) return null;

  const normalizedTitle = title.toLowerCase();
  const eyebrow = normalizedTitle.includes('recent')
    ? 'Your browsing journey'
    : normalizedTitle.includes('top')
      ? 'Wolhomes favourites'
      : 'Curated for you';

  const scroll = (direction: 'left' | 'right') => {
    sliderRef.current?.scrollBy({
      left: direction === 'right' ? 360 : -360,
      behavior: 'smooth',
    });
  };

  return (
    <section className="mt-12 border-t border-black/10 pt-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-brown/60">
            {eyebrow}
          </p>
          <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-luxury-charcoal sm:text-3xl">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-luxury-brown/50 sm:hidden">
            Swipe
          </span>
          <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label={`Previous ${title}`}
            className="flex h-10 w-10 items-center justify-center border border-luxury-sand bg-white text-luxury-charcoal transition hover:bg-luxury-cream"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label={`Next ${title}`}
            className="flex h-10 w-10 items-center justify-center border border-luxury-sand bg-white text-luxury-charcoal transition hover:bg-luxury-cream"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          </div>
        </div>
      </div>

      <div
        ref={sliderRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[72vw] shrink-0 snap-start sm:w-[310px] lg:w-[285px]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
