'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStorefrontCategories, getProducts, getHero, Product, Category, HeroSection } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';

function getProductImage(product: Product) {
  return product.media?.find((media) => media.isMain)?.url || product.media?.[0]?.url || '';
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hero, setHero] = useState<HeroSection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  async function handleCategoryHover(category: Category) {
    setActiveCategory(category);
    setCategoryLoading(true);

    try {
      const items = await getProducts(4, category.id);
      setCategoryProducts(items);
    } catch (err) {
      console.error('Failed to load category products:', err);
      setCategoryProducts([]);
    } finally {
      setCategoryLoading(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [cats, prods, heroData] = await Promise.all([
          getStorefrontCategories(),
          getProducts(16),
          getHero(),
        ]);
        setHero(heroData);

        setCategories(cats);
        setProducts(prods.slice(0, 16));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const heroCategory = categories[0];
  const heroImage = hero?.imageUrl || heroCategory?.imageUrl || products[0]?.media?.find((media) => media.isMain)?.url || products[0]?.media?.[0]?.url || '';
  const sideCategoryTwo = categories[2];

  const sideImageOne = hero?.hero2ImageUrl || products[1]?.media?.find((media) => media.isMain)?.url || products[1]?.media?.[0]?.url || '';
    heroCategory?.imageUrl ||
    products[0]?.media?.find((media) => media.isMain)?.url ||
    products[0]?.media?.[0]?.url ||
    '';
  const sideImageTwo = hero?.hero3ImageUrl || products[2]?.media?.find((media) => media.isMain)?.url || products[2]?.media?.[0]?.url || '';
    products[1]?.media?.find((media) => media.isMain)?.url ||
    products[1]?.media?.[0]?.url ||
    '';

    products[2]?.media?.find((media) => media.isMain)?.url ||
    products[2]?.media?.[0]?.url ||
    '';

  return (
    <main className="bg-white text-luxury-charcoal">
      <section className="bg-[#f4f0eb] px-3 pt-3 sm:px-5 lg:px-6">
        <div className="grid min-h-[620px] grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr] lg:min-h-[720px]">

          <div className="relative min-h-[560px] overflow-hidden bg-[#40372f] lg:min-h-0">
            {(hero?.imageUrl || heroImage) ? (
              <img
                src={hero?.imageUrl || heroImage || '/luxecraft-hero-rug.png'}
                alt={hero?.product?.name || 'LuxeCraft luxury collection'}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#5a4b3e] via-[#3f362e] to-[#211d19]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            <div className="absolute bottom-7 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10">

              <h1 className="max-w-3xl whitespace-pre-line font-serif text-4xl font-light leading-[0.98] text-white sm:text-6xl lg:text-7xl">
                {hero?.title || 'Luxury crafted.\nWorldwide delivered.'}
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
                {hero?.subtitle ||
                  'Exquisite rugs, artisan crafts, and bespoke pieces made by master craftspeople from around the world.'}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {hero?.primaryCtaText !== '' && (
                  <Link
                    href={hero?.primaryCtaLink || '/products'}
                    className="inline-flex items-center justify-center bg-[#d4a556] px-7 py-3 text-xs font-medium uppercase tracking-[0.16em] text-black transition-colors hover:bg-white"
                  >
                    {hero?.primaryCtaText || 'Shop Now'}
                  </Link>
                )}

                {hero?.secondaryCtaText !== '' && (
                  <Link
                    href={hero?.secondaryCtaLink || '/custom-design'}
                    className="inline-flex items-center justify-center border border-white/60 bg-black/10 px-7 py-3 text-xs font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
                  >
                    {hero?.secondaryCtaText || 'Bespoke Design'}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:grid-rows-2">
            <Link
              href={hero?.hero2Link || '/products'}
              className="group relative min-h-[260px] overflow-hidden bg-[#ded7ce] lg:min-h-0"
            >
              {sideImageOne ? (
                <img
                  src={sideImageOne}
                  alt={hero?.hero2Title || 'Luxury collection'}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#cfc5b8] to-[#8d7f70]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5">
                <h2 className="mt-1 font-serif text-2xl text-white sm:text-3xl">
                  {hero?.hero2Title || 'Signature Rugs'}
                </h2>
              </div>
            </Link>

            <Link
              href={hero?.hero3Link || '/products'}
              className="group relative min-h-[260px] overflow-hidden bg-[#d8d0c5] lg:min-h-0"
            >
              {sideImageTwo ? (
                <img
                  src={sideImageTwo}
                  alt={hero?.hero3Title || 'Artisan collection'}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#b8aa98] to-[#6d6258]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5">
                <h2 className="mt-1 font-serif text-2xl text-white sm:text-3xl">
                  {hero?.hero3Title || 'Artisan Objects'}
                </h2>
              </div>
            </Link>
          </div>
        </div>
      </section>
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-6 py-10 sm:px-8 lg:grid-cols-3 lg:items-center lg:gap-12 lg:py-14">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-luxury-olive">
              The LuxeCraft Edit
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light leading-tight sm:text-4xl">
              Pieces with a story.
            </h2>
          </div>

          <p className="max-w-2xl text-sm leading-7 text-luxury-brown lg:col-span-2 lg:max-w-none">
            Discover handcrafted collections selected for timeless interiors,
            meaningful spaces, and collectors who value craftsmanship over
            trends.
          </p>
        </div>
      </section>

      {/* FEATURED COLLECTION SLIDER */}
      {!loading && categories.length > 0 && (
        <section className="border-y border-black/10 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 py-8 sm:px-8 sm:py-10 lg:py-12">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-olive">
                  Shop by collection
                </p>
                <h2 className="mt-2 font-serif text-4xl font-light leading-none sm:text-5xl">
                  Featured Collections
                </h2>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  aria-label="Previous collections"
                  onClick={() =>
                    document.getElementById('luxecraft-collection-slider')?.scrollBy({
                      left: -360,
                      behavior: 'smooth',
                    })
                  }
                  className="flex h-10 w-10 items-center justify-center border border-black/15 text-lg text-black transition-all duration-200 hover:border-black hover:bg-black hover:text-white"
                >
                  &larr;
                </button>

                <button
                  type="button"
                  aria-label="Next collections"
                  onClick={() =>
                    document.getElementById('luxecraft-collection-slider')?.scrollBy({
                      left: 360,
                      behavior: 'smooth',
                    })
                  }
                  className="flex h-10 w-10 items-center justify-center border border-black/15 text-lg text-black transition-all duration-200 hover:border-black hover:bg-black hover:text-white"
                >
                  &rarr;
                </button>
              </div>
            </div>

            <div
              id="luxecraft-collection-slider"
              className="luxecraft-collection-slider flex gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory"
            >
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group relative min-w-[76vw] snap-start overflow-hidden rounded-2xl bg-[#eee9e3] shadow-sm transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.14)] sm:min-w-[360px] lg:min-w-[390px]"
                >
                  <div className="relative aspect-[1.18] overflow-hidden">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#dfd5ca] to-[#a49381]" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent transition-colors duration-500 group-hover:from-[#173d20]/80 group-hover:via-[#173d20]/10 group-hover:to-transparent" />

                    <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6">
                      <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white">
                        Collection {String(index + 1).padStart(2, '0')}
                      </p>

                      <h3 className="mt-1 font-serif text-2xl leading-tight text-white transition-colors duration-300 group-hover:text-[#d4a556] sm:text-3xl">
                        {category.name}
                      </h3>

                      <span className="mt-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-white transition-all duration-300 group-hover:gap-3 group-hover:text-[#d4a556]">
                        Shop collection
                        <span>&rarr;</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <Link
                href="/products"
                className="text-[10px] font-semibold uppercase tracking-[0.17em] text-luxury-brown underline underline-offset-4 transition-colors hover:text-luxury-olive"
              >
                View all collections &rarr;
              </Link>

              <span className="text-[9px] uppercase tracking-[0.16em] text-black/40 sm:hidden">
                Swipe to explore
              </span>
            </div>
          </div>
        </section>
      )}
      {/* FEATURED PRODUCTS */}
      {!loading && products.length > 0 && (
        <section id="featured" className="border-y border-black/10 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 py-14 sm:px-8 sm:py-16 lg:py-20">

            <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 className="font-serif text-4xl font-light sm:text-5xl">The Collection</h2></div>
            </div>

            {error && (
              <div className="mb-8 border border-luxury-terracotta/40 bg-white px-4 py-3 text-sm text-luxury-charcoal">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-12">
              {products.slice(0, 16).map((product) => (
                <div key={product.id} className="min-w-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div><div className="mt-10 flex justify-center"><Link href="/products" className="inline-flex items-center border border-black/25 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white">View all products ?</Link></div>
          </div>
        </section>
      )}

      {/* BESPOKE CUSTOM DESIGN */}
      <section className="mx-auto max-w-[1400px] px-6 py-8 sm:px-8 sm:py-10 lg:py-12">
        <div className="grid items-stretch overflow-hidden rounded-2xl bg-[#193f42] lg:grid-cols-[2fr_3fr]">
          <div className="flex flex-col justify-center px-6 py-8 text-white sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d4a556]">
              Bespoke by LuxeCraft
            </p>

            <h2 className="mt-3 max-w-xl font-serif text-3xl font-light leading-[0.98] sm:text-4xl lg:text-5xl">
              Designed for your space.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white">
              Work directly with our custom design team to create a piece
              around your room, your palette, and your vision.
            </p>

            <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
              <div className="border-t border-white/20 pt-4">
                <span className="text-[10px] font-semibold tracking-[0.18em] text-[#d4a556]">
                  01
                </span>
                <p className="mt-2 font-serif text-lg text-white">
                  Share your vision
                </p>
              </div>

              <div className="border-t border-white/20 pt-4">
                <span className="text-[10px] font-semibold tracking-[0.18em] text-[#d4a556]">
                  02
                </span>
                <p className="mt-2 font-serif text-lg text-white">
                  Refine the details
                </p>
              </div>

              <div className="border-t border-white/20 pt-4">
                <span className="text-[10px] font-semibold tracking-[0.18em] text-[#d4a556]">
                  03
                </span>
                <p className="mt-2 font-serif text-lg text-white">
                  We handcraft it
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/custom-design"
                className="inline-flex items-center gap-3 bg-[#d4a556] px-7 py-3.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-black transition-all duration-300 hover:gap-4 hover:bg-white"
              >
                Start a custom design
                <span>&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden bg-[#756454] lg:aspect-[4/3]">
            {true ? (
              <img
                src="/luxecraft-bespoke-design.png"
                alt="LuxeCraft bespoke custom rug design studio"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#8d7a67] to-[#40372f]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

            <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8">
              <div className="max-w-sm border border-white/30 bg-black/55 p-5 backdrop-blur-[4px]">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white">
                  Your piece
                </p>
                <p className="mt-2 font-serif text-2xl text-white">
                  One design. Made around you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* WHY LUXECRAFT */}
      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-14 sm:px-8 sm:py-16 lg:py-20">
          <div className="mb-12 max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.24em] text-luxury-olive">
              The LuxeCraft standard
            </p>
            <h2 className="mt-3 font-serif text-4xl font-light sm:text-5xl">
              Craftsmanship without compromise.
            </h2>
          </div>

          <div className="grid grid-cols-1 divide-y border-y border-black/10 md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="px-0 py-8 md:px-8 md:py-5 md:first:pl-0">
              <span className="font-serif text-5xl text-luxury-gold">01</span>
              <h3 className="mt-5 font-serif text-2xl">Authentic Craftsmanship</h3>
              <p className="mt-3 text-sm leading-7 text-luxury-brown">
                Every piece is handcrafted with care by experienced artisans.
              </p>
              <Link
                href="/about"
                className="mt-5 inline-block text-[10px] uppercase tracking-[0.16em] text-luxury-olive underline underline-offset-4"
              >
              Our story &rarr;
              </Link>
            </div>

            <div className="px-0 py-8 md:px-8 md:py-5">
              <span className="font-serif text-5xl text-luxury-gold">02</span>
              <h3 className="mt-5 font-serif text-2xl">Worldwide Reach</h3>
              <p className="mt-3 text-sm leading-7 text-luxury-brown">
                Thoughtful shipping, customs support, and delivery worldwide.
              </p>
              <Link
                href="/shipping"
                className="mt-5 inline-block text-[10px] uppercase tracking-[0.16em] text-luxury-olive underline underline-offset-4"
              >
              Shipping information &rarr;
              </Link>
            </div>

            <div className="px-0 py-8 md:px-8 md:py-5 md:last:pr-0">
              <span className="font-serif text-5xl text-luxury-gold">03</span>
              <h3 className="mt-5 font-serif text-2xl">Made to Last</h3>
              <p className="mt-3 text-sm leading-7 text-luxury-brown">
                Timeless materials and considered construction for enduring
                beauty.
              </p>
              <Link
                href="/faq"
                className="mt-5 inline-block text-[10px] uppercase tracking-[0.16em] text-luxury-olive underline underline-offset-4"
              >
              Learn more &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LOADING */}
      {loading && (
        <section className="mx-auto max-w-[1400px] px-6 py-20 sm:px-8">
          <div className="border-y border-black/10 py-16 text-center">
            <div className="inline-flex items-center gap-3 text-luxury-brown">
              <div className="h-3 w-3 animate-pulse bg-luxury-gold" />
              <span className="font-serif">Loading luxury collection...</span>
            </div>
          </div>
        </section>
      )}

      {/* NEWSLETTER STRIP */}
      <section className="border-y border-black/10 bg-[#28231f] text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-6 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:py-8">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#d4a556]">
              From the studio
            </p>
            <h2 className="mt-1 font-serif text-2xl font-light sm:text-3xl">
              Stay in the know.
            </h2>
            <p className="mt-1 text-xs text-white/70">
              New collections, artisan stories, and occasional offers.
            </p>
          </div>

          <form
            className="flex w-full max-w-2xl flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              alert('Newsletter signup coming soon!');
            }}
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="min-h-11 flex-1 border border-white/25 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#d4a556]"
              required
            />
            <button
              type="submit"
              className="min-h-11 bg-[#d4a556] px-7 text-[10px] font-semibold uppercase tracking-[0.17em] text-black transition-colors hover:bg-white"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
























































