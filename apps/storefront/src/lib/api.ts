const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  categoryId?: string | null;
  media: ProductMedia[];
  variants: ProductVariant[];
  createdAt?: string;
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

export async function getProducts(limit?: number): Promise<Product[]> {
  try {
    const url = new URL(`${API_URL}/storefront/products`);
    if (limit) url.searchParams.append('limit', limit.toString());

    const res = await fetch(url.toString(), {
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
    const res = await fetch(`${API_URL}/storefront/categories`, {
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
  itemCount: number;
  currency: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem('accessToken');
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
    
    const res = await fetch(`${API_URL}/cart`, {
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

export async function getCartTotals(): Promise<CartTotals> {
  try {
    const headers = await getAuthHeaders();
    const sessionId = getSessionId();
    
    const res = await fetch(`${API_URL}/cart/totals`, {
      headers: {
        ...headers,
        'X-Session-Id': sessionId,
      },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : { subtotal: 0, itemCount: 0, currency: 'USD' };
  } catch (error) {
    console.error('Failed to fetch cart totals:', error);
    return { subtotal: 0, itemCount: 0, currency: 'USD' };
  }
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
    
    const res = await fetch(`${API_URL}/cart/items`, {
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
    
    const res = await fetch(`${API_URL}/cart/items/${itemId}`, {
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
    
    const res = await fetch(`${API_URL}/cart/items/${itemId}`, {
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
    
    const res = await fetch(`${API_URL}/cart/clear`, {
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
    refreshToken: string;
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
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    
    if (res.ok && data.success && data.data) {
      // Store tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
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
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    
    if (res.ok && data.success && data.data) {
      // Store tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      // Merge guest cart if exists
      const guestSessionId = localStorage.getItem('guestSessionId');
      if (guestSessionId) {
        try {
          await fetch(`${API_URL}/cart/merge`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.data.accessToken}`,
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
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }

    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local data even if API call fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return { success: true };
  }
}

export async function verifyEmail(params: {
  email: string;
  code: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/verify-email`, {
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
    const res = await fetch(`${API_URL}/auth/resend-verification`, {
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
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
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
    const res = await fetch(`${API_URL}/auth/reset-password`, {
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

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('accessToken');
}

export async function updateProfile(params: Pick<User, 'firstName' | 'lastName' | 'phone'>): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
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
    const res = await fetch(`${API_URL}/auth/change-password`, {
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
    const res = await fetch(`${API_URL}/addresses`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch addresses:', error);
    return [];
  }
}

export async function createAddress(params: Omit<Address, 'id' | 'userId' | 'createdAt'>): Promise<{ success: boolean; data?: Address; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/addresses`, {
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

    const res = await fetch(url.toString(), { cache: 'no-store' });

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
    const res = await fetch(`${API_URL}/shipping/calculate`, {
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

export async function getPaymentConfiguration(currency: string = 'USD'): Promise<{
  provider: string;
  configured: boolean;
  currencySupported: boolean;
  publicKey?: string;
}> {
  try {
    const res = await fetch(`${API_URL}/payments/configuration?currency=${currency}`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : { provider: 'none', configured: false, currencySupported: false };
  } catch (error) {
    console.error('Failed to fetch payment configuration:', error);
    return { provider: 'none', configured: false, currencySupported: false };
  }
}

export async function createOrder(params: {
  shippingAddressId?: string;
  billingAddressId?: string;
  shippingMethodId: string;
  paymentMethodId?: string;
  guestEmail?: string;
  guestShippingAddress?: any;
  guestBillingAddress?: any;
}): Promise<{ 
  success: boolean; 
  data?: { 
    order: Order; 
    payment: any; 
    clientSecret?: string;  // Stripe client secret for payment confirmation
    guestAccessToken?: string 
  }; 
  message?: string 
}> {
  try {
    const headers = await getAuthHeaders();
    const sessionId = getSessionId();
    
    const res = await fetch(`${API_URL}/checkout/create-order`, {
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

export async function getOrders(): Promise<Order[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/orders`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
}

export async function getOrder(orderId: string, guestAccessToken?: string): Promise<Order | null> {
  try {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_URL}/orders/${orderId}`);
    if (guestAccessToken) url.searchParams.set('access', guestAccessToken);
    const res = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : null;
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
    const res = await fetch(`${API_URL}/custom-requests`, {
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
    const res = await fetch(`${API_URL}/custom-requests`, {
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
    const res = await fetch(`${API_URL}/custom-requests/${requestId}`, {
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
    const res = await fetch(`${API_URL}/custom-requests/${requestId}/messages`, {
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
    const res = await fetch(`${API_URL}/custom-quotes/${quoteId}/accept`, {
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
    const res = await fetch(`${API_URL}/wishlist`, {
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
    const res = await fetch(`${API_URL}/wishlist/items`, {
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
    const res = await fetch(`${API_URL}/wishlist/items/${itemId}`, {
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
    const res = await fetch(`${API_URL}/wishlist/toggle`, {
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
    const res = await fetch(`${API_URL}/wishlist/move-to-cart`, {
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
    const res = await fetch(`${API_URL}/wishlist/clear`, {
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

