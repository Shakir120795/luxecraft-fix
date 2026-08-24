'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProducts, getCategories, Product, Category } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

const ITEMS_PER_PAGE = 12;

export default function CategoryPage() {
  return (
    <Suspense fallback={<CategoryLoading />}>
      <CategoryContent />
    </Suspense>
  );
}

function CategoryLoading() {
  return (
    <div className="min-h-screen bg-luxury-cream p-4 sm:p-6 lg:p-8">
      <div className="animate-pulse space-y-8">
        <div className="h-12 w-48 bg-luxury-sand" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 bg-luxury-sand" />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryContent() {
  const params = useParams();
  const categorySlug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadCategoryData();
  }, [categorySlug]);

  async function loadCategoryData() {
    try {
      setLoading(true);
      const [categoriesData, productsData] = await Promise.all([
        getCategories(),
        getProducts(),
      ]);

      setAllCategories(categoriesData);

      // Find the category by slug
      const foundCategory = categoriesData.find(c => c.slug === categorySlug);
      
      if (!foundCategory) {
        setError('Category not found');
        setLoading(false);
        return;
      }

      setCategory(foundCategory);

      // Filter products by category
      const categoryProducts = productsData.filter(p => p.categoryId === foundCategory.id);
      setProducts(categoryProducts);
    } catch (err) {
      setError('Failed to load category');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <CategoryLoading />;
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-serif font-light text-luxury-charcoal mb-4">Category Not Found</h1>
          <p className="text-luxury-brown mb-8">{error || 'The category could not be found'}</p>
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

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-luxury-night via-[#4A3F35] to-luxury-night text-white py-20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm mb-6">
            <Link href="/" className="text-luxury-cream/70 hover:text-white">Home</Link>
            <span className="mx-2 text-luxury-cream/50">/</span>
            <Link href="/products" className="text-luxury-cream/70 hover:text-white">Collections</Link>
            <span className="mx-2 text-luxury-cream/50">/</span>
            <span className="text-white">{category.name}</span>
          </nav>

          <h1 className="text-6xl font-serif font-light tracking-tight mb-6">
            {category.name}
          </h1>
          
          {category.description && (
            <p className="text-xl text-luxury-cream/90 max-w-3xl leading-relaxed">
              {category.description}
            </p>
          )}

          <div className="mt-8 text-luxury-cream/70">
            {products.length} {products.length === 1 ? 'piece' : 'pieces'} in this collection
          </div>
        </div>
      </section>

      {/* Category Image */}
      {category.imageUrl && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="aspect-[21/9] overflow-hidden border border-luxury-sand">
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <h2 className="text-3xl font-serif font-light text-luxury-charcoal">
            Explore {category.name}
          </h2>

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
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {paginatedProducts.length > 0 ? (
          <>
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
            <p className="text-luxury-brown text-lg mb-6">No products found in this category</p>
            <Link href="/products" className="btn-luxury px-8 py-3 inline-block">
              Browse All Products →
            </Link>
          </div>
        )}
      </section>

      {/* Other Categories */}
      {allCategories.length > 1 && (
        <section className="bg-luxury-beige py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-serif font-light text-luxury-charcoal text-center mb-12">
              Explore Other Collections
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {allCategories
                .filter(c => c.id !== category.id)
                .slice(0, 4)
                .map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="group border border-luxury-sand bg-luxury-cream hover:border-luxury-gold transition-colors p-6 text-center"
                  >
                    <h3 className="font-serif text-lg text-luxury-charcoal mb-2 group-hover:text-luxury-gold transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-luxury-brown">Explore →</p>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
