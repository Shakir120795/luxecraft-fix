'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let mounted = true;

    getHomeCouponLabel().then((data) => {
      if (mounted) setCoupon(data);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!coupon) return null;

  const discountText = getDiscountText(coupon);

  return (
    <div
      className="fixed left-0 top-1/2 z-[55] -translate-y-1/2"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close coupon offer' : 'Open coupon offer'}
        aria-expanded={open}
        className={[
          'group flex overflow-hidden rounded-r-2xl border border-black/10 bg-[#fbfaf7] shadow-[0_12px_35px_rgba(0,0,0,0.18)]',
          'transition-[width,min-height,box-shadow] duration-300 ease-out',
          open ? 'w-[174px] min-h-[94px]' : 'w-[46px] min-h-[154px]',
        ].join(' ')}
      >
        <div
          className={[
            'flex shrink-0 items-center justify-center border-r border-[#e8c98a] bg-[#f4f0eb]',
            open ? 'w-10' : 'w-full border-r-0',
          ].join(' ')}
        >
          <span
            className={[
              'font-sans font-black uppercase text-black',
              open
                ? 'text-[9px] tracking-[0.16em]'
                : 'rotate-180 text-[24px] tracking-[-0.04em] [writing-mode:vertical-rl]',
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
