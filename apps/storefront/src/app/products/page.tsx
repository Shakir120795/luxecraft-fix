'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProductFilters, getProductsPage, Product, ProductFilterSetting } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { ProductFilterBar } from '@/components/ProductFilterBar';

const ITEMS_PER_PAGE = 12;
const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 10000;

type SortOption = 'featured' | 'newest' | 'price-low' | 'price-high';

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10">
        <div className="animate-pulse space-y-10">
          <div className="h-12 w-56 bg-[rgb(var(--luxecraft-cream))]" />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            <div className="h-96 bg-[rgb(var(--luxecraft-cream))]" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:col-span-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-[rgb(var(--luxecraft-cream))]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [productFilters, setProductFilters] = useState<ProductFilterSetting[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState(DEFAULT_MIN_PRICE);
  const [maxPrice, setMaxPrice] = useState(DEFAULT_MAX_PRICE);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    async function loadFilters() {
      try {
        setFiltersLoading(true);
        const filtersData = await getProductFilters();
        setProductFilters(filtersData.filter((filter) => filter.isActive));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product filters');
      } finally {
        setFiltersLoading(false);
      }
    }

    loadFilters();
  }, []);

  useEffect(() => {
    const incomingSort = searchParams.get('sort');
    const nextSort: SortOption =
      incomingSort === 'newest' ||
      incomingSort === 'price-low' ||
      incomingSort === 'price-high'
        ? incomingSort
        : 'featured';

    const incomingFilters: Record<string, string> = {};
    productFilters.forEach((filter) => {
      const value = searchParams.get('filter_' + filter.slug);
      if (value) incomingFilters[filter.slug] = value;
    });

    const incomingPrice = searchParams.get('price');
    let nextMinPrice = DEFAULT_MIN_PRICE;
    let nextMaxPrice = DEFAULT_MAX_PRICE;

    if (incomingPrice) {
      const [min, max] = incomingPrice.split('-').map(Number);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        nextMinPrice = min;
        nextMaxPrice = max;
      }
    }

    setSearchTerm(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setSortBy(nextSort);
    setSelectedFilters(incomingFilters);
    setMinPrice(nextMinPrice);
    setMaxPrice(nextMaxPrice);
    setCurrentPage(1);
  }, [searchParams, productFilters]);

  useEffect(() => {
    if (filtersLoading) return;

    let cancelled = false;
    const isFirstPage = currentPage === 1;

    async function loadProducts() {
      if (isFirstPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
        loadingMoreRef.current = true;
      }

      try {
        setError(null);

        const data = await getProductsPage({
          page: currentPage,
          pageSize: ITEMS_PER_PAGE,
          categoryId: selectedCategory || undefined,
          search: searchTerm || undefined,
          minPrice: minPrice !== DEFAULT_MIN_PRICE ? minPrice : undefined,
          maxPrice: maxPrice !== DEFAULT_MAX_PRICE ? maxPrice : undefined,
          sort: sortBy,
          filters: selectedFilters,
        });

        if (cancelled) return;

        if (data.totalPages > 0 && currentPage > data.totalPages) {
          setCurrentPage(data.totalPages);
          return;
        }

        setProducts((current) =>
          isFirstPage ? data.items : [...current, ...data.items],
        );
        setTotalProducts(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load products');
          if (isFirstPage) {
            setProducts([]);
            setTotalProducts(0);
            setTotalPages(1);
          }
        }
      } finally {
        if (!cancelled) {
          if (isFirstPage) {
            setLoading(false);
          } else {
            setLoadingMore(false);
            loadingMoreRef.current = false;
          }
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
      if (!isFirstPage) {
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    };
  }, [
    filtersLoading,
    currentPage,
    selectedCategory,
    searchTerm,
    minPrice,
    maxPrice,
    sortBy,
    selectedFilters,
  ]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || loading || loadingMore || currentPage >= totalPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (
          firstEntry?.isIntersecting &&
          !loadingMoreRef.current &&
          currentPage < totalPages
        ) {
          loadingMoreRef.current = true;
          setCurrentPage((page) => page + 1);
        }
      },
      { rootMargin: '700px 0px' },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loading, loadingMore, currentPage, totalPages]);

  const filterValueOptions: Record<string, { slug: string; label: string }[]> =
    Object.fromEntries(
      productFilters.map((filter) => [
        filter.slug,
        filter.values
          .filter((value) => value.isActive)
          .map((value) => ({ slug: value.slug, label: value.label })),
      ]),
    );

  const priceRange =
    minPrice === DEFAULT_MIN_PRICE && maxPrice === DEFAULT_MAX_PRICE
      ? ''
      : minPrice + '-' + maxPrice;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="w-full">
          <section className="w-full">
            {error && (
              <div className="mb-8 border border-[rgb(var(--luxecraft-red))] bg-[rgb(var(--luxecraft-red)/0.06)] px-5 py-4 text-sm text-[rgb(var(--luxecraft-ink))]">
                {error}
              </div>
            )}

            <ProductFilterBar
              filters={productFilters}
              valueOptions={filterValueOptions}
              selected={selectedFilters}
              onSelect={(slug, value) => {
                setSelectedFilters((current) => ({
                  ...current,
                  ...(value ? { [slug]: value } : { [slug]: '' }),
                }));
                setCurrentPage(1);
              }}
              priceRange={priceRange}
              onPriceRangeChange={(value) => {
                if (!value) {
                  setMinPrice(DEFAULT_MIN_PRICE);
                  setMaxPrice(DEFAULT_MAX_PRICE);
                } else {
                  const [min, max] = value.split('-').map(Number);
                  if (Number.isFinite(min) && Number.isFinite(max)) {
                    setMinPrice(min);
                    setMaxPrice(max);
                  }
                }
                setCurrentPage(1);
              }}
              onClear={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedFilters({});
                setMinPrice(DEFAULT_MIN_PRICE);
                setMaxPrice(DEFAULT_MAX_PRICE);
                setSortBy('featured');
                setCurrentPage(1);
              }}
            />

            <div className="mb-8 flex items-center justify-between border-b border-[rgb(var(--luxecraft-border))] pb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[rgb(var(--luxecraft-ink))]">
                  {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
                </span>
              </div>

              <label className="flex items-center gap-2 text-sm text-[rgb(var(--luxecraft-ink))]">
                Sort by:
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value as SortOption);
                    setCurrentPage(1);
                  }}
                  className="border-0 bg-transparent py-1 pr-2 text-sm font-medium outline-none"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </label>
            </div>

            {loading || filtersLoading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex items-center gap-3 text-[rgb(var(--luxecraft-muted))]">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-[rgb(var(--luxecraft-gold))]" />
                  <span className="font-serif">Loading products...</span>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="border-y border-[rgb(var(--luxecraft-border))] py-20 text-center">
                <p className="mb-6 font-serif text-xl text-[rgb(var(--luxecraft-ink))]">
                  No products found matching your criteria.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setSelectedFilters({});
                    setMinPrice(DEFAULT_MIN_PRICE);
                    setMaxPrice(DEFAULT_MAX_PRICE);
                    setSortBy('featured');
                    setCurrentPage(1);
                  }}
                  className="btn-luxury"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-16 grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <div
                  ref={loadMoreSentinelRef}
                  className="flex min-h-16 items-center justify-center border-t border-[rgb(var(--luxecraft-border))] pt-10"
                  aria-live="polite"
                >
                  {loadingMore && (
                    <span className="text-sm text-[rgb(var(--luxecraft-muted))]">
                      Loading more products...
                    </span>
                  )}
                  {!loadingMore && currentPage >= totalPages && products.length > 0 && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--luxecraft-muted))]">
                      You&rsquo;ve reached the end
                    </span>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
