'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
    <div className="min-h-screen bg-luxury-cream p-4 sm:p-6 lg:p-8">
      <div className="animate-pulse space-y-8">
        <div className="h-12 w-48 bg-luxury-sand" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-96 bg-luxury-sand" />
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-luxury-sand" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state - initialize after mount to avoid hydration mismatch
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);

  // Sync with URL params after mount
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setSortBy(searchParams.get('sort') || 'featured');
  }, [searchParams]);

  // Load data
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

  // Filter and sort logic
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;

    const displayPrice = parseFloat(String(product.salePrice || product.regularPrice));
    const matchesPrice = displayPrice >= minPrice && displayPrice <= maxPrice;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Sort
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
    sortedProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
  // featured is default

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <main className="min-h-screen">
      {/* Collection introduction */}
      <div className="bg-luxury-beige border-b border-luxury-sand py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-3">Our Collection</h1>
          <p className="text-luxury-brown text-lg">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Sidebar - Filters */}
          <div className="md:col-span-1">
            <div className="space-y-10 sticky top-8">
              {/* Search */}
              <div>
                <label className="block text-sm font-serif text-luxury-charcoal mb-4 tracking-wide">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-luxury"
                />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-serif text-luxury-charcoal mb-4 tracking-wide">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-luxury"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-serif text-luxury-charcoal mb-4 tracking-wide">
                    Category
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center group cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value=""
                        checked={selectedCategory === ''}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-luxury-gold border-luxury-sand focus:ring-luxury-gold"
                      />
                      <span className="ml-3 text-sm text-luxury-brown group-hover:text-luxury-charcoal transition-colors">All Categories</span>
                    </label>
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center group cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value={cat.id}
                          checked={selectedCategory === cat.id}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-4 h-4 text-luxury-gold border-luxury-sand focus:ring-luxury-gold"
                        />
                        <span className="ml-3 text-sm text-luxury-brown group-hover:text-luxury-charcoal transition-colors">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div>
                <label className="block text-sm font-serif text-luxury-charcoal mb-4 tracking-wide">
                  Price Range
                </label>
                <div className="space-y-5">
                  <div>
                    <label className="text-xs text-luxury-brown uppercase tracking-wider">Min: ${minPrice}</label>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-full h-1 bg-luxury-sand appearance-none cursor-pointer accent-luxury-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-luxury-brown uppercase tracking-wider">Max: ${maxPrice}</label>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-full h-1 bg-luxury-sand appearance-none cursor-pointer accent-luxury-gold"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || selectedCategory || minPrice > 0 || maxPrice < 10000) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setMinPrice(0);
                    setMaxPrice(10000);
                    setSortBy('featured');
                    setCurrentPage(1);
                  }}
                  className="w-full border border-luxury-sand bg-luxury-beige px-5 py-3 text-sm font-serif tracking-wide text-luxury-brown transition-colors hover:bg-luxury-sand"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Content - Products */}
          <div className="md:col-span-3">
            {error && (
              <div className="mb-10 border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-6 py-4 text-luxury-charcoal">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center gap-3 text-luxury-brown">
                  <div className="w-4 h-4 bg-luxury-gold rounded-full animate-pulse" />
                  <span className="font-serif">Loading products...</span>
                </div>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-luxury-brown text-lg mb-6">No products found matching your criteria.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setMinPrice(0);
                    setMaxPrice(10000);
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-16">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 py-12 border-t border-luxury-sand">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border border-luxury-sand bg-luxury-beige px-5 py-3 font-serif text-luxury-brown transition-colors hover:border-luxury-gold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === currentPage;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-5 py-3 font-serif transition-colors ${
                            isActive
                              ? 'bg-luxury-gold text-white'
                              : 'border border-luxury-sand bg-luxury-beige hover:border-luxury-gold text-luxury-brown'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="border border-luxury-sand bg-luxury-beige px-5 py-3 font-serif text-luxury-brown transition-colors hover:border-luxury-gold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
