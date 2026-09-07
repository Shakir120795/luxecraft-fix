'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { getCartTotals, getStorefrontCategories, Category, isAuthenticated } from '@/lib/api';

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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M20.8 8.8c0 5.1-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.8A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.6Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.7-3.4 2.8-5.3 6.5-5.3s5.8 1.9 6.5 5.3" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M5.5 8.5h13l-.8 11h-11z" />
      <path d="M9 9V6.8a3 3 0 0 1 6 0V9" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAuth, setIsAuth] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    loadCartCount();
    loadCategories();
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
      setCategories(cats.slice(0, 8));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[78px] items-center gap-5 lg:gap-7">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-black lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <span className="text-2xl leading-none" aria-hidden="true">
              {menuOpen ? 'Ã—' : 'â˜°'}
            </span>
          </button>

          <Link
            href="/"
            className="shrink-0 font-serif text-[24px] tracking-[0.19em] text-black transition-opacity duration-200 hover:opacity-70 sm:text-[27px]"
          >
            LUXECRAFT
          </Link>

          <form
            onSubmit={handleSearch}
            className="absolute left-1/2 hidden w-[min(46vw,560px)] -translate-x-1/2 lg:block"
          >
            <div className="group flex h-11 w-full items-center overflow-hidden rounded-full border border-[#aaa4a0] bg-white transition-all duration-200 focus-within:border-black focus-within:shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for luxury rugs, crafts and more"
                className="min-w-0 flex-1 border-0 bg-transparent px-5 text-sm text-black outline-none placeholder:text-[#77716c]"
              />
              <button
                type="submit"
                className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-transform duration-200 hover:scale-105 hover:bg-[#2f6b36]"
                aria-label="Search"
              >
                <SearchIcon />
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center text-black transition-colors hover:text-[#2f6b36] lg:hidden"
              aria-label="Search"
            >
              <SearchIcon />
            </button>

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <Link
              href="/wishlist"
              className="inline-flex h-10 w-10 items-center justify-center text-black transition-transform duration-200 hover:-translate-y-0.5 hover:text-[#2f6b36]"
              title="Wishlist"
            >
              <HeartIcon />
              <span className="sr-only">Wishlist</span>
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setAccountOpen(true)}
              onMouseLeave={() => setAccountOpen(false)}
            >
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className={`inline-flex h-10 w-10 items-center justify-center text-black transition-all duration-200 hover:-translate-y-0.5 hover:text-[#2f6b36] ${
                  accountOpen ? 'text-[#2f6b36]' : ''
                }`}
                title={isAuth ? 'Account' : 'Login'}
                aria-label={isAuth ? 'Account menu' : 'Login menu'}
                aria-expanded={accountOpen}
              >
                <UserIcon />
                <span className="sr-only">{isAuth ? 'Account' : 'Login'}</span>
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full z-50 w-56 pt-3">
                  <div className="overflow-hidden rounded-xl border border-black/10 bg-white p-2 shadow-[0_18px_45px_rgba(0,0,0,0.14)] animate-[fadeIn_.2s_ease-out]">
                    <div className="border-b border-black/10 px-4 py-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#2f6b36]">
                        {isAuth ? 'Your account' : 'Welcome'}
                      </p>
                      <p className="mt-1 font-serif text-lg text-black">
                        {isAuth ? 'My Profile' : 'Sign in to LuxeCraft'}
                      </p>
                    </div>

                    <div className="py-1">
                      {isAuth ? (
                        <>
                          <Link
                            href="/account"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center justify-between rounded-lg px-4 py-3 text-sm text-black transition-all duration-200 hover:bg-[#f4f0eb] hover:pl-5 hover:text-[#2f6b36]"
                          >
                            My Account
                            <span>â†’</span>
                          </Link>

                          <Link
                            href="/account/orders"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center justify-between rounded-lg px-4 py-3 text-sm text-black transition-all duration-200 hover:bg-[#f4f0eb] hover:pl-5 hover:text-[#2f6b36]"
                          >
                            Orders
                            <span>â†’</span>
                          </Link>

                          <Link
                            href="/account/addresses"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center justify-between rounded-lg px-4 py-3 text-sm text-black transition-all duration-200 hover:bg-[#f4f0eb] hover:pl-5 hover:text-[#2f6b36]"
                          >
                            Addresses
                            <span>â†’</span>
                          </Link>

                          <Link
                            href="/wishlist"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center justify-between rounded-lg px-4 py-3 text-sm text-black transition-all duration-200 hover:bg-[#f4f0eb] hover:pl-5 hover:text-[#2f6b36]"
                          >
                            Wishlist
                            <span>â†’</span>
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/auth/login"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-black transition-all duration-200 hover:bg-[#f4f0eb] hover:pl-5 hover:text-[#2f6b36]"
                        >
                          Login / Register
                          <span>â†’</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center text-black transition-transform duration-200 hover:-translate-y-0.5 hover:text-[#2f6b36]"
              title="Cart"
            >
              <BagIcon />
              {cartCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#c99545] px-1 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-black/10 pb-4 pt-3 lg:hidden">
            <form onSubmit={handleSearch}>
              <div className="flex h-11 overflow-hidden rounded-full border border-[#aaa4a0] bg-white">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for luxury rugs, crafts and more"
                  className="min-w-0 flex-1 border-0 bg-transparent px-4 text-sm outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="m-1 flex w-10 items-center justify-center rounded-full bg-black text-white"
                  aria-label="Search"
                >
                  <SearchIcon />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      {(pathname === "/" || pathname === "/products") && categories.length > 0 && (
        <div className="border-t border-black/10 bg-white">
          <div className="relative mx-auto max-w-[1400px] px-10 py-3 sm:px-12">
            <button type="button" aria-label="Scroll categories left" onClick={() => document.getElementById("site-category-scroll")?.scrollBy({ left: -260, behavior: "smooth" })} className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-sm transition-all hover:border-black hover:bg-black hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div id="site-category-scroll" className="flex items-center justify-center gap-7 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link href="/products" className="shrink-0 py-1 text-[12px] font-semibold uppercase tracking-[0.17em] text-luxury-brown transition-colors hover:text-[#2f6b36]">All Collections</Link>
              {categories.map((category) => (
                <Link key={category.id} href={`/categories/${category.slug}`} className="shrink-0 py-1 text-[12px] font-semibold uppercase tracking-[0.17em] text-luxury-brown transition-colors hover:text-[#2f6b36]">
                  {category.name}
                </Link>
              ))}
              <Link href="/custom-design" className="shrink-0 border border-[#c69b52]/60 bg-[#faf7f1] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.17em] text-[#8a6730] transition-all duration-300 hover:border-[#c69b52] hover:bg-[#c69b52] hover:text-white">Custom Design</Link>
            </div>
            <button type="button" aria-label="Scroll categories right" onClick={() => document.getElementById("site-category-scroll")?.scrollBy({ left: 260, behavior: "smooth" })} className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-sm transition-all hover:border-black hover:bg-black hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      )}
      {menuOpen && (
        <nav
          className="border-t border-black/10 bg-white px-5 py-6 lg:hidden"
          aria-label="Mobile navigation"
        >
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

            <div className="border-t border-black/10 pt-5">
              <Link
                href="/custom-design"
                onClick={() => setMenuOpen(false)}
                className="font-serif text-xl text-[#7a5a2c] transition-colors hover:text-[#2f6b36]"
              >
                Custom Design â†’
              </Link>

              {categories.length > 0 && (
                <div className="mt-5 border-t border-black/10 pt-5">
                  <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f6b36]">
                    Collections
                  </div>

                  {categories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="block py-2 text-sm text-black transition-colors hover:text-[#2f6b36]"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-5 flex gap-5 border-t border-black/10 pt-5">
                <Link
                  href="/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-black hover:text-[#2f6b36]"
                >
                  Wishlist
                </Link>

                <Link
                  href={isAuth ? '/account' : '/auth/login'}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-black hover:text-[#2f6b36]"
                >
                  {isAuth ? 'Account' : 'Login'}
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-black hover:text-[#2f6b36]"
                >
                  Cart{cartCount > 0 ? ` (${cartCount})` : ''}
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}














