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
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  });

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
  return adminApi.post<LoginResponse>('/admin-auth/login', credentials);
}

export async function adminLogout(): Promise<void> {
  try {
    await adminApi.post<void>('/admin-auth/logout', {});
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
  return adminApi.get<Admin>('/admin-auth/profile');
}

// ============================================================================
// Dashboard Functions
// ============================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  // Mock data for now - replace with actual API call
  return {
    totalRevenue: 125000,
    totalOrders: 342,
    totalCustomers: 156,
    totalProducts: 89,
    pendingOrders: 12,
    pendingCustomRequests: 5,
    revenueChange: 12.5,
    ordersChange: 8.3,
  };
}

// ============================================================================
// Product Functions
// ============================================================================

export async function getProducts(): Promise<Product[]> {
  return adminApi.get<Product[]>('/products');
}

export async function getProduct(id: string): Promise<Product> {
  return adminApi.get<Product>(`/products/${id}`);
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
  return adminApi.post<Product>('/products', data);
}

export async function updateProduct(id: string, data: Partial<CreateProductRequest>): Promise<Product> {
  return adminApi.patch<Product>(`/products/${id}`, data);
}

export async function deleteProduct(id: string): Promise<void> {
  return adminApi.delete<void>(`/products/${id}`);
}

// ============================================================================
// Category Functions
// ============================================================================

export async function getCategories(): Promise<Category[]> {
  return adminApi.get<Category[]>('/categories');
}

export async function getCategory(id: string): Promise<Category> {
  return adminApi.get<Category>(`/categories/${id}`);
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
  return adminApi.post<Category>('/categories', data);
}

export async function updateCategory(id: string, data: Partial<CreateCategoryRequest>): Promise<Category> {
  return adminApi.patch<Category>(`/categories/${id}`, data);
}

export async function deleteCategory(id: string): Promise<void> {
  return adminApi.delete<void>(`/categories/${id}`);
}

// ============================================================================
// Order Functions
// ============================================================================

export async function getOrders(): Promise<Order[]> {
  return adminApi.get<Order[]>('/orders');
}

export async function getOrder(id: string): Promise<Order> {
  return adminApi.get<Order>(`/orders/${id}`);
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  return adminApi.patch<Order>(`/orders/${id}/status`, { status });
}

// ============================================================================
// Customer Functions
// ============================================================================

export async function getCustomers(): Promise<Customer[]> {
  return adminApi.get<Customer[]>('/users');
}

export async function getCustomer(id: string): Promise<Customer> {
  return adminApi.get<Customer>(`/users/${id}`);
}

export async function updateCustomerStatus(id: string, isActive: boolean): Promise<Customer> {
  return adminApi.patch<Customer>(`/users/${id}`, { isActive });
}

// ============================================================================
// Custom Request Functions
// ============================================================================

export async function getCustomRequests(): Promise<CustomRequest[]> {
  return adminApi.get<CustomRequest[]>('/custom-requests');
}

export async function getCustomRequest(id: string): Promise<CustomRequest> {
  return adminApi.get<CustomRequest>(`/custom-requests/${id}`);
}

export async function updateCustomRequestStatus(id: string, status: string): Promise<CustomRequest> {
  return adminApi.patch<CustomRequest>(`/custom-requests/${id}/status`, { status });
}

export interface CreateQuoteRequest {
  amount: number;
  description: string;
}

export async function createQuote(requestId: string, data: CreateQuoteRequest): Promise<CustomRequestQuote> {
  return adminApi.post<CustomRequestQuote>(`/custom-requests/${requestId}/quotes`, data);
}

export interface SendMessageRequest {
  message: string;
  isAdminReply: boolean;
}

export async function sendCustomRequestMessage(requestId: string, data: SendMessageRequest): Promise<CustomRequestMessage> {
  return adminApi.post<CustomRequestMessage>(`/custom-requests/${requestId}/messages`, data);
}
