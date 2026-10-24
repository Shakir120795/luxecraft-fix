'use client';

import { useEffect, useRef, useState } from 'react';
import { getHomeCouponLabel, HomeCouponLabel as HomeCouponData } from '@/lib/api';

function getDiscountText(coupon: HomeCouponData) {
  if (coupon.discountType === 'PERCENTAGE') {
    return coupon.discountValue + '% OFF';
  }

  const symbol =
    coupon.currency === 'USD'
      ? '$'
      : coupon.currency === 'EUR'
        ? '€'
        : coupon.currency === 'GBP'
          ? '£'
          : coupon.currency + ' ';

  return symbol + coupon.discountValue + ' OFF';
}

export function HomeCouponLabel() {
  const [coupon, setCoupon] = useState<HomeCouponData | null>(null);
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const manuallyOpenedRef = useRef(false);
  const mobileMenuOpenRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    const refreshCoupon = async () => {
      if (document.visibilityState !== 'visible') return;
      const data = await getHomeCouponLabel();
      if (mounted) setCoupon(data);
    };

    void refreshCoupon();
    const interval = window.setInterval(() => void refreshCoupon(), 30_000);
    const handleFocus = () => void refreshCoupon();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshCoupon();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    const handleMobileMenuState = (event: Event) => {
      const nextOpen = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
      mobileMenuOpenRef.current = nextOpen;
      setMobileMenuOpen(nextOpen);

      if (nextOpen) {
        manuallyOpenedRef.current = false;
      }
      setOpen(false);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };

    window.addEventListener('wolhomes:mobile-menu-state', handleMobileMenuState);
    return () => window.removeEventListener('wolhomes:mobile-menu-state', handleMobileMenuState);
  }, []);

  useEffect(() => {
    const isTouchLayout = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (!isTouchLayout) return;

    const handleScroll = () => {
      if (manuallyOpenedRef.current || mobileMenuOpenRef.current) return;
      setOpen(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setOpen(manuallyOpenedRef.current);
      }, 900);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  if (!coupon || mobileMenuOpen) return null;

  const discountText = getDiscountText(coupon);

  return (
    <div
      className="fixed left-0 top-1/2 z-[55] -translate-y-1/2"
      onMouseEnter={() => {
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          setOpen(manuallyOpenedRef.current);
        }
      }}
    >
      <button
        type="button"
        onClick={() => {
          const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
          if (hasHover) {
            manuallyOpenedRef.current = false;
            setOpen((value) => !value);
            return;
          }
          const next = !manuallyOpenedRef.current;
          manuallyOpenedRef.current = next;
          setOpen(next);
        }}
        aria-label={open ? 'Close coupon offer' : 'Open coupon offer'}
        aria-expanded={open}
        className={[
          'group flex max-w-[min(174px,72vw)] overflow-hidden rounded-r-xl border border-black/10 bg-[#fbfaf7]',
          open ? 'shadow-[0_8px_24px_rgba(0,0,0,0.15)]' : 'shadow-[0_3px_10px_rgba(0,0,0,0.08)]',
          'transition-[width,min-height,box-shadow] duration-200 ease-out',
          open ? 'w-[min(174px,72vw)] min-h-[88px]' : 'w-[24px] min-h-[80px]',
        ].join(' ')}
      >
        <div
          className={[
            'flex shrink-0 items-center justify-center border-r border-[#e8c98a] bg-[#f4f0eb]',
            open ? 'w-9' : 'w-full border-r-0',
          ].join(' ')}
        >
          <span
            className={[
              'font-sans font-black uppercase text-black',
              open
                ? 'text-[9px] tracking-[0.14em]'
                : 'rotate-180 text-[13px] tracking-[-0.04em] [writing-mode:vertical-rl]',
            ].join(' ')}
          >
            {open ? 'OFFER' : discountText}
          </span>
        </div>

        {open && (
          <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-3 text-left">
            <span className="font-sans text-[26px] font-black leading-none tracking-[-0.04em] text-black">
              {discountText}
            </span>
            <span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#6d655e]">
              Coupon Code
            </span>
            <span className="mt-0.5 truncate font-mono text-[13px] font-bold tracking-[0.08em] text-[#2f6b36]">
              {coupon.code}
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
