'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { getCategory, createCategory, updateCategory, getCategories, Category, CreateCategoryRequest } from '@/lib/api';

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const isNew = categoryId === 'new';

  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    parentId: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
    if (!isNew) {
      loadCategory();
    }
  }, [categoryId]);

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data.filter(c => c.id !== categoryId)); // Exclude current category from parent options
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  async function loadCategory() {
    try {
      const category = await getCategory(categoryId);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        parentId: category.parentId || '',
        isActive: category.isActive,
      });
    } catch (error) {
      console.error('Failed to load category:', error);
      setError('Failed to load category');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Prepare data
      const data = {
        ...formData,
        description: formData.description || undefined,
        imageUrl: formData.imageUrl || undefined,
        parentId: formData.parentId || undefined,
      };

      if (isNew) {
        await createCategory(data);
      } else {
        await updateCategory(categoryId, data);
      }

      router.push('/categories');
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
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
            {isNew ? 'Add New Category' : 'Edit Category'}
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            {isNew ? 'Create a new product category' : 'Update category details'}
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
                  Category Name *
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

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                  placeholder="Brief description of this category"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Parent Category
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="">None (Top Level)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Optional: Make this a subcategory
                </p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="text-xl font-serif text-[var(--color-primary)] mb-4">
              Category Image
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {formData.imageUrl && (
                <div className="border border-[var(--color-border)] p-4">
                  <p className="text-sm text-[var(--color-muted)] mb-2">Preview:</p>
                  <img
                    src={formData.imageUrl}
                    alt="Category preview"
                    className="w-full max-w-md h-48 object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="text-xl font-serif text-[var(--color-primary)] mb-4">
              Options
            </h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-[var(--color-text)]">Active (visible in storefront)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white px-8 py-3 font-serif text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isNew ? 'Create Category' : 'Update Category'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/categories')}
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
