'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getCartTotals, getStorefrontCategories, getProductFilters, Category, ProductFilterSetting, isAuthenticated } from '@/lib/api';

const navigation = [
  { href: '/products', label: 'Shop' },
  { href: '/products?sort=newest', label: 'New Arrivals' },
  { href: '/products', label: 'Collections' },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M20.8 8.8c0 5.1-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.8A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.6Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.7-3.4 2.8-5.3 6.5-5.3s5.8 1.9 6.5 5.3" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M5.5 8.5h13l-.8 11h-11z" />
      <path d="M9 9V6.8a3 3 0 0 1 6 0V9" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productFilters, setProductFilters] = useState<ProductFilterSetting[]>([]);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [shippingIndex, setShippingIndex] = useState(0);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadCartCount();
    loadCategories();
    loadProductFilters();
    setIsAuth(isAuthenticated());

    const interval = setInterval(loadCartCount, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const container = categoryScrollRef.current;
    if (!container || openFilter) return;

    const interval = window.setInterval(() => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 8) return;

      if (container.scrollLeft >= maxScroll - 2) {
        container.scrollLeft = 0;
        return;
      }

      container.scrollLeft += 1;
    }, 28);

    return () => window.clearInterval(interval);
  }, [openFilter]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setShippingIndex((current) => (current + 1) % 3);
    }, 2600);

    return () => window.clearInterval(interval);
  }, []);

  async function loadCartCount() {
    try {
      const totals = await getCartTotals();
      setCartCount(totals.itemCount);
    } catch (error) {
      console.error('Failed to load cart count:', error);
    }
  }

  async function loadCategories() {
    try {
      const cats = await getStorefrontCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  async function loadProductFilters() {
    try {
      const filters = await getProductFilters();
      setProductFilters(filters.filter((filter) => filter.isActive));
    } catch (error) {
      console.error('Failed to load product filters:', error);
    }
  }

  function getHeaderFilter(slug: string) {
    return productFilters.find((filter) => filter.slug === slug);
  }

  function filterHref(slug: string, value: string) {
    return '/products?filter_' + encodeURIComponent(slug) + '=' + encodeURIComponent(value);
  }

  const rugCategories = categories
    .filter((category) => {
      const slug = category.slug.toLowerCase();
      const name = category.name.trim().toLowerCase();
      return !['crafts-statues', 'crafts', 'statues'].includes(slug) &&
        !['crafts & statues', 'crafts', 'statues'].includes(name);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  function categoryRugHref(category: Category) {
    const categoryQuery = category.name.trim().toLowerCase() === 'rugs'
      ? '/products'
      : '/products?category=' + encodeURIComponent(category.id);
    return categoryQuery;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    const query = searchQuery.trim();
    if (!query) return;

    window.location.href = `/search?q=${encodeURIComponent(query)}`;
    setSearchQuery('');
    setMobileSearchOpen(false);
    setMenuOpen(false);
  }

  const showCategoryBar =
    pathname === '/' ||
    pathname === '/products' ||
    pathname.startsWith('/categories/');

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[78px] items-center gap-3 sm:gap-5 lg:gap-8">
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-black transition-all duration-200 hover:-translate-y-0.5 hover:text-[#2f6b36] lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <MenuIcon open={menuOpen} />
          </button>
          <Link
            href="/"
            aria-label="Wolhomes"
            className="shrink-0"
          >
            <Image
              src="/wolhomes-header-logo.png"
              alt="Wolhomes"
              width={250}
              height={100}
              priority
              className="h-10 w-auto object-contain sm:h-11 lg:h-12"
            />
          </Link>

          <div className="hidden min-w-0 flex-1 lg:block">
            <form onSubmit={handleSearch}>
              <div className="mx-auto flex h-11 w-full max-w-[560px] overflow-hidden rounded-full border border-black/20 bg-[#faf8f5] transition-all duration-200 focus-within:border-black focus-within:shadow-sm">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for luxury rugs, crafts and more"
                  className="min-w-0 flex-1 border-0 bg-transparent px-5 text-sm text-black outline-none placeholder:text-[#77716c]"
                />
                <button
                  type="submit"
                  className="mr-1.5 my-1 flex w-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-all duration-200 hover:scale-105 hover:bg-[#2f6b36]"
                  aria-label="Search"
                >
                  <SearchIcon />
                </button>
              </div>
            </form>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setMobileSearchOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center text-black transition-all duration-200 hover:-translate-y-0.5 hover:text-[#2f6b36] lg:hidden"
              aria-label="Search"
            >
              <SearchIcon />
            </button>

            <Link
              href="/wishlist"
              className="inline-flex h-11 w-11 items-center justify-center text-black transition-all duration-200 hover:-translate-y-0.5 hover:text-[#2f6b36]"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <HeartIcon />
            </Link>

            <div
              className="relative"
            >
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className={`inline-flex h-11 w-11 items-center justify-center text-black transition-all duration-200 hover:-translate-y-0.5 hover:text-[#2f6b36] ${
                  accountOpen ? 'text-[#2f6b36]' : ''
                }`}
                title={isAuth ? 'Account' : 'Login'}
                aria-label={isAuth ? 'Account menu' : 'Login menu'}
                aria-expanded={accountOpen}
              >
                <UserIcon />
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full z-50 w-56 pt-3">
                  <div className="overflow-hidden rounded-xl border border-black/10 bg-white p-2 shadow-[0_18px_45px_rgba(0,0,0,0.14)]">
                    <div className="border-b border-black/10 px-4 py-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#2f6b36]">
                        {isAuth ? 'Your account' : 'Welcome'}
                      </p>
                      <p className="mt-1 font-serif text-lg text-black">
                        {isAuth ? 'My Profile' : 'Sign in to Wolhomes'}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href={isAuth ? '/account' : '/auth/login'}
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center justify-between rounded-lg px-4 py-3 text-sm text-black transition-all duration-200 hover:bg-[#f4f0eb] hover:pl-5 hover:text-[#2f6b36]"
                      >
                        {isAuth ? 'My Account' : 'Sign In'}
                        <span>&rarr;</span>
                      </Link>

                      {isAuth && (
                        <>
                          <Link
                            href="/account/orders"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center justify-between rounded-lg px-4 py-3 text-sm text-black transition-all duration-200 hover:bg-[#f4f0eb] hover:pl-5 hover:text-[#2f6b36]"
                          >
                            Orders
                            <span>&rarr;</span>
                          </Link>
                          <Link
                            href="/account/addresses"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center justify-between rounded-lg px-4 py-3 text-sm text-black transition-all duration-200 hover:bg-[#f4f0eb] hover:pl-5 hover:text-[#2f6b36]"
                          >
                            Addresses
                            <span>&rarr;</span>
                          </Link>
                        </>
                      )}

                      <Link
                        href="/wishlist"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center justify-between rounded-lg px-4 py-3 text-sm text-black transition-all duration-200 hover:bg-[#f4f0eb] hover:pl-5 hover:text-[#2f6b36]"
                      >
                        Wishlist
                        <span>&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/cart"
              className="relative inline-flex h-11 w-11 items-center justify-center text-black transition-all duration-200 hover:-translate-y-0.5 hover:text-[#2f6b36]"
              title="Cart"
              aria-label="Cart"
            >
              <BagIcon />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B94740] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="border-t border-black/10 py-3 lg:hidden">
            <form onSubmit={handleSearch}>
              <div className="flex h-11 overflow-hidden rounded-full border border-black/20 bg-[#faf8f5]">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for luxury rugs, crafts and more"
                  className="min-w-0 flex-1 border-0 bg-transparent px-4 text-sm text-black outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="mr-1 my-1 flex w-9 items-center justify-center rounded-full bg-black text-white"
                  aria-label="Search"
                >
                  <SearchIcon />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {showCategoryBar && (
        <div
          className="relative z-50 border-t border-black/10 bg-[#B94740]"
          onMouseLeave={() => {
            if (window.matchMedia('(min-width: 1024px)').matches) {
              setOpenFilter(null);
            }
          }}
        >
          <div
            ref={categoryScrollRef}
            className="luxecraft-category-scroll mx-auto flex max-w-[1400px] items-stretch overflow-x-auto scroll-smooth px-4 sm:px-6 lg:px-8"
          >
            <nav
              className="flex shrink-0 items-stretch whitespace-nowrap"
              aria-label="Product navigation"
            >
              {[
                { label: 'Rugs', slug: 'rugs' },
                { label: 'Colour', slug: 'color' },
                { label: 'Size', slug: 'size' },
                { label: 'Style', slug: 'style' },
                { label: 'Material', slug: 'material' },
              ].map((item) => {
                const filter = getHeaderFilter(item.slug);
                const isRugs = item.slug === 'rugs';
                const isOpen = openFilter === item.slug;
                const values = filter?.values?.filter((value) => value.isActive !== false) ?? [];

                return (
                  <div
                    key={item.slug}
                    className="relative shrink-0"
                  >
                    <button
                      type="button"
                      onMouseEnter={() => {
                        if (window.matchMedia('(min-width: 1024px)').matches && (filter || isRugs)) {
                          setOpenFilter(item.slug);
                        }
                      }}
                      onClick={() => {
                        if (isRugs || filter) {
                          setOpenFilter((current) => current === item.slug ? null : item.slug);
                          return;
                        }

                        window.location.href = '/products';
                      }}
                      className={`block whitespace-nowrap px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.13em] text-white transition-all duration-200 hover:bg-black/15 sm:px-5 sm:py-2 sm:text-[16px] ${isOpen ? 'bg-black/15' : ''}`}
                      aria-haspopup="menu"
                      aria-expanded={isOpen}
                    >
                      {item.label}
                    </button>

                    {isOpen && (
                      <div
                        className={isRugs
                          ? "absolute left-0 top-full z-[60] hidden w-[500px] max-w-[calc(100vw-32px)] origin-top rounded-b-xl border border-black/10 bg-[#fffdf9] p-4 shadow-[0_18px_45px_rgba(48,43,53,0.20)] lg:block"
                          : "absolute left-0 top-full z-[60] hidden min-w-[250px] origin-top rounded-b-xl border border-black/10 bg-[#fffdf9] p-3 shadow-[0_18px_45px_rgba(48,43,53,0.18)] lg:block"
                        }
                      >
                        {isRugs ? (
                          <>
                            <div className="mb-3 flex items-end justify-between border-b border-[#e7ded4] px-2 pb-3">
                              <div>
                                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#2f6b36]">Wolhomes Rugs</p>
                                <p className="mt-1 font-serif text-xl text-[#2b2118]">Explore Rug Categories</p>
                              </div>
                              <Link
                                href="/products"
                                onClick={() => setOpenFilter(null)}
                                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a5a2c] transition-colors hover:text-[#2f6b36]"
                              >
                                View all
                              </Link>
                            </div>

                            {rugCategories.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
                                {rugCategories.map((category) => (
                                  <Link
                                    key={category.id}
                                    href={categoryRugHref(category)}
                                    onClick={() => setOpenFilter(null)}
                                    className="group flex items-center justify-between rounded-lg border border-transparent bg-white px-3.5 py-3 text-sm text-[#2b2118] transition-all duration-200 hover:border-[#d9c8a9] hover:bg-[#f4f0eb] hover:shadow-sm"
                                  >
                                    <span className="min-w-0 truncate font-medium">{category.name}</span>
                                    <span className="ml-3 text-[#7a5a2c] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">→</span>
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <Link
                                href="/products"
                                onClick={() => setOpenFilter(null)}
                                className="block rounded-lg bg-white px-4 py-3 text-sm font-medium text-[#2b2118] transition hover:bg-[#f4f0eb]"
                              >
                                View all rugs
                              </Link>
                            )}
                          </>
                        ) : values.length > 0 ? (
                          values.map((value) => (
                            <Link
                              key={value.slug}
                              href={filterHref(item.slug, value.slug)}
                              onClick={() => setOpenFilter(null)}
                              className="group flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-[#2b2118] transition-all duration-150 hover:bg-[#f4f0eb] hover:pl-5 hover:text-[#2f6b36]"
                            >
                              <span>{value.label}</span>
                              <span className="text-[#b94740] opacity-0 transition-opacity duration-150 group-hover:opacity-100">→</span>
                            </Link>
                          ))
                        ) : (
                          <Link
                            href="/products"
                            onClick={() => setOpenFilter(null)}
                            className="group flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-[#2b2118] transition-all duration-150 hover:bg-[#f4f0eb] hover:text-[#2f6b36]"
                          >
                            <span>View all {item.label.toLowerCase()}</span>
                            <span className="text-[#b94740] opacity-0 transition-opacity duration-150 group-hover:opacity-100">→</span>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <Link
                href="/products"
                className="block shrink-0 whitespace-nowrap px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.13em] text-white transition-colors duration-200 hover:bg-black/15 sm:px-5 sm:py-2 sm:text-[16px]"
                onClick={() => setOpenFilter(null)}
              >
                Crafts &amp; Statues
              </Link>
            </nav>

            <Link
              href="/custom-design"
              className="my-1.5 ml-1 shrink-0 rounded-lg border border-[#E8C98A] bg-[#E8C98A] px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#2b2118] transition-all duration-200 hover:border-black hover:bg-black hover:text-white sm:px-2 sm:py-1 sm:text-[16px]"
            >
              Custom Design
            </Link>
          </div>

          <div className="pointer-events-none absolute left-0 right-0 top-full z-[110] px-4 hidden lg:block">
            {openFilter && (
              <div className="pointer-events-auto max-h-[70vh] overflow-y-auto rounded-xl border border-black/10 bg-[#fffdf9] p-4 shadow-[0_18px_45px_rgba(48,43,53,0.22)]">
                {openFilter === 'rugs' ? (
                  <>
                    <div className="mb-3 flex items-end justify-between border-b border-[#e7ded4] px-2 pb-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#2f6b36]">Wolhomes Rugs</p>
                        <p className="mt-1 font-serif text-xl text-[#2b2118]">Explore Rug Categories</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenFilter(null)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f0eb] text-lg text-[#2b2118]"
                        aria-label="Close menu"
                      >
                        ×
                      </button>
                    </div>
                    {rugCategories.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {rugCategories.map((category) => (
                          <Link
                            key={category.id}
                            href={categoryRugHref(category)}
                            onClick={() => setOpenFilter(null)}
                            className="group flex items-center justify-between rounded-lg border border-transparent bg-white px-3.5 py-3 text-sm text-[#2b2118] transition-all duration-200 hover:border-[#d9c8a9] hover:bg-[#f4f0eb]"
                          >
                            <span className="font-medium">{category.name}</span>
                            <span className="ml-3 text-[#7a5a2c]">→</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Link
                        href="/products"
                        onClick={() => setOpenFilter(null)}
                        className="block rounded-lg bg-white px-4 py-3 text-sm font-medium text-[#2b2118]"
                      >
                        View all rugs
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-3 flex items-center justify-between border-b border-[#e7ded4] px-2 pb-2">
                      <p className="font-serif text-xl capitalize text-[#2b2118]">{openFilter}</p>
                      <button
                        type="button"
                        onClick={() => setOpenFilter(null)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f0eb] text-lg text-[#2b2118]"
                        aria-label="Close menu"
                      >
                        ×
                      </button>
                    </div>
                    {getHeaderFilter(openFilter)?.values?.length ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {getHeaderFilter(openFilter)?.values
                          .filter((value) => value.isActive !== false)
                          .map((value) => (
                            <Link
                              key={value.slug}
                              href={filterHref(openFilter, value.slug)}
                              onClick={() => setOpenFilter(null)}
                              className="rounded-lg bg-white px-4 py-3 text-sm font-medium text-[#2b2118] transition hover:bg-[#f4f0eb] hover:text-[#2f6b36]"
                            >
                              {value.label}
                            </Link>
                          ))}
                      </div>
                    ) : (
                      <Link
                        href="/products"
                        onClick={() => setOpenFilter(null)}
                        className="flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm font-medium text-[#2b2118]"
                      >
                        <span>View all {openFilter}</span>
                        <span>→</span>
                      </Link>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute left-0 right-0 top-full z-[100] px-2 lg:hidden">
            {openFilter && (
              <div className="pointer-events-auto relative mt-1 max-h-[65vh] overflow-y-auto rounded-xl border border-black/10 bg-[#fffdf9] p-3 shadow-[0_18px_45px_rgba(48,43,53,0.20)]">
                {openFilter === 'rugs' ? (
                  <>
                    <div className="mb-2 flex items-center justify-between border-b border-[#e7ded4] px-2 pb-2">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#2f6b36]">Wolhomes Rugs</p>
                        <p className="mt-1 font-serif text-lg text-[#2b2118]">Explore Rug Categories</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenFilter(null)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f0eb] text-lg text-[#2b2118]"
                        aria-label="Close menu"
                      >
                        ×
                      </button>
                    </div>

                    {rugCategories.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {rugCategories.map((category) => (
                          <Link
                            key={category.id}
                            href={categoryRugHref(category)}
                            onClick={() => setOpenFilter(null)}
                            className="rounded-lg bg-white px-3 py-3 text-sm font-medium text-[#2b2118] shadow-sm"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Link
                        href="/products"
                        onClick={() => setOpenFilter(null)}
                        className="block rounded-lg bg-white px-4 py-3 text-sm font-medium text-[#2b2118]"
                      >
                        View all rugs
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-2 flex items-center justify-between border-b border-[#e7ded4] px-2 pb-2">
                      <p className="font-serif text-lg capitalize text-[#2b2118]">
                        {openFilter}
                      </p>
                      <button
                        type="button"
                        onClick={() => setOpenFilter(null)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f0eb] text-lg text-[#2b2118]"
                        aria-label="Close menu"
                      >
                        ×
                      </button>
                    </div>

                    {getHeaderFilter(openFilter)?.values?.length ? (
                      <div className="divide-y divide-[#eee6dc]">
                        {getHeaderFilter(openFilter)?.values
                          .filter((value) => value.isActive !== false)
                          .map((value) => (
                            <Link
                              key={value.slug}
                              href={filterHref(openFilter, value.slug)}
                              onClick={() => setOpenFilter(null)}
                              className="flex items-center justify-between px-3 py-3 text-sm font-medium text-[#2b2118]"
                            >
                              <span>{value.label}</span>
                              <span className="text-[#b94740]">→</span>
                            </Link>
                          ))}
                      </div>
                    ) : (
                      <Link
                        href="/products"
                        onClick={() => setOpenFilter(null)}
                        className="flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm font-medium text-[#2b2118]"
                      >
                        <span>View all {openFilter}</span>
                        <span>→</span>
                      </Link>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {pathname === '/' && (
        <Link
          href="/products"
          aria-label="Shop products with free worldwide shipping"
          className="luxecraft-shipping-promo block overflow-hidden border-t border-black/10 bg-black px-0 py-2 transition-all duration-300 sm:py-2.5"
        >
          <div className="overflow-hidden whitespace-nowrap">
            <div className="luxecraft-shipping-track">
              {[0, 1].map((copy) => (
                <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-10 pr-10 sm:gap-16 sm:pr-16">
                  <span className="luxecraft-shipping-text text-[11px] font-extrabold uppercase tracking-[0.14em] text-white sm:text-[14px] sm:tracking-[0.18em]">✅ Fast delivery</span>
                  <span className="luxecraft-shipping-text text-[11px] font-extrabold uppercase tracking-[0.14em] text-white sm:text-[14px] sm:tracking-[0.18em]">✅ 14 days return policy</span>
                  <span className="luxecraft-shipping-text text-[11px] font-extrabold uppercase tracking-[0.14em] text-white sm:text-[14px] sm:tracking-[0.18em]">✅ FREE SHIPPING • WORLDWIDE</span>
                </div>
              ))}
            </div>
          </div>
        </Link>
      )}

      {menuOpen && (
        <nav className="border-t border-black/10 bg-white px-5 py-6 lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
            {navigation.map((item, index) => (
              <Link
                key={`${item.label}-${index}`}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="font-serif text-xl text-black transition-colors hover:text-[#2f6b36]"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/custom-design"
              onClick={() => setMenuOpen(false)}
              className="font-serif text-xl text-[#7a5a2c] transition-colors hover:text-[#2f6b36]"
            >
              Custom Design
            </Link>

            {categories.length > 0 && (
              <div className="mt-2 border-t border-black/10 pt-5">
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f6b36]">
                  Collections
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {categories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm text-black transition-all hover:bg-[#f4f0eb] hover:text-[#2f6b36]"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2 grid grid-cols-3 gap-2 border-t border-black/10 pt-5">
              <Link
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg bg-[#f8f6f2] px-3 py-3 text-center text-sm text-black transition-all hover:bg-black hover:text-white"
              >
                Wishlist
              </Link>

              <Link
                href={isAuth ? '/account' : '/auth/login'}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg bg-[#f8f6f2] px-3 py-3 text-center text-sm text-black transition-all hover:bg-black hover:text-white"
              >
                {isAuth ? 'Account' : 'Login'}
              </Link>

              <Link
                href="/cart"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg bg-[#f8f6f2] px-3 py-3 text-center text-sm text-black transition-all hover:bg-black hover:text-white"
              >
                Cart{cartCount > 0 ? ` (${cartCount})` : ''}
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}



