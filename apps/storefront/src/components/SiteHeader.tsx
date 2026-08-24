'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { getCartTotals } from '@/lib/api';

const navigation = [
  { href: '/products', label: 'Shop' },
  { href: '/products?sort=newest', label: 'New arrivals' },
  { href: '/products', label: 'Collections' },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadCartCount();
    
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
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="hidden text-xs uppercase tracking-[0.14em] text-luxury-brown transition-colors hover:text-luxury-gold sm:inline"
          >
            Search
          </button>
          
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
          </div>
        </nav>
      )}
    </header>
  );
}
