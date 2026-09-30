'use client';

import Link from 'next/link';
import Image from 'next/image';

export function SiteFooter() {
  return (
    <footer className="border-t border-[rgb(var(--luxecraft-border))] bg-[rgb(var(--luxecraft-cream))] text-[rgb(var(--luxecraft-ink))]">
      <div className="mx-auto max-w-[1400px] px-6 py-11 sm:px-8 lg:px-10">

        <div className="grid items-start gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1fr_0.8fr] lg:gap-16">

          <div>
            <Link
              href="/"
              aria-label="Wolhomes"
              className="inline-flex items-center transition-opacity hover:opacity-70"
            >
              <Image
                src="/wolhomes-header-logo.png"
                alt="Wolhomes"
                width={250}
                height={100}
                className="h-12 w-auto object-contain sm:h-14"
              />
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-7 text-black">
              Handcrafted pieces, thoughtfully chosen for enduring homes around
              the world.
            </p>
          </div>

          <div>
            <h2 className="whitespace-nowrap text-[16px] font-bold uppercase tracking-[0.1em] text-[#315f37]">
              Shop
            </h2>

            <ul className="mt-5 space-y-3 text-sm text-black">
              <li>
                <Link href="/products" className="transition-colors hover:text-[rgb(var(--luxecraft-olive))]">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?sort=newest" className="transition-colors hover:text-[rgb(var(--luxecraft-olive))]">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/products?featured=true" className="transition-colors hover:text-[rgb(var(--luxecraft-olive))]">
                  Featured
                </Link>
              </li>
              <li>
                <Link href="/custom-design" className="transition-colors hover:text-[rgb(var(--luxecraft-olive))]">
                  Custom Design
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="whitespace-nowrap text-[16px] font-bold uppercase tracking-[0.1em] text-[#315f37]">
              Customer Service
            </h2>

            <ul className="mt-5 space-y-3 text-sm text-black">
              <li>
                <Link href="/contact" className="transition-colors hover:text-[rgb(var(--luxecraft-olive))]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-[rgb(var(--luxecraft-olive))]">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/returns" className="transition-colors hover:text-[rgb(var(--luxecraft-olive))]">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="whitespace-nowrap text-[16px] font-bold uppercase tracking-[0.1em] text-[#315f37]">
              Legal
            </h2>

            <ul className="mt-5 space-y-3 text-sm text-black">
              <li>
                <Link href="/privacy" className="transition-colors hover:text-[rgb(var(--luxecraft-olive))]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-[rgb(var(--luxecraft-olive))]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-[rgb(var(--luxecraft-olive))]">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-10 border-t border-[rgb(var(--luxecraft-border))] pt-7">

          <div className="mt-7 flex flex-col gap-3 text-xs tracking-wide text-black sm:flex-row sm:items-center sm:justify-between">
            <span> {new Date().getFullYear()} Wolhomes. Crafted with care.</span>
            <span>Quiet luxury  Indian craftsmanship  Worldwide</span>
          </div>

        </div>

      </div>
    </footer>
  );
}



