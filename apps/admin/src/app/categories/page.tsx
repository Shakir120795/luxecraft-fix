'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { getCategories, deleteCategory, Category } from '@/lib/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. It may have products associated with it.');
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[var(--color-primary)]">Categories</h1>
            <p className="text-[var(--color-muted)] mt-1">
              Organize your products into categories
            </p>
          </div>
          <Link
            href="/categories/new"
            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white px-6 py-3 font-serif text-sm uppercase tracking-wider transition-colors"
          >
            + Add Category
          </Link>
        </div>

        {/* Search */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <input
            type="search"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="animate-pulse text-[var(--color-muted)]">Loading categories...</div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="text-4xl mb-4">🏷️</div>
            <h3 className="text-xl font-serif text-[var(--color-primary)] mb-2">
              {searchTerm ? 'No Categories Found' : 'No Categories Yet'}
            </h3>
            <p className="text-[var(--color-muted)] mb-6">
              {searchTerm
                ? 'Try adjusting your search'
                : 'Get started by adding your first category'}
            </p>
            {!searchTerm && (
              <Link
                href="/categories/new"
                className="inline-block bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white px-6 py-3 font-serif text-sm uppercase tracking-wider transition-colors"
              >
                + Add Category
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-colors overflow-hidden"
              >
                {/* Image */}
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-[var(--color-border)] flex items-center justify-center text-4xl">
                    🏷️
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-serif text-[var(--color-primary)]">
                      {category.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium ${
                      category.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {category.description && (
                    <p className="text-sm text-[var(--color-muted)] mb-4 line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  <div className="text-xs text-[var(--color-muted)] mb-4">
                    Slug: {category.slug}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/categories/${category.id}`}
                      className="flex-1 text-center border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white px-4 py-2 text-sm uppercase tracking-wider transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      className="border border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 text-sm uppercase tracking-wider transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredCategories.length > 0 && (
          <div className="text-sm text-[var(--color-muted)]">
            Showing {filteredCategories.length} of {categories.length} categories
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
