'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const COUPON_CODE = 'FIRST15';
const DISMISS_KEY = 'wolhomes-offer-dismissed';

/**
 * "15% OFF" side offer tab.
 *
 * The live build's tab is a wide opaque pill pinned to the left edge that
 * covers page content on mobile — worst on cart/checkout, where it sits on
 * top of the Order Summary text. This version is designed to never do that:
 *
 * - Slim (36px) and mostly at the viewport edge, so it overlaps nothing
 *   readable on normal pages.
 * - Completely hidden on /cart and /checkout, where the order summary and
 *   forms need the full width.
 * - Dismissible for the rest of the browser session.
 * - Expands in place to reveal the coupon code with a copy button.
 */
export function OfferTab() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  useEffect(() => {
    setExpanded(false);
    setCopied(false);
  }, [pathname]);

  if (dismissed) return null;

  // Never cover checkout/cart content (order summary, address forms).
  if (pathname === '/cart' || pathname?.startsWith('/checkout')) return null;

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed left-0 top-1/2 z-40 -translate-y-1/2">
      {expanded ? (
        <div className="w-56 rounded-r-xl border border-luxury-gold/50 bg-white p-4 shadow-xl">
          <div className="mb-1 flex items-start justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-brown">
              Offer
            </p>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Close coupon offer"
              className="text-luxury-brown transition hover:text-luxury-charcoal"
            >
              ✕
            </button>
          </div>
          <p className="font-serif text-2xl text-luxury-charcoal">15% OFF</p>
          <p className="mt-1 text-xs text-luxury-brown">
            Use this coupon code at checkout:
          </p>
          <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-dashed border-luxury-gold bg-[#faf7ef] px-3 py-2">
            <span className="font-mono text-sm font-semibold tracking-widest text-luxury-charcoal">
              {COUPON_CODE}
            </span>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="text-xs font-semibold uppercase tracking-wide text-luxury-gold hover:text-luxury-darkGold"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="mt-3 text-xs text-luxury-brown underline underline-offset-4 hover:text-luxury-charcoal"
          >
            Don&apos;t show again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Open coupon offer"
            className="flex w-9 items-center justify-center rounded-r-lg bg-[#302b35] py-4 text-white shadow-lg transition hover:bg-[#211e24]"
          >
            <span
              className="text-[11px] font-bold uppercase tracking-[0.25em]"
              style={{ writingMode: 'vertical-rl' }}
            >
              15% OFF
            </span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss coupon offer"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-[#ded8d0] bg-white text-[10px] text-luxury-brown shadow transition hover:text-luxury-charcoal"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
