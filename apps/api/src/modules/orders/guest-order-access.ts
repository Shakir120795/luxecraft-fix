export const GUEST_ORDER_ACCESS_COOKIE_PREFIX = 'wolhomes_guest_order_access_';
export const GUEST_ORDER_ACCESS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function getGuestOrderAccessCookieName(orderId: string): string {
  return `${GUEST_ORDER_ACCESS_COOKIE_PREFIX}${orderId}`;
}

export function getGuestOrderAccessCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/v1',
    maxAge: GUEST_ORDER_ACCESS_MAX_AGE_MS,
  };
}
