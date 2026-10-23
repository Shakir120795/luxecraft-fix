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
  const manuallyOpenedRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    getHomeCouponLabel().then((data) => {
      if (mounted) setCoupon(data);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const isTouchLayout = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (!isTouchLayout) return;

    const handleScroll = () => {
      if (manuallyOpenedRef.current) return;
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

  if (!coupon) return null;

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
