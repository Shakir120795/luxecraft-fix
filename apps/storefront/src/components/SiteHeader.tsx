'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
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
  const [activeHeaderMenu, setActiveHeaderMenu] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    loadCartCount();
    loadCategories();
    loadProductFilters();
    setIsAuth(isAuthenticated());

    const interval = setInterval(loadCartCount, 5000);
    return () => clearInterval(interval);
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

  function goToProductFilter(filterSlug: string, value: string) {
    if (!value) return;
    window.location.href = '/products?filter_' + encodeURIComponent(filterSlug) + '=' + encodeURIComponent(value);
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
              onMouseEnter={() => setAccountOpen(true)}
              onMouseLeave={() => setAccountOpen(false)}
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
        <div className="relative z-50 border-t border-black/10 bg-[#B94740]">
          <div className="mx-auto flex max-w-[1400px] items-stretch justify-between px-4 sm:px-6 lg:px-8">
            <nav className="flex min-w-0 items-stretch overflow-visible whitespace-nowrap" aria-label="Product navigation">
              <div
                className="group relative shrink-0"
                onMouseEnter={() => setActiveHeaderMenu('rugs')}
                onMouseLeave={() => setActiveHeaderMenu(null)}
              >
                <Link
                  href="/products"
                  className={`block whitespace-nowrap px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.13em] text-white transition-colors duration-200 hover:bg-black/15 ${activeHeaderMenu === 'rugs' ? 'bg-black/15' : ''}`}
                >
                  Rugs
                </Link>

                {categories.length > 0 && (
                  <div
                    className={`absolute left-0 top-full z-[100] w-[min(760px,calc(100vw-32px))] rounded-b-xl border border-black/10 bg-white p-5 text-black shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-all duration-150 ${
                      activeHeaderMenu === 'rugs'
                        ? 'visible pointer-events-auto opacity-100'
                        : 'invisible pointer-events-none opacity-0 group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100'
                    }`
                    onMouseEnter={() => setActiveHeaderMenu('rugs')}
                  >
                    <div className="mb-4 border-b border-black/10 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f6b36]">
                      Rug Categories
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 md:grid-cols-3">
                      {categories.map((category) => (
                        <Link
                          key={category.id}
                          href={'/categories/' + category.slug}
                          className="border-b border-black/10 px-2 py-2.5 text-sm text-black transition-colors duration-150 hover:bg-[#f4f0eb] hover:text-[#2f6b36]"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/products"
                      className="mt-4 inline-block border-t border-black/10 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a5a2c] hover:text-[#2f6b36]"
                    >
                      View all rugs →
                    </Link>
                  </div>
                )}
              </div>

              {(['color', 'size', 'style', 'material'] as const).map((slug) => {
                const filter = productFilters.find((item) => item.slug === slug);
                if (!filter) return null;

                const label = slug === 'color' ? 'Colour' : filter.name;

                return (
                  <div
                    key={slug}
                    className="group relative shrink-0"
                    onMouseEnter={() => setActiveHeaderMenu(slug)}
                    onMouseLeave={() => setActiveHeaderMenu(null)}
                  >
                    <Link
                      href={'/products?filter_' + filter.slug}
                      className={`block whitespace-nowrap px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.13em] text-white transition-colors duration-200 hover:bg-black/15 ${activeHeaderMenu === slug ? 'bg-black/15' : ''}`}
                    >
                      {label}
                    </Link>

                    {filter.values.length > 0 && (
                      <div
                        className={`absolute left-0 top-full z-[100] w-[420px] rounded-b-xl border border-black/10 bg-white p-5 text-black shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-all duration-150 ${
                          activeHeaderMenu === slug
                            ? 'visible pointer-events-auto opacity-100'
                            : 'invisible pointer-events-none opacity-0 group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100'
                        }`
                        onMouseEnter={() => setActiveHeaderMenu(slug)}
                      >
                        <div className="mb-4 border-b border-black/10 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f6b36]">
                          {label}
                        </div>
                        <div className="grid max-h-[340px] grid-cols-2 gap-x-6 gap-y-1 overflow-y-auto">
                          {filter.values
                            .filter((value) => value.isActive)
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((value) => (
                              <Link
                                key={value.slug}
                                href={'/products?filter_' + filter.slug + '=' + encodeURIComponent(value.slug)}
                                className="border-b border-black/10 px-2 py-2.5 text-sm text-black transition-colors duration-150 hover:bg-[#f4f0eb] hover:text-[#2f6b36]"
                              >
                                {value.label}
                              </Link>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <Link
              href="/custom-design"
              className="my-1.5 shrink-0 rounded-lg border border-[#E8C98A] bg-[#E8C98A] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2b2118] transition-all duration-200 hover:border-black hover:bg-black hover:text-white"
            >
              Custom Design
            </Link>
          </div>
        </div>
      )}

      {pathname === '/' && (
        <Link
          href="/products"
          aria-label="Shop products with free worldwide shipping"
          className="luxecraft-shipping-promo block border-t border-black/10 bg-black px-3 py-2 transition-all duration-300 sm:px-6 sm:py-2.5"
        >
          <div className="grid w-full grid-cols-1 items-center text-center sm:grid-cols-3">
            <span className="luxecraft-shipping-text text-white text-[11px] font-extrabold uppercase tracking-[0.14em] sm:text-[14px] sm:tracking-[0.18em]">
              Fast delivery
            </span>
            <span className="luxecraft-shipping-text hidden text-white text-[14px] font-extrabold uppercase tracking-[0.18em] sm:block">
              14 days return policy
            </span>
            <span className="luxecraft-shipping-text hidden text-white text-[14px] font-extrabold uppercase tracking-[0.18em] sm:block">
              FREE SHIPPING • WORLDWIDE
            </span>
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



