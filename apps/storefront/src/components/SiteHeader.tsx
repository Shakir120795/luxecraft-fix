'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { getCartTotals, getStorefrontCategories, Category, isAuthenticated } from '@/lib/api';

const navigation = [
  { href: '/products', label: 'Shop' },
  { href: '/products?sort=newest', label: 'New arrivals' },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadCartCount();
    loadCategories();
    setIsAuth(isAuthenticated());
    
    // Refresh cart count every 5 seconds when page is visible
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
      setCategories(cats.slice(0, 8)); // Show top 8 categories
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-luxury-sand bg-luxury-cream/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center text-luxury-charcoal lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span className="text-xl" aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
        </button>

        <Link href="/" className="font-serif text-2xl tracking-[0.18em] text-luxury-charcoal sm:text-3xl">
          LUXECRAFT
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.label} href={item.href} className="text-xs uppercase tracking-[0.16em] text-luxury-brown transition-colors hover:text-luxury-gold">
              {item.label}
            </Link>
          ))}
          
          {/* Collections Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setCollectionsOpen(true)}
            onMouseLeave={() => setCollectionsOpen(false)}
          >
            <button className="text-xs uppercase tracking-[0.16em] text-luxury-brown transition-colors hover:text-luxury-gold">
              Collections {collectionsOpen ? '▴' : '▾'}
            </button>
            {collectionsOpen && categories.length > 0 && (
              <div className="absolute left-0 top-full mt-2 w-64 border border-luxury-sand bg-luxury-cream shadow-xl z-50">
                <div className="py-2">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      className="block px-4 py-2 text-sm text-luxury-charcoal hover:bg-luxury-beige hover:text-luxury-gold transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                  <Link
                    href="/products"
                    className="block px-4 py-2 text-sm font-serif text-luxury-gold hover:bg-luxury-beige transition-colors border-t border-luxury-sand mt-2"
                  >
                    View All →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="hidden text-xs uppercase tracking-[0.14em] text-luxury-brown transition-colors hover:text-luxury-gold sm:inline"
          >
            Search
          </button>
          
          <Link 
            href="/wishlist" 
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center border border-luxury-sand text-luxury-charcoal transition-colors hover:border-luxury-gold hover:text-luxury-gold"
            title="Wishlist"
          >
            <span className="text-base" aria-hidden="true">♡</span>
            <span className="sr-only">Wishlist</span>
          </Link>
          
          <Link 
            href={isAuth ? '/account' : '/auth/login'} 
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center border border-luxury-sand text-luxury-charcoal transition-colors hover:border-luxury-gold hover:text-luxury-gold"
            title={isAuth ? 'Account' : 'Login'}
          >
            <span className="text-base" aria-hidden="true">👤</span>
            <span className="sr-only">{isAuth ? 'Account' : 'Login'}</span>
          </Link>
          
          <Link href="/cart" className="inline-flex h-9 items-center border border-luxury-gold px-3 text-xs uppercase tracking-[0.14em] text-luxury-gold transition-colors hover:bg-luxury-gold hover:text-white">
            Cart {cartCount > 0 && <span className="ml-1 text-base leading-none" aria-hidden="true">{cartCount}</span>}
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className="border-t border-luxury-sand bg-luxury-beige px-4 py-4">
          <form onSubmit={handleSearch} className="mx-auto max-w-7xl">
            <div className="flex gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="input-luxury flex-1"
                autoFocus
              />
              <button type="submit" className="btn-luxury px-6 py-3">
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="border border-luxury-sand bg-luxury-cream px-4 py-3 text-luxury-brown hover:border-luxury-gold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {menuOpen && (
        <nav className="border-t border-luxury-sand bg-luxury-cream px-4 py-5 lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            {navigation.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className="font-serif text-xl text-luxury-charcoal">
                {item.label}
              </Link>
            ))}
            
            {/* Collections in Mobile Menu */}
            {categories.length > 0 && (
              <div className="border-t border-luxury-sand pt-4">
                <div className="font-serif text-lg text-luxury-gold mb-3">Collections</div>
                {categories.slice(0, 6).map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-luxury-charcoal hover:text-luxury-gold transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
            
            {/* Additional Mobile Links */}
            <div className="border-t border-luxury-sand pt-4 space-y-3">
              <Link href="/custom-design" onClick={() => setMenuOpen(false)} className="block text-luxury-charcoal hover:text-luxury-gold transition-colors">
                Custom Design
              </Link>
              <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="block text-luxury-charcoal hover:text-luxury-gold transition-colors">
                Wishlist
              </Link>
              <Link href={isAuth ? '/account' : '/auth/login'} onClick={() => setMenuOpen(false)} className="block text-luxury-charcoal hover:text-luxury-gold transition-colors">
                {isAuth ? 'My Account' : 'Login / Register'}
              </Link>
              <Link href="/contact" onClick={() => setMenuOpen(false)} className="block text-luxury-charcoal hover:text-luxury-gold transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
