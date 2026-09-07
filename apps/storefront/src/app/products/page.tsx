'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProducts, getCategories, Product, Category } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

const ITEMS_PER_PAGE = 12;

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('featured');
  const [visibleCount, setVisibleCount] = useState(16);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setSortBy(searchParams.get('sort') || 'featured');
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filterOptions = {
    materials: Array.from(new Set(products.map((product) => product.material?.trim()).filter(Boolean))).sort(),
    styles: Array.from(new Set(products.map((product) => product.style?.trim()).filter(Boolean))).sort(),
    colors: Array.from(new Set(products.map((product) => product.color?.trim()).filter(Boolean))).sort(),
    sizes: Array.from(new Set(products.flatMap((product) => (product.variants ?? []).map((variant) => variant.name?.trim()).filter(Boolean)))).sort(),
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !selectedCategory || product.categoryId === selectedCategory;

    const matchesMaterial =
      !selectedMaterial || product.material?.trim() === selectedMaterial;

    const matchesStyle =
      !selectedStyle || product.style?.trim() === selectedStyle;

    const matchesColor =
      !selectedColor || product.color?.trim() === selectedColor;

    const matchesSize =
      !selectedSize || (product.variants ?? []).some((variant) => variant.name?.trim() === selectedSize);

    const matchesAvailability =
      !selectedAvailability ||
      (selectedAvailability === 'in-stock'
        ? (product.variants ?? []).some((variant) => variant.isAvailable !== false && Number(variant.stockQty ?? 0) > 0)
        : (product.variants ?? []).every((variant) => variant.isAvailable === false || Number(variant.stockQty ?? 0) <= 0));

    const displayPrice = parseFloat(
      String(product.salePrice || product.regularPrice)
    );

    const matchesPrice =
      displayPrice >= minPrice && displayPrice <= maxPrice;

    return matchesSearch && matchesCategory && matchesMaterial && matchesStyle && matchesColor && matchesSize && matchesAvailability && matchesPrice;
  });

  let sortedProducts = [...filteredProducts];

  if (sortBy === 'price-low') {
    sortedProducts.sort((a, b) => {
      const priceA = parseFloat(String(a.salePrice || a.regularPrice));
      const priceB = parseFloat(String(b.salePrice || b.regularPrice));
      return priceA - priceB;
    });
  } else if (sortBy === 'price-high') {
    sortedProducts.sort((a, b) => {
      const priceA = parseFloat(String(a.salePrice || a.regularPrice));
      const priceB = parseFloat(String(b.salePrice || b.regularPrice));
      return priceB - priceA;
    });
  } else if (sortBy === 'newest') {
    sortedProducts.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
  }
  const paginatedProducts = sortedProducts.slice(0, visibleCount);

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

<div className="mb-10 border-y border-[rgb(var(--luxecraft-border))] py-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--luxecraft-muted))]">
                  Filter by
                </span>

                <select value={selectedMaterial} onChange={(event) => { setSelectedMaterial(event.target.value); setVisibleCount(16); }} className="min-w-[150px] border border-[rgb(var(--luxecraft-border))] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--luxecraft-ink))] outline-none focus:border-[rgb(var(--luxecraft-olive))]">
                  <option value="">Material</option>
                  {filterOptions.materials.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>

                <select value={selectedSize} onChange={(event) => { setSelectedSize(event.target.value); setVisibleCount(16); }} className="min-w-[140px] border border-[rgb(var(--luxecraft-border))] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--luxecraft-ink))] outline-none focus:border-[rgb(var(--luxecraft-olive))]">
                  <option value="">Size</option>
                  {filterOptions.sizes.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>

                <select value={selectedStyle} onChange={(event) => { setSelectedStyle(event.target.value); setVisibleCount(16); }} className="min-w-[140px] border border-[rgb(var(--luxecraft-border))] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--luxecraft-ink))] outline-none focus:border-[rgb(var(--luxecraft-olive))]">
                  <option value="">Style</option>
                  {filterOptions.styles.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>

                <select value={minPrice === 0 && maxPrice === 10000 ? '' : `${minPrice}-${maxPrice}`} onChange={(event) => { const value = event.target.value; if (!value) { setMinPrice(0); setMaxPrice(10000); } else { const [min, max] = value.split('-').map(Number); setMinPrice(min); setMaxPrice(max); } setVisibleCount(16); }} className="min-w-[140px] border border-[rgb(var(--luxecraft-border))] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--luxecraft-ink))] outline-none focus:border-[rgb(var(--luxecraft-olive))]">
                  <option value="">Price</option>
                  <option value="0-500">$0 – $500</option>
                  <option value="500-1000">$500 – $1,000</option>
                  <option value="1000-2500">$1,000 – $2,500</option>
                  <option value="2500-5000">$2,500 – $5,000</option>
                  <option value="5000-10000">$5,000+</option>
                </select>

                <select value={selectedColor} onChange={(event) => { setSelectedColor(event.target.value); setVisibleCount(16); }} className="min-w-[140px] border border-[rgb(var(--luxecraft-border))] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--luxecraft-ink))] outline-none focus:border-[rgb(var(--luxecraft-olive))]">
                  <option value="">Color</option>
                  {filterOptions.colors.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>

                <select value={selectedAvailability} onChange={(event) => { setSelectedAvailability(event.target.value); setVisibleCount(16); }} className="min-w-[155px] border border-[rgb(var(--luxecraft-border))] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--luxecraft-ink))] outline-none focus:border-[rgb(var(--luxecraft-olive))]">
                  <option value="">Availability</option>
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>

                <button type="button" onClick={() => { setSelectedMaterial(''); setSelectedSize(''); setSelectedStyle(''); setSelectedColor(''); setSelectedAvailability(''); setMinPrice(0); setMaxPrice(10000); setVisibleCount(16); }} className="ml-auto px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--luxecraft-olive))] transition-colors hover:text-[rgb(var(--luxecraft-ink))]">
                  Clear
                </button>
              </div>
            </div>

            <div className="mb-8 flex items-center justify-between border-b border-[rgb(var(--luxecraft-border))] pb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[rgb(var(--luxecraft-ink))]">{sortedProducts.length} products</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-[rgb(var(--luxecraft-ink))]">Sort by:
                <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setVisibleCount(16); }} className="border-0 bg-transparent py-1 pr-2 text-sm font-medium outline-none">
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </label>
            </div>

            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex items-center gap-3 text-[rgb(var(--luxecraft-muted))]">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-[rgb(var(--luxecraft-gold))]" />
                  <span className="font-serif">
                    Loading products...
                  </span>
                </div>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="border-y border-[rgb(var(--luxecraft-border))] py-20 text-center">
                <p className="mb-6 font-serif text-xl text-[rgb(var(--luxecraft-ink))]">
                  No products found matching your criteria.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setMinPrice(0);
                    setMaxPrice(10000);
                    setSortBy('featured');
                    setVisibleCount(16);
                  }}
                  className="btn-luxury"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-16 grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {visibleCount < sortedProducts.length && (
                  <div className="flex justify-center border-t border-[rgb(var(--luxecraft-border))] pt-10">
                    <button type="button" onClick={() => setVisibleCount((count) => Math.min(count + 16, sortedProducts.length))} className="border border-black bg-black px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white hover:text-black">
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}













