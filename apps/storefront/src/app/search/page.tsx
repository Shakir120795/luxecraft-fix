'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getProducts, Product } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

const ITEMS_PER_PAGE = 12;

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchLoading() {
  return (
    <div className="min-h-screen bg-luxury-cream p-4 sm:p-6 lg:p-8">
      <div className="animate-pulse space-y-8">
        <div className="h-12 w-64 bg-luxury-sand" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 bg-luxury-sand" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (query) {
      searchProducts();
    } else {
      setLoading(false);
    }
  }, [query]);

  async function searchProducts() {
    try {
      setLoading(true);
      const allProducts = await getProducts();
      
      // Search in product name, description, and SKU
      const searchResults = allProducts.filter(product => {
        const searchLower = query.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          (product.shortDescription && product.shortDescription.toLowerCase().includes(searchLower))
        );
      });

      setProducts(searchResults);
    } catch (err) {
      setError('Failed to search products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <SearchLoading />;
  }

  if (!query) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <span className="text-7xl">🔍</span>
          </div>
          <h1 className="text-4xl font-serif font-light text-luxury-charcoal mb-4">Search LuxeCraft</h1>
          <p className="text-luxury-brown mb-8">Enter a search term to find products</p>
          <Link href="/products" className="btn-luxury px-10 py-4 inline-block">
            Browse All Products →
          </Link>
        </div>
      </div>
    );
  }

  // Sort products
  let sortedProducts = [...products];
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
  // 'relevance' keeps original order

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-luxury-beige border-b border-luxury-sand py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <nav className="text-sm mb-4 text-luxury-brown">
            <Link href="/" className="hover:text-luxury-gold">Home</Link>
            <span className="mx-2">/</span>
            <span>Search Results</span>
          </nav>

          <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-4">
            Search Results
          </h1>
          
          <p className="text-luxury-brown text-lg">
            {products.length} {products.length === 1 ? 'result' : 'results'} for <strong>"{query}"</strong>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {error && (
          <div className="mb-8 border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-6 py-4 text-luxury-charcoal">
            {error}
          </div>
        )}

        {products.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
              <div className="text-luxury-brown">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, products.length)} of {products.length}
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm text-luxury-brown">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-luxury py-2 text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 mb-16">
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
        ) : (
          <div className="text-center py-20 border border-luxury-sand bg-luxury-beige">
            <div className="mb-8">
              <span className="text-7xl">🔍</span>
            </div>
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-4">
              No Results Found
            </h2>
            <p className="text-luxury-brown mb-8 max-w-md mx-auto">
              We couldn't find any products matching <strong>"{query}"</strong>.
              Try different keywords or browse our collections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products" className="btn-luxury px-8 py-3 inline-block">
                Browse All Products →
              </Link>
              <Link href="/" className="btn-luxury-outline px-8 py-3 inline-block">
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {/* Search Tips */}
        {products.length === 0 && query && (
          <div className="mt-12 border border-luxury-sand bg-luxury-beige p-8">
            <h3 className="font-serif text-xl text-luxury-charcoal mb-4">Search Tips</h3>
            <ul className="space-y-2 text-luxury-brown">
              <li>• Check your spelling</li>
              <li>• Try more general keywords</li>
              <li>• Try different keywords</li>
              <li>• Browse by category instead</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
