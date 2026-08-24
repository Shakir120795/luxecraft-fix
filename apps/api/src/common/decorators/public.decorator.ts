import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public — skips JWT authentication.
 * Useful when a global auth guard is applied at the app level in future.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
