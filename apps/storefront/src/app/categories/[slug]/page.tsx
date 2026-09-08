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
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] px-6 py-10 sm:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[210px_1fr]">
          <aside className="hidden lg:block">
            <div className="h-5 w-32 animate-pulse bg-[#eee9e3]" />
            <div className="mt-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 w-36 animate-pulse bg-[#f1ede8]" />
              ))}
            </div>
          </aside>

          <div>
            <div className="h-10 w-64 animate-pulse bg-[#eee9e3]" />
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-square animate-pulse rounded-xl bg-[#f1ede8]" />
                  <div className="mt-3 h-4 w-3/4 animate-pulse bg-[#eee9e3]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
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
      setError(null);

      const [categoriesData, productsData] = await Promise.all([
        getCategories(),
        getProducts(),
      ]);

      setAllCategories(categoriesData);

      const foundCategory = categoriesData.find(
        (item) => item.slug === categorySlug,
      );

      if (!foundCategory) {
        setError('Category not found');
        setLoading(false);
        return;
      }

      setCategory(foundCategory);

      const categoryProducts = productsData.filter(
        (product) =>
          product.categoryId === foundCategory.id &&
          product.status === 'ACTIVE',
      );

      setProducts(categoryProducts);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError('Failed to load category');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <CategoryLoading />;
  }

  if (error || !category) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-20">
        <div className="w-full max-w-lg text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#315f37]">
            LuxeCraft
          </p>

          <h1 className="mt-3 font-serif text-4xl font-light text-black sm:text-5xl">
            Category Not Found
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-black">
            {error || 'The category could not be found'}
          </p>

          <Link href="/products" className="btn-luxury mt-7">
            Browse All Products 
          </Link>
        </div>
      </main>
    );
  }

  let sortedProducts = [...products];

  if (sortBy === 'price-low') {
    sortedProducts.sort(
      (a, b) =>
        parseFloat(String(a.salePrice || a.regularPrice)) -
        parseFloat(String(b.salePrice || b.regularPrice)),
    );
  } else if (sortBy === 'price-high') {
    sortedProducts.sort(
      (a, b) =>
        parseFloat(String(b.salePrice || b.regularPrice)) -
        parseFloat(String(a.salePrice || a.regularPrice)),
    );
  } else if (sortBy === 'newest') {
    sortedProducts.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
  } else {
    sortedProducts.sort(
      (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
    );
  }

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-[1400px] px-6 py-10 sm:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[210px_1fr] lg:gap-10">

          <aside className="lg:sticky lg:top-[96px] lg:self-start lg:max-h-[calc(100vh-120px)]">
            <div className="border-b border-black/10 pb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#315f37]">
                Collections
              </p>
            </div>

            <nav className="mt-3 overflow-x-auto lg:overflow-visible">
              <div className="flex gap-2 pb-2 lg:block lg:pb-0">
                <Link
                  href="/products"
                  className="inline-flex shrink-0 items-center border-b border-transparent px-1 py-2 text-[18px] font-bold text-black transition-all duration-300 hover:border-[#c99545] hover:text-[#315f37] lg:flex"
                >
                  All Collections
                </Link>

                {allCategories.map((item) => {
                  const active = item.id === category.id;

                  return (
                    <Link
                      key={item.id}
                      href={`/categories/${item.slug}`}
                      className={`group relative inline-flex shrink-0 items-center px-1 py-2 text-[18px] font-bold transition-all duration-300 lg:flex ${
                        active
                          ? 'text-[#315f37]'
                          : 'text-black hover:translate-x-1 hover:text-[#315f37]'
                      }`}
                    >
                      <span>{item.name}</span>
                      <span
                        className={`ml-auto pl-3 text-[#c99545] transition-all duration-300 ${
                          active
                            ? 'translate-x-0 opacity-100'
                            : 'translate-x-[-5px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                        }`}
                      >
                        
                      </span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </aside>

          <section>
            <div className="mb-8 flex flex-col gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#315f37]">
                  Collection
                </p>

                <h1 className="mt-2 font-serif text-4xl font-light leading-none text-black sm:text-5xl">
                  {category.name}
                </h1>

                <p className="mt-3 text-sm text-black">
                  {products.length} {products.length === 1 ? 'piece' : 'pieces'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label
                  htmlFor="category-sort"
                  className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black"
                >
                  Sort by
                </label>

                <select
                  id="category-sort"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border-b border-black/20 bg-white px-2 py-2 text-sm text-black outline-none transition-colors focus:border-[#c99545]"
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
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 lg:gap-x-5 lg:gap-y-12">
                  {paginatedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group transition-transform duration-300 hover:-translate-y-1"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-14 flex flex-wrap items-center justify-center gap-2 border-t border-black/10 pt-8">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={currentPage === 1}
                      className="border border-black/15 bg-white px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black transition-all hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Previous
                    </button>

                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      const active = pageNumber === currentPage;

                      return (
                        <button
                          type="button"
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`min-w-10 border px-4 py-3 text-xs transition-all ${
                            active
                              ? 'border-[#c99545] bg-[#c99545] text-white'
                              : 'border-black/15 bg-white text-black hover:border-black hover:bg-black hover:text-white'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalPages, page + 1),
                        )
                      }
                      disabled={currentPage === totalPages}
                      className="border border-black/15 bg-white px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black transition-all hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="border-y border-black/10 py-20 text-center">
                <p className="font-serif text-xl text-black">
                  No products found in this category
                </p>

                <Link href="/products" className="btn-luxury mt-7">
                  Browse All Products 
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}







