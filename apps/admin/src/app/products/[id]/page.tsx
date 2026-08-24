'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { getProduct, createProduct, updateProduct, getCategories, Category, CreateProductRequest } from '@/lib/api';

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const isNew = productId === 'new';

  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    slug: '',
    sku: '',
    description: '',
    shortDescription: '',
    regularPrice: 0,
    salePrice: 0,
    stockQuantity: 0,
    isActive: true,
    isFeatured: false,
    categoryId: '',
    images: [],
  });
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
    if (!isNew) {
      loadProduct();
    }
  }, [productId]);

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data.filter(c => c.isActive));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  async function loadProduct() {
    try {
      const product = await getProduct(productId);
      setFormData({
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        shortDescription: product.shortDescription || '',
        regularPrice: Number(product.regularPrice),
        salePrice: product.salePrice ? Number(product.salePrice) : 0,
        stockQuantity: product.stockQuantity,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        categoryId: product.categoryId,
        images: product.images,
      });
    } catch (error) {
      console.error('Failed to load product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(name: string) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function handleNameChange(name: string) {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  }

  function handleAddImage() {
    if (imageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, imageUrl.trim()],
      });
      setImageUrl('');
    }
  }

  function handleRemoveImage(index: number) {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Prepare data
      const data = {
        ...formData,
        salePrice: formData.salePrice || undefined,
        shortDescription: formData.shortDescription || undefined,
      };

      if (isNew) {
        await createProduct(data);
      } else {
        await updateProduct(productId, data);
      }

      router.push('/products');
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-[var(--color-border)]" />
          <div className="h-96 bg-[var(--color-border)]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-serif text-[var(--color-primary)]">
            {isNew ? 'Add New Product' : 'Edit Product'}
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            {isNew ? 'Create a new product in your catalog' : 'Update product details'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 border border-red-400 bg-red-50 px-6 py-4 text-red-800">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="text-xl font-serif text-[var(--color-primary)] mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  URL-friendly version (auto-generated from name)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  placeholder="Brief one-line description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="text-xl font-serif text-[var(--color-primary)] mb-4">
              Pricing & Inventory
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Regular Price * ($)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.regularPrice}
                  onChange={(e) => setFormData({ ...formData, regularPrice: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Sale Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salePrice || ''}
                  onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="text-xl font-serif text-[var(--color-primary)] mb-4">
              Product Images
            </h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                  className="flex-1 px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white px-6 py-2 text-sm uppercase tracking-wider transition-colors"
                >
                  Add
                </button>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover border border-[var(--color-border)]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="text-xl font-serif text-[var(--color-primary)] mb-4">
              Options
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-[var(--color-text)]">Active (visible in storefront)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-[var(--color-text)]">Featured (show on homepage)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white px-8 py-3 font-serif text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isNew ? 'Create Product' : 'Update Product'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/products')}
              className="border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)] text-[var(--color-text)] px-8 py-3 font-serif text-sm uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
