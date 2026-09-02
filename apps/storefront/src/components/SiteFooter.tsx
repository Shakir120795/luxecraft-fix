import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-luxury-sand bg-luxury-night text-luxury-ivory">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="font-serif text-2xl tracking-[0.16em]">LUXECRAFT</Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-luxury-ivory/70">
              Handcrafted pieces, thoughtfully chosen for enduring homes around the world.
            </p>
          </div>
          
          {/* Shop Section */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.16em] text-luxury-gold">Shop</h2>
            <ul className="mt-4 space-y-3 text-sm text-luxury-ivory/70">
              <li>
                <Link href="/products" className="hover:text-luxury-gold transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?sort=newest" className="hover:text-luxury-gold transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/products?featured=true" className="hover:text-luxury-gold transition-colors">
                  Featured
                </Link>
              </li>
              <li>
                <Link href="/custom-design" className="hover:text-luxury-gold transition-colors">
                  Custom Design
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Customer Service Section */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.16em] text-luxury-gold">Customer Service</h2>
            <ul className="mt-4 space-y-3 text-sm text-luxury-ivory/70">
              <li>
                <Link href="/contact" className="hover:text-luxury-gold transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-luxury-gold transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-luxury-gold transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-luxury-gold transition-colors">
                  Returns
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Account Section */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.16em] text-luxury-gold">Account</h2>
            <ul className="mt-4 space-y-3 text-sm text-luxury-ivory/70">
              <li>
                <Link href="/account" className="hover:text-luxury-gold transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-luxury-gold transition-colors">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/account/addresses" className="hover:text-luxury-gold transition-colors">
                  Addresses
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-luxury-gold transition-colors">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal Section */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.16em] text-luxury-gold">Legal</h2>
            <ul className="mt-4 space-y-3 text-sm text-luxury-ivory/70">
              <li>
                <Link href="/privacy" className="hover:text-luxury-gold transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-luxury-gold transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-luxury-gold transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs tracking-wide text-luxury-ivory/55 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} LuxeCraft. Crafted with care.</span>
          <span>Quiet luxury · Indian craftsmanship · Worldwide</span>
        </div>
      </div>
    </footer>
  );
}
