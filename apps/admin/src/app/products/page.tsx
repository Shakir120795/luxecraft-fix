'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { getProducts, deleteProduct, Product } from '@/lib/api';

function ProductStockCell({ product }: { product: Product }) {
  const listedVariants = Array.isArray(product.variants) ? product.variants : [];
  const namedVariants = listedVariants.filter(
    (variant) => variant.name?.trim().toLowerCase() !== 'default',
  );
  const variants = (namedVariants.length > 0 ? namedVariants : listedVariants)
    .sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );
  const trackedVariants = variants.filter((variant) => variant.trackInventory !== false);

  if (trackedVariants.length === 0) {
    return <span className="text-xs text-[var(--color-muted)]">Not tracked</span>;
  }

  const stock = trackedVariants.map((variant) => ({
    name: variant.name?.trim() || 'Default',
    available: Math.max(
      0,
      Number(variant.stockQty || 0) - Math.max(0, Number(variant.reservedQty || 0)),
    ),
  }));
  const totalAvailable = stock.reduce((total, variant) => total + variant.available, 0);

  return (
    <div className="min-w-[130px]">
      <span className={totalAvailable > 0 ? 'font-medium text-[var(--color-text)]' : 'font-semibold text-red-600'}>
        {totalAvailable} available
      </span>
      {stock.length > 1 && (
        <p className="mt-1 max-w-[240px] text-[10px] leading-4 text-[var(--color-muted)]">
          {stock.map((variant) => `${variant.name}: ${variant.available}`).join(' · ')}
        </p>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const loadInFlightRef = useRef(false);

  useEffect(() => {
    void loadProducts();

    const refreshVisibleStock = () => {
      if (document.visibilityState === 'visible') void loadProducts(true);
    };
    const interval = window.setInterval(refreshVisibleStock, 15000);
    window.addEventListener('focus', refreshVisibleStock);
    document.addEventListener('visibilitychange', refreshVisibleStock);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshVisibleStock);
      document.removeEventListener('visibilitychange', refreshVisibleStock);
    };
  }, []);

  async function loadProducts(silent = false) {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    if (!silent) setLoading(true);

    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('[ADMIN PRODUCTS] Failed to refresh product stock:', error);
      if (!silent) setProducts([]);
    } finally {
      loadInFlightRef.current = false;
      if (!silent) setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && product.isActive) ||
                         (filterStatus === 'inactive' && !product.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[var(--color-primary)]">Products</h1>
            <p className="text-[var(--color-muted)] mt-1">
              Manage your product catalog
            </p>
            <p className="mt-1 text-[10px] text-[var(--color-muted)]">
              Available stock and per-size counts refresh automatically every 15 seconds.
            </p>
          </div>
          <Link
            href="/products/new"
            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white px-6 py-3 font-serif text-sm uppercase tracking-wider transition-colors"
          >
            + Add Product
          </Link>
        </div>

        {/* Filters */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="search"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="animate-pulse text-[var(--color-muted)]">Loading products...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="text-4xl mb-4"></div>
            <h3 className="text-xl font-serif text-[var(--color-primary)] mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No Products Found' : 'No Products Yet'}
            </h3>
            <p className="text-[var(--color-muted)] mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first product'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link
                href="/products/new"
                className="inline-block bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white px-6 py-3 font-serif text-sm uppercase tracking-wider transition-colors"
              >
                + Add Product
              </Link>
            )}
          </div>
        ) : (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-[var(--color-bg)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover border border-[var(--color-border)]"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)]">
                              
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-[var(--color-text)]">
                              {product.name}
                            </div>
                            {product.isFeatured && (
                              <span className="text-xs text-[var(--color-accent)]"> Featured</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text)]">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text)]">
                        {product.salePrice ? (
                          <>
                            <span className="line-through text-[var(--color-muted)] mr-2">
                              ${product.regularPrice}
                            </span>
                            <span className="font-medium">${product.salePrice}</span>
                          </>
                        ) : (
                          <span>${product.regularPrice}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text)]">
                        <ProductStockCell product={product} />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {!loading && filteredProducts.length > 0 && (
          <div className="text-sm text-[var(--color-muted)]">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
