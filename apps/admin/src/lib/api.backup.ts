/**
 * LuxeCraft Admin API client foundation.
 * Admin uses a separate auth boundary (Phase 2).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly error: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = typeof window === 'undefined' ? null : localStorage.getItem('adminToken');
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    credentials: 'include',
  });

  if (response.status === 204) return undefined as T;

  const json = (await response.json()) as ApiResponse<T> | { success: false; statusCode: number; error: string; message: string };

  if (!response.ok || !json.success) {
    const err = json as { statusCode: number; error: string; message: string };
    throw new ApiError(err.statusCode ?? response.status, err.error ?? 'UnknownError', err.message ?? 'Request failed');
  }

  return (json as ApiResponse<T>).data;
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ============================================================================
// Types
// ============================================================================

export interface Admin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string | null;
  regularPrice: number;
  salePrice: number | null;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  shippingAddressId: string;
  billingAddressId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  total: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    images: string[];
  };
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
    addresses: number;
  };
}

export interface CustomRequest {
  id: string;
  requestNumber: string;
  userId: string;
  status: string;
  title: string;
  description: string;
  budget: number | null;
  timeline: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  messages?: CustomRequestMessage[];
  quote?: CustomRequestQuote | null;
}

export interface CustomRequestMessage {
  id: string;
  customRequestId: string;
  message: string;
  isAdminReply: boolean;
  createdAt: string;
}

export interface CustomRequestQuote {
  id: string;
  customRequestId: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  pendingCustomRequests: number;
  revenueChange: number;
  ordersChange: number;
}

function mapProduct(product: any): Product {
  return {
    ...product,
    regularPrice: Number(product.regularPrice),
    salePrice: product.salePrice === null ? null : Number(product.salePrice),
    stockQuantity: product.variants?.reduce((total: number, variant: any) => total + Number(variant.stockQty ?? 0), 0) ?? 0,
    isActive: product.status === 'ACTIVE',
    images: product.media?.map((media: any) => media.url) ?? [],
  };
}

function mapCategory(category: any): Category {
  return { ...category, isActive: category.status === 'ACTIVE' };
}

function mapOrder(order: any): Order {
  return {
    ...order,
    status: order.orderStatus,
    tax: Number(order.taxAmount ?? 0),
    shippingAddressId: order.shippingMethodId,
    billingAddressId: order.shippingMethodId,
  };
}

// ============================================================================
// Auth Functions
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  admin: Admin;
  accessToken: string;
  refreshToken: string;
}

export async function adminLogin(credentials: LoginRequest): Promise<LoginResponse> {
  return adminApi.post<LoginResponse>('/admin/auth/login', credentials);
}

export async function adminLogout(): Promise<void> {
  try {
    const refreshToken = typeof window === 'undefined' ? '' : localStorage.getItem('adminRefreshToken') || '';
    await adminApi.post<void>('/admin/auth/logout', { refreshToken });
  } catch (error) {
    console.error('Logout error:', error);
  }
  // Clear local storage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
  }
}

export async function getAdminProfile(): Promise<Admin> {
  return adminApi.get<Admin>('/admin/auth/me');
}

// ============================================================================
// Dashboard Functions
// ============================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const data = await adminApi.get<any>('/admin/dashboard/stats');
  return {
    totalRevenue: Number(data.todayRevenue ?? 0),
    totalOrders: data.todayOrders ?? 0,
    totalCustomers: data.newCustomers ?? 0,
    totalProducts: data.alerts?.lowStockItems ?? 0,
    pendingOrders: 0,
    pendingCustomRequests: data.alerts?.pendingCustomRequests ?? 0,
    revenueChange: 0,
    ordersChange: 0,
  };
}

// ============================================================================
// Product Functions
// ============================================================================

export async function getProducts(): Promise<Product[]> {
  const data = await adminApi.get<{ items: any[] }>('/admin/products');
  return data.items.map(mapProduct);
}

export async function getProduct(id: string): Promise<Product> {
  return mapProduct(await adminApi.get<any>(`/admin/products/${id}`));
}

export interface CreateProductRequest {
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  regularPrice: number;
  salePrice?: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  images: string[];
}

export async function createProduct(data: CreateProductRequest): Promise<Product> {
  const product = await adminApi.post<any>('/admin/products', {
    ...data,
    status: data.isActive ? 'ACTIVE' : 'DRAFT',
  });
  return mapProduct(product);
}

export async function updateProduct(id: string, data: Partial<CreateProductRequest>): Promise<Product> {
  const product = await adminApi.patch<any>(`/admin/products/${id}`, {
    ...data,
    ...(data.isActive !== undefined ? { status: data.isActive ? 'ACTIVE' : 'DRAFT' } : {}),
  });
  return mapProduct(product);
}

export async function deleteProduct(id: string): Promise<void> {
  return adminApi.delete<void>(`/admin/products/${id}`);
}

// ============================================================================
// Category Functions
// ============================================================================

export async function getCategories(): Promise<Category[]> {
  const data = await adminApi.get<{ items: any[] }>('/admin/categories');
  return data.items.map(mapCategory);
}

export async function getCategory(id: string): Promise<Category> {
  return mapCategory(await adminApi.get<any>(`/admin/categories/${id}`));
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
}

export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  return mapCategory(await adminApi.post<any>('/admin/categories', {
    ...data,
    status: data.isActive ? 'ACTIVE' : 'DRAFT',
  }));
}

export async function updateCategory(id: string, data: Partial<CreateCategoryRequest>): Promise<Category> {
  return mapCategory(await adminApi.patch<any>(`/admin/categories/${id}`, {
    ...data,
    ...(data.isActive !== undefined ? { status: data.isActive ? 'ACTIVE' : 'DRAFT' } : {}),
  }));
}

export async function deleteCategory(id: string): Promise<void> {
  return adminApi.delete<void>(`/admin/categories/${id}`);
}

// ============================================================================
// Order Functions
// ============================================================================

export async function getOrders(): Promise<Order[]> {
  const data = await adminApi.get<{ items: any[] }>('/admin/orders');
  return data.items.map(mapOrder);
}

export async function getOrder(id: string): Promise<Order> {
  return mapOrder(await adminApi.get<any>(`/admin/orders/${id}`));
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  return adminApi.patch<Order>(`/admin/orders/${id}/status`, { orderStatus: status });
}

// ============================================================================
// Customer Functions
// ============================================================================

export async function getCustomers(): Promise<Customer[]> {
  const data = await adminApi.get<{ items: Customer[] }>('/admin/customers');
  return data.items;
}

export async function getCustomer(id: string): Promise<Customer> {
  return adminApi.get<Customer>(`/admin/customers/${id}`);
}

export async function updateCustomerStatus(id: string, isActive: boolean): Promise<Customer> {
  return adminApi.patch<Customer>(`/admin/customers/${id}/status`, { status: isActive ? 'ACTIVE' : 'SUSPENDED' });
}

// ============================================================================
// Custom Request Functions
// ============================================================================

export async function getCustomRequests(): Promise<CustomRequest[]> {
  const data = await adminApi.get<{ items: any[] }>('/admin/custom-orders/requests');
  return data.items.map((request) => ({
    ...request,
    requestNumber: request.customRequestNumber,
    budget: request.estimatedBudget,
    timeline: null,
    user: request.user ? { ...request.user, lastName: request.user.lastName ?? '' } : undefined,
  }));
}

export async function getCustomRequest(id: string): Promise<CustomRequest> {
  const request = await adminApi.get<any>(`/admin/custom-orders/requests/${id}`);
  const quote = request.quotes?.[0];
  return {
    ...request,
    requestNumber: request.customRequestNumber,
    budget: request.estimatedBudget ?? request.budgetRange ?? null,
    timeline: null,
    messages: (request.messages ?? []).map((message: any) => ({
      ...message,
      isAdminReply: message.senderType === 'ADMIN',
    })),
    quote: quote ? { ...quote, amount: Number(quote.total), description: quote.description ?? '' } : null,
  };
}

export async function updateCustomRequestStatus(id: string, status: string): Promise<CustomRequest> {
  return adminApi.patch<CustomRequest>(`/admin/custom-orders/requests/${id}/status`, { status });
}

export interface CreateQuoteRequest {
  amount: number;
  description: string;
}

export async function createQuote(requestId: string, data: CreateQuoteRequest): Promise<CustomRequestQuote> {
  return adminApi.post<CustomRequestQuote>(`/admin/custom-orders/requests/${requestId}/quotes`, data);
}

export interface SendMessageRequest {
  message: string;
  isAdminReply: boolean;
}

export async function sendCustomRequestMessage(requestId: string, data: SendMessageRequest): Promise<CustomRequestMessage> {
  return adminApi.post<CustomRequestMessage>(`/admin/custom-orders/requests/${requestId}/messages`, data);
}
