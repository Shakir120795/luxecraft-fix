const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api/v1';

let accessToken: string | null = null;

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: init.credentials ?? 'include',
  });
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  regularPrice: string | number;  // API returns string
  salePrice: string | number | null;  // API returns string or null
  isFeatured: boolean;
  status: string;
  weightKg: number | null;
  taxRate: number | string;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  categoryId?: string | null;
  material?: string | null;
  style?: string | null;
  collection?: string | null;
  color?: string | null;
  filterData?: Record<string, string[]> | null;
  deliveryInfo?: string | null;
  shippingInfo?: string | null;
  returnsInfo?: string | null;
  careInstructions?: string | null;
  origin?: string | null;
  productNote?: string | null;
  reviews?: ProductReview[];
  media: ProductMedia[];
  variants: ProductVariant[];
  createdAt?: string;
}


export interface ProductReview {
  id: string;
  productId: string;
  userId?: string | null;
  rating: number;
  title?: string | null;
  content?: string | null;
  status?: string;
  isFeatured?: boolean;
  createdAt: string;
}

export interface ProductMedia {
  id: string;
  productId: string;
  variantId?: string | null;
  url: string;
  altText: string | null;
  type: string;
  isMain: boolean;
  sortOrder?: number;
}
export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  stockQty: number;
  regularPrice: number | null;
  salePrice?: number | null;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  isAvailable?: boolean;
}


export interface ProductReview {
  id: string;
  productId: string;
  userId?: string | null;
  rating: number;
  title?: string | null;
  content?: string | null;
  status?: string;
  isFeatured?: boolean;
  createdAt: string;
}

export interface ProductMedia {
  id: string;
  productId: string;
  variantId?: string | null;
  url: string;
  altText: string | null;
  type: string;
  isMain: boolean;
  sortOrder?: number;
}
export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  stockQty: number;
  regularPrice: number | null;
  salePrice?: number | null;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  isAvailable?: boolean;
  media?: ProductMedia[];
}
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
}

export interface HeroSection {
  id: string;
  productId: string | null;
  imageUrl: string | null;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  primaryCtaText: string | null;
  primaryCtaLink: string | null;
  secondaryCtaText: string | null;
  secondaryCtaLink: string | null;
  hero2ProductId: string | null;
  hero2ImageUrl: string | null;
  hero2Title: string | null;
  hero2Link: string | null;
  hero3ProductId: string | null;
  hero3ImageUrl: string | null;
  hero3Title: string | null;
  hero3Link: string | null;
  isActive: boolean;
  product?: Product | null;
  createdAt: string;
  updatedAt: string;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getFaqs(): Promise<FaqItem[]> {
  try {
    const res = await apiFetch(`${API_URL}/storefront/faq`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
    return [];
  }
}
export interface HomepageVideo {
  id: string;
  title: string;
  url: string;
  platform: 'youtube' | 'instagram';
  sortOrder: number;
  isActive: boolean;
}

export async function getHomepageVideos(): Promise<HomepageVideo[]> {
  try {
    const res = await apiFetch(`${API_URL}/storefront/pages/homepage-videos`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch homepage videos:', error);
    return [];
  }
}
export interface HomeCouponLabel {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  currency: string;
}

export async function getHomeCouponLabel(): Promise<HomeCouponLabel | null> {
  try {
    const res = await apiFetch(`${API_URL}/storefront/coupon-label`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data?.data ?? null : null;
  } catch (error) {
    console.error('Failed to fetch homepage coupon label:', error);
    return null;
  }
}

export interface ProductFilterValueSetting {
  slug: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductFilterSetting {
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  values: ProductFilterValueSetting[];
}

export async function getProductFilters(): Promise<ProductFilterSetting[]> {
  try {
    const res = await apiFetch(`${API_URL}/storefront/pages/product-filters`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch product filters:', error);
    return [];
  }
}

export async function getHero(): Promise<HeroSection | null> {
  try {
    const res = await apiFetch(`${API_URL}/storefront/hero`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    return data.success ? data.data : null;
  } catch (error) {
    console.error('Failed to fetch hero:', error);
    return null;
  }
}
export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductPageParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'featured' | 'newest' | 'price-low' | 'price-high';
  filters?: Record<string, string>;
}

export async function getProductsPage(params: ProductPageParams = {}): Promise<PaginatedProducts> {
  try {
    const url = new URL(`${API_URL}/storefront/products`);
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? 12, 1), 48);

    url.searchParams.set('page', page.toString());
    url.searchParams.set('take', pageSize.toString());

    if (params.categoryId) url.searchParams.set('categoryId', params.categoryId);
    if (params.search) url.searchParams.set('search', params.search);
    if (Number.isFinite(params.minPrice)) url.searchParams.set('minPrice', String(params.minPrice));
    if (Number.isFinite(params.maxPrice)) url.searchParams.set('maxPrice', String(params.maxPrice));
    if (params.sort) url.searchParams.set('sort', params.sort);

    Object.entries(params.filters ?? {}).forEach(([slug, value]) => {
      if (value) url.searchParams.set(`filter_${slug}`, value);
    });

    const res = await apiFetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const payload = data?.success ? data.data : data;

    if (payload && Array.isArray(payload.items)) {
      const total = Number(payload.total ?? payload.items.length);
      return {
        items: payload.items,
        total,
        page,
        pageSize,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      };
    }

    return {
      items: Array.isArray(payload) ? payload : [],
      total: Array.isArray(payload) ? payload.length : 0,
      page,
      pageSize,
      totalPages: 1,
    };
  } catch (error) {
    console.error('Failed to fetch products page:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch products');
  }
}

export async function getProducts(limit?: number, categoryId?: string): Promise<Product[]> {
  try {
    const url = new URL(`${API_URL}/storefront/products`);
    if (limit) url.searchParams.append('take', limit.toString());
    if (categoryId) url.searchParams.append('categoryId', categoryId);

    const res = await apiFetch(url.toString(), {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    
    // Handle API response structure: { success: true, data: { items: [...], total: 5 } }
    if (data.success && data.data && Array.isArray(data.data.items)) {
      return data.data.items;
    }
    
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await apiFetch(`${API_URL}/storefront/categories`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    
    // Handle API response structure: { success: true, data: [...] }
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export async function getStorefrontCategories(): Promise<Category[]> {
  return getCategories();
}

// ============================================
// CART API
// ============================================

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  priceSnapshot: number;
  displayPrice?: number;
  customization: Record<string, any> | null;
  product: Product;
  variant: ProductVariant | null;
}

export interface Cart {
  id: string;
  items: CartItem[];
  userId: string | null;
  sessionId: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
  currency: string;
}

let refreshPromise: Promise<string | null> | null = null;

function isTokenExpiringSoon(token: string, withinSeconds = 60): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    const exp = Number(payload?.exp || 0);
    return !exp || exp <= Math.floor(Date.now() / 1000) + withinSeconds;
  } catch {
    return true;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await apiFetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          cache: 'no-store',
        });

        const data = await res.json().catch(() => null);
        const auth = data?.data ?? data;

        if (!res.ok || !auth?.accessToken) {
          accessToken = null;
          return null;
        }

        accessToken = auth.accessToken as string;
        if (auth.user) localStorage.setItem('user', JSON.stringify(auth.user));
        return accessToken;
      } catch (error) {
        console.error('Failed to refresh access token:', error);
        accessToken = null;
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  let token = accessToken;

  if (!token || isTokenExpiringSoon(token)) {
    token = await refreshAccessToken();
  }

  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getSessionId(): string {
  let sessionId = localStorage.getItem('guestSessionId');
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guestSessionId', sessionId);
  }
  return sessionId;
}

export async function getCart(): Promise<Cart | null> {
  try {
    const headers = await getAuthHeaders();
    const sessionId = getSessionId();
    
    const res = await apiFetch(`${API_URL}/cart`, {
      headers: {
        ...headers,
        'X-Session-Id': sessionId,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Failed to fetch cart:', error);
    return null;
  }
}

export async function getCartTotals(country?: string): Promise<CartTotals> {
  try {
    const headers = await getAuthHeaders();
    const sessionId = getSessionId();
    const url = new URL(`${API_URL}/cart/totals`);
    if (country) url.searchParams.append('country', country.toUpperCase());

    const res = await apiFetch(url.toString(), {
      headers: {
        ...headers,
        'X-Session-Id': sessionId,
      },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : { subtotal: 0, shipping: 0, tax: 0, total: 0, itemCount: 0, currency: 'USD' };
  } catch (error) {
    console.error('Failed to fetch cart totals:', error);
    return { subtotal: 0, shipping: 0, tax: 0, total: 0, itemCount: 0, currency: 'USD' };
  }
}

export interface CouponValidation {
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  subtotal: number;
}

export async function validateCoupon(code: string, subtotal: number, productIds: string[]): Promise<CouponValidation> {
  const headers = await getAuthHeaders();
  const sessionId = getSessionId();

  const res = await apiFetch(`${API_URL}/cart/coupon/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      'X-Session-Id': sessionId,
    },
    body: JSON.stringify({ code, subtotal, productIds }),
    cache: 'no-store',
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Unable to apply coupon.');
  }

  return data.data;
}
export async function addToCart(params: {
  productId: string;
  variantId?: string | null;
  quantity: number;
  customization?: Record<string, any>;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const sessionId = getSessionId();
    
    const res = await apiFetch(`${API_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to add to cart' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to add to cart:', error);
    return { success: false, message: 'Failed to add to cart' };
  }
}

export async function updateCartItem(itemId: string, params: {
  quantity?: number;
  customization?: Record<string, any>;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const sessionId = getSessionId();
    
    const res = await apiFetch(`${API_URL}/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to update cart' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update cart item:', error);
    return { success: false, message: 'Failed to update cart item' };
  }
}

export async function removeCartItem(itemId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const sessionId = getSessionId();
    
    const res = await apiFetch(`${API_URL}/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'X-Session-Id': sessionId,
      },
    });

    if (res.ok) return { success: true };
    const data = await res.json();
    return { success: false, message: data.message || 'Failed to remove item' };
  } catch (error) {
    console.error('Failed to remove cart item:', error);
    return { success: false, message: 'Failed to remove item' };
  }
}

export async function clearCart(): Promise<{ success: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const sessionId = getSessionId();
    
    const res = await apiFetch(`${API_URL}/cart/clear`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'X-Session-Id': sessionId,
      },
    });

    if (res.ok) return { success: true };
    const data = await res.json();
    return { success: false, message: data.message || 'Failed to clear cart' };
  } catch (error) {
    console.error('Failed to clear cart:', error);
    return { success: false, message: 'Failed to clear cart' };
  }
}

// ============================================
// AUTHENTICATION API
// ============================================

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  emailVerified: boolean;
  status: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    accessToken: string;
  };
  message?: string;
}

export async function register(params: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<AuthResponse> {
  try {
    const res = await apiFetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    
    if (res.ok && data.success && data.data) {
      accessToken = data.data.accessToken;
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return { success: true, data: data.data };
    }

    return { success: false, message: data.message || 'Registration failed' };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed' };
  }
}

export async function login(params: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  try {
    const res = await apiFetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    
    if (res.ok && data.success && data.data) {
      // Store tokens
      accessToken = data.data.accessToken;
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      // Merge guest cart if exists
      const guestSessionId = localStorage.getItem('guestSessionId');
      if (guestSessionId) {
        try {
          await apiFetch(`${API_URL}/cart/merge`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(await getAuthHeaders()),
            },
            body: JSON.stringify({ guestSessionId }),
          });
        } catch (err) {
          console.error('Failed to merge cart:', err);
        }
      }
      
      return { success: true, data: data.data };
    }

    return { success: false, message: data.message || 'Login failed' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Login failed' };
  }
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    await apiFetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  accessToken = null;
  if (typeof window !== 'undefined') localStorage.removeItem('user');
  return { success: true };
}

export async function verifyEmail(params: {
  email: string;
  code: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      return { success: true };
    }

    return { success: false, message: data.message || 'Verification failed' };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, message: 'Verification failed' };
  }
}

export async function resendVerificationCode(email: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      return { success: true, message: data.message || 'Verification code sent' };
    }

    return { success: false, message: data.message || 'Failed to send code' };
  } catch (error) {
    console.error('Resend verification error:', error);
    return { success: false, message: 'Failed to send code' };
  }
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      return { success: true, message: data.message || 'Reset instructions sent' };
    }

    return { success: false, message: data.message || 'Failed to send reset email' };
  } catch (error) {
    console.error('Forgot password error:', error);
    return { success: false, message: 'Failed to send reset email' };
  }
}

export async function resetPassword(params: {
  token: string;
  password: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      return { success: true, message: data.message || 'Password reset successful' };
    }

    return { success: false, message: data.message || 'Password reset failed' };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, message: 'Password reset failed' };
  }
}

export function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

export async function getFreshCurrentUser(): Promise<User | null> {
  try {
    const res = await apiFetch(`${API_URL}/auth/me`, {
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return getCurrentUser();
    const response = await res.json();
    const user = response?.data ?? response;
    if (user?.id) {
      localStorage.setItem('user', JSON.stringify(user));
      return user as User;
    }
    return getCurrentUser();
  } catch {
    return getCurrentUser();
  }
}
export function isAuthenticated(): boolean {
  return !!accessToken || !!localStorage.getItem('user');
}

export async function updateProfile(params: Pick<User, 'firstName' | 'lastName' | 'phone'>): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify(params),
    });
    const response = await res.json();
    if (!res.ok || !response.success) return { success: false, message: response.message || 'Profile update failed' };
    localStorage.setItem('user', JSON.stringify(response.data));
    return { success: true, user: response.data };
  } catch {
    return { success: false, message: 'Profile update failed' };
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const response = await res.json();
    return res.ok && response.success
      ? { success: true, message: response.data?.message }
      : { success: false, message: response.message || 'Password change failed' };
  } catch {
    return { success: false, message: 'Password change failed' };
  }
}

// ============================================
// ADDRESS API
// ============================================

export interface Address {
  id: string;
  userId: string;
  type: 'SHIPPING' | 'BILLING' | 'BOTH';
  firstName: string;
  lastName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateProvince: string | null;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: string;
}

export async function getAddresses(): Promise<Address[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/addresses`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success && Array.isArray(data.data)
      ? data.data.map(normalizeOrder)
      : [];
  } catch (error) {
    console.error('Failed to fetch addresses:', error);
    return [];
  }
}

export async function createAddress(params: Omit<Address, 'id' | 'userId' | 'createdAt'>): Promise<{ success: boolean; data?: Address; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      return { success: true, data: data.data };
    }

    return { success: false, message: data.message || 'Failed to create address' };
  } catch (error) {
    console.error('Failed to create address:', error);
    return { success: false, message: 'Failed to create address' };
  }
}


export async function updateAddress(id: string, params: Partial<Omit<Address, 'id' | 'userId' | 'createdAt'>>): Promise<{ success: boolean; data?: Address; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/addresses/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      return { success: true, data: data.data };
    }

    return { success: false, message: data.message || 'Failed to update address' };
  } catch (error) {
    console.error('Failed to update address:', error);
    return { success: false, message: 'Failed to update address' };
  }
}

export async function deleteAddress(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/addresses/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (res.ok || res.status === 204) {
      return { success: true };
    }

    let message = 'Failed to delete address';
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {}

    return { success: false, message };
  } catch (error) {
    console.error('Failed to delete address:', error);
    return { success: false, message: 'Failed to delete address' };
  }
}
// ============================================
// SHIPPING API
// ============================================

export interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  estimatedDays: number | null;
  rate: number;
  currency: string;
}

export async function getShippingMethods(params: {
  country: string;
  weight?: number;
  orderValue?: number;
}): Promise<ShippingMethod[]> {
  try {
    const url = new URL(`${API_URL}/shipping/methods`);
    url.searchParams.append('country', params.country);
    if (params.weight) url.searchParams.append('weight', params.weight.toString());
    if (params.orderValue) url.searchParams.append('orderValue', params.orderValue.toString());

    const res = await apiFetch(url.toString(), { cache: 'no-store' });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch shipping methods:', error);
    return [];
  }
}

export async function calculateShipping(params: {
  country: string;
  shippingMethodId: string;
  weight?: number;
  orderValue?: number;
}): Promise<{ rate: number; currency: string } | null> {
  try {
    const res = await apiFetch(`${API_URL}/shipping/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Failed to calculate shipping:', error);
    return null;
  }
}

// ============================================
// ORDER API
// ============================================

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  guestEmail: string | null;
  orderType: 'STANDARD' | 'CUSTOM';
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  shippingAddress: any;
  billingAddress: any;
  items: any[];
  createdAt: string;
}

// ============================================
// PAYMENT API
// ============================================

export async function verifyRazorpayPayment(params: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  accessToken?: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/payments/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return res.ok ? data : { success: false, message: data?.message || 'Razorpay verification failed' };
  } catch (error) {
    console.error('Razorpay verification failed:', error);
    return { success: false, message: 'Razorpay verification failed' };
  }
}

export async function capturePayPalPayment(params: {
  orderId: string;
  paypalOrderId: string;
  accessToken?: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/payments/paypal/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return res.ok ? data : { success: false, message: data?.message || 'PayPal capture failed' };
  } catch (error) {
    console.error('PayPal capture failed:', error);
    return { success: false, message: 'PayPal capture failed' };
  }
}

export async function verifyCryptoPayment(params: {
  orderId: string;
  txHash: string;
  network: string;
  asset: string;
  accessToken?: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/payments/crypto/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return res.ok ? data : { success: false, message: data?.message || 'Crypto verification failed' };
  } catch (error) {
    console.error('Crypto verification failed:', error);
    return { success: false, message: 'Crypto verification failed' };
  }
}
export async function getPaymentConfiguration(currency: string = 'USD'): Promise<{
  provider: string;
  providers: string[];
  configured: boolean;
  currencySupported: boolean;
  publicKey?: string;
  cryptoNetworks?: string[];
  cryptoSupportedAssets?: string[];
}> {
  try {
    const res = await apiFetch(`${API_URL}/payments/configuration?currency=${currency}`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : { provider: 'none', providers: [], configured: false, currencySupported: false };
  } catch (error) {
    console.error('Failed to fetch payment configuration:', error);
    return { provider: 'none', providers: [], configured: false, currencySupported: false };
  }
}

export async function createOrder(params: {
  shippingAddressId?: string;
  billingAddressId?: string;
  shippingMethodId: string;
  paymentMethodId?: string;
  paymentProvider?: 'razorpay' | 'paypal' | 'crypto';
  paymentMethod?: string;
  guestEmail?: string;
  guestShippingAddress?: any;
  guestBillingAddress?: any;
  couponCode?: string;
}): Promise<{ 
  success: boolean; 
  data?: { 
    order: Order; 
    payment: any; 
    clientSecret?: string;
    providerOrderId?: string;
    publicKey?: string;
    approveUrl?: string;
    crypto?: {
      network: string;
      asset: string;
      address: string;
      amount: number;
      currency: string;
      instructions: string;
      qrPayload: string;
    };
    guestAccessToken?: string 
  }; 
  message?: string 
}> {
  try {
    const headers = await getAuthHeaders();
    const sessionId = getSessionId();
    
    const res = await apiFetch(`${API_URL}/checkout/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      return { success: true, data: data.data };
    }

    return { success: false, message: data.message || 'Failed to create order' };
  } catch (error) {
    console.error('Failed to create order:', error);
    return { success: false, message: 'Failed to create order' };
  }
}

function normalizeOrder(order: any): Order {
  return {
    ...order,
    status: String(order?.status ?? order?.orderStatus ?? ''),
    fulfillmentStatus: String(order?.fulfillmentStatus ?? ''),
    paymentStatus: String(order?.paymentStatus ?? ''),
    subtotal: Number(order?.subtotal ?? 0),
    shippingCost: Number(order?.shippingCost ?? 0),
    taxAmount: Number(order?.taxAmount ?? 0),
    discountAmount: Number(order?.discountAmount ?? 0),
    total: Number(order?.total ?? 0),
    items: Array.isArray(order?.items)
      ? order.items.map((item: any) => ({
          ...item,
          quantity: Number(item?.quantity ?? 0),
          unitPrice: Number(item?.unitPrice ?? 0),
          totalPrice: Number(item?.totalPrice ?? 0),
        }))
      : [],
  };
}

export async function getOrders(): Promise<Order[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/orders`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success && Array.isArray(data.data)
      ? data.data.map(normalizeOrder)
      : [];
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
}

export async function resumePayment(orderId: string): Promise<{
  success: boolean;
  orderId?: string;
  provider?: string;
  payment?: any;
  providerOrderId?: string;
  publicKey?: string;
  approveUrl?: string;
  crypto?: {
    network: string;
    asset: string;
    address: string;
    amount: number;
    currency: string;
    instructions: string;
    qrPayload: string;
  };
  message?: string;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/payments/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ orderId }),
    });

    const data = await res.json();
    return res.ok && data.success
      ? data
      : { success: false, message: data?.message || 'Unable to resume payment.' };
  } catch (error) {
    console.error('Failed to resume payment:', error);
    return { success: false, message: 'Unable to resume payment.' };
  }
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers,
    });

    const data = await res.json().catch(() => null);
    return res.ok && data?.success !== false
      ? { success: true }
      : { success: false, message: data?.message || 'Unable to cancel order.' };
  } catch (error) {
    console.error('Failed to cancel order:', error);
    return { success: false, message: 'Unable to cancel order.' };
  }
}

export async function getOrder(orderId: string, guestAccessToken?: string): Promise<Order | null> {
  try {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_URL}/orders/${orderId}`);
    if (guestAccessToken) url.searchParams.set('access', guestAccessToken);
    const res = await apiFetch(url.toString(), {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success && data.data ? normalizeOrder(data.data) : null;
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return null;
  }
}

// ============================================
// CUSTOM DESIGN REQUEST API
// ============================================

export interface CustomRequest {
  id: string;
  requestNumber: string;
  userId: string;
  status: string;
  title: string;
  description: string;
  productCategory: string | null;
  desiredDimensions: string | null;
  preferredColors: string | null;
  preferredMaterials: string | null;
  quantity: number;
  estimatedBudget: number | null;
  referenceFiles: string[];
  createdAt: string;
  updatedAt: string;
}

function mapCustomRequest(request: any): CustomRequest {
  return {
    ...request,
    requestNumber: request.customRequestNumber,
    desiredDimensions: request.dimensions ?? null,
    preferredMaterials: request.materialPreference ?? null,
    quantity: request.quantityRequested ?? 1,
    estimatedBudget: request.estimatedBudget ?? null,
    referenceFiles: request.referenceFiles ?? [],
  };
}

export interface CustomMessage {
  id: string;
  customRequestId: string;
  senderType: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  message: string;
  attachments: string[];
  isRead: boolean;
  createdAt: string;
}

export interface CustomQuote {
  id: string;
  customRequestId: string;
  quoteNumber: string;
  version: number;
  status: string;
  basePrice: number;
  designFee: number | null;
  materialFee: number | null;
  dimensionFee: number | null;
  rushFee: number | null;
  discount: number | null;
  total: number;
  currency: string;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
}

export async function submitContactMessage(params: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  const res = await apiFetch(`${API_URL}/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || 'Failed to send contact message.');
  }

  return {
    success: true,
    data,
  };
}
export async function createCustomRequest(params: {
  title: string;
  description: string;
  productCategory?: string;
  desiredDimensions?: string;
  preferredColors?: string;
  preferredMaterials?: string;
  quantity: number;
  estimatedBudget?: number;
  referenceFiles?: string[];
}): Promise<{ success: boolean; data?: CustomRequest; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/custom-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        title: params.title,
        description: params.description,
        dimensions: params.desiredDimensions,
        designNotes: params.productCategory ? `Product/category: ${params.productCategory}` : undefined,
        preferredColors: params.preferredColors,
        materialPreference: params.preferredMaterials,
        quantityRequested: params.quantity,
        budgetRange: params.estimatedBudget?.toString(),
      }),
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      return { success: true, data: mapCustomRequest(data.data) };
    }

    return { success: false, message: data.message || 'Failed to create request' };
  } catch (error) {
    console.error('Failed to create custom request:', error);
    return { success: false, message: 'Failed to create request' };
  }
}

export async function getCustomRequests(): Promise<CustomRequest[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/custom-requests`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data.map(mapCustomRequest) : [];
  } catch (error) {
    console.error('Failed to fetch custom requests:', error);
    return [];
  }
}

export async function getCustomRequest(requestId: string): Promise<{
  request: CustomRequest;
  messages: CustomMessage[];
  quotes: CustomQuote[];
} | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/custom-requests/${requestId}`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success
      ? {
          request: mapCustomRequest(data.data),
          messages: data.data.messages ?? [],
          quotes: data.data.quotes ?? [],
        }
      : null;
  } catch (error) {
    console.error('Failed to fetch custom request:', error);
    return null;
  }
}

export async function sendCustomMessage(requestId: string, message: string): Promise<{ success: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/custom-requests/${requestId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      return { success: true };
    }

    return { success: false, message: data.message || 'Failed to send message' };
  } catch (error) {
    console.error('Failed to send message:', error);
    return { success: false, message: 'Failed to send message' };
  }
}

export async function acceptQuote(quoteId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/custom-quotes/${quoteId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      return { success: true };
    }

    return { success: false, message: data.message || 'Failed to accept quote' };
  } catch (error) {
    console.error('Failed to accept quote:', error);
    return { success: false, message: 'Failed to accept quote' };
  }
}

// ============================================
// WISHLIST API
// ============================================

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  variantId: string | null;
  product: Product;
  variant: ProductVariant | null;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  createdAt: string;
}

export async function getWishlist(): Promise<Wishlist | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/wishlist`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Failed to fetch wishlist:', error);
    return null;
  }
}

export async function addToWishlist(params: {
  productId: string;
  variantId?: string | null;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/wishlist/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      return { success: true };
    }

    return { success: false, message: data.message || 'Failed to add to wishlist' };
  } catch (error) {
    console.error('Failed to add to wishlist:', error);
    return { success: false, message: 'Failed to add to wishlist' };
  }
}

export async function removeFromWishlist(itemId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/wishlist/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        ...headers,
      },
    });

    if (res.ok) return { success: true };
    const data = await res.json();
    return { success: false, message: data.message || 'Failed to remove from wishlist' };
  } catch (error) {
    console.error('Failed to remove from wishlist:', error);
    return { success: false, message: 'Failed to remove from wishlist' };
  }
}

export async function toggleWishlist(params: {
  productId: string;
  variantId?: string | null;
}): Promise<{ success: boolean; added: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/wishlist/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      return { success: true, added: data.data.added };
    }

    return { success: false, added: false, message: data.message || 'Failed to toggle wishlist' };
  } catch (error) {
    console.error('Failed to toggle wishlist:', error);
    return { success: false, added: false, message: 'Failed to toggle wishlist' };
  }
}

export async function moveWishlistToCart(itemId: string, quantity: number = 1): Promise<{ success: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/wishlist/move-to-cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ itemId, quantity }),
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      return { success: true };
    }

    return { success: false, message: data.message || 'Failed to move to cart' };
  } catch (error) {
    console.error('Failed to move to cart:', error);
    return { success: false, message: 'Failed to move to cart' };
  }
}

export async function clearWishlist(): Promise<{ success: boolean; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await apiFetch(`${API_URL}/wishlist/clear`, {
      method: 'DELETE',
      headers: {
        ...headers,
      },
    });

    if (res.ok) return { success: true };
    const data = await res.json();
    return { success: false, message: data.message || 'Failed to clear wishlist' };
  } catch (error) {
    console.error('Failed to clear wishlist:', error);
    return { success: false, message: 'Failed to clear wishlist' };
  }
}






