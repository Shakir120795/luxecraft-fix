'use client';

import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-[rgb(var(--luxecraft-border))] bg-[rgb(var(--luxecraft-cream))] text-[rgb(var(--luxecraft-ink))]">
      <div className="mx-auto max-w-[1400px] px-6 py-11 sm:px-8 lg:px-10">

        <div className="grid items-start gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1fr_0.8fr] lg:gap-16">

          <div>
            <Link
              href="/"
              className="font-serif text-[26px] font-semibold tracking-[0.2em] transition-opacity hover:opacity-70 sm:text-[24px]"
            >
              LUXECRAFT
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
                <Link href="/shipping" className="transition-colors hover:text-[rgb(var(--luxecraft-olive))]">
                  Shipping
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

          <div className="flex justify-center">
            <div className="flex items-center gap-3">

              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center border border-[#1877F2] text-[#1877F2] transition-all hover:bg-[#1877F2] hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
                  <path d="M14.5 8H17V4.5h-2.5C11.4 4.5 10 6.2 10 9v2H7v3.5h3V20h3.5v-5.5H16l.8-3.5h-3.3V9.3c0-.9.3-1.3 1-1.3Z" />
                </svg>
              </a>

              <a
                href="https://x.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="flex h-10 w-10 items-center justify-center border border-black text-black transition-all hover:bg-black hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="currentColor">
                  <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.5 22H3.4l7.3-8.3L2.8 2h6.4l4.4 5.8L18.9 2Zm-1.1 17.3h1.7L8.3 4.5H6.4L17.8 19.3Z" />
                </svg>
              </a>

              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center border border-[#25D366] text-[#25D366] transition-all hover:bg-[#25D366] hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z" />
                  <path d="M8.5 8.2c.2-.4.4-.4.7-.4h.4c.2 0 .3.1.4.4l.5 1.2c.1.2.1.4 0 .6l-.4.5c-.1.2-.1.3 0 .5.4.7 1 1.3 1.7 1.7.2.1.4.1.5 0l.5-.4c.2-.1.4-.1.6 0l1.2.5c.2.1.3.2.3.4v.4c0 .3-.1.5-.4.7-.4.3-1 .4-1.5.2-2.5-.8-4.5-2.8-5.4-5.4-5.4-.2-.5-.1-1.1.2-1.5Z" />
                </svg>
              </a>

              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center border border-[#E4405F] text-[#E4405F] transition-all hover:bg-[#E4405F] hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>

              <a
                href="https://www.pinterest.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                className="flex h-10 w-10 items-center justify-center border border-[#E60023] text-[#E60023] transition-all hover:bg-[#E60023] hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
                  <path d="M12 2a10 10 0 0 0-3.5 19.4c-.1-1.6 0-3.5.4-5.2l1-4.2s-.3-.6-.3-1.4c0-1.3.8-2.3 1.7-2.3.8 0 1.2 1.3 1.2 1.3 0 .8-.5 2-.8 3.1-.2.9.5 1.6 1.4 1.6 1.7 0 2.8-1.7 2.8-3.8 0-1.6-1.1-2.8-3-2.8-2.2 0-3.5 1.6-3.5 3.4 0 .6.2 1 .5 1.4.1.2.2.2.1.4l-.2.7c-.1.2-.2.3-.4.2-1.2-.5-1.8-1.8-1.8-3.3C7.6 6.1 9.7 3.2 13.8 3.2c3.3 0 5.4 2.4 5.4 4.9 0 3.4-1.9 5.9-4.6 5.9-.9 0-1.8-.5-2.1-1.1l-.6 2.4c-.4 1.4-1 3-1.6 4.1A10 10 0 1 0 12 2Z" />
                </svg>
              </a>

            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 text-xs tracking-wide text-black sm:flex-row sm:items-center sm:justify-between">
            <span> {new Date().getFullYear()} LuxeCraft. Crafted with care.</span>
            <span>Quiet luxury  Indian craftsmanship  Worldwide</span>
          </div>

        </div>

      </div>
    </footer>
  );
}
