'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AdminLayout,
  } from '@/components/AdminLayout';
import {
  getProduct,
  createProduct,
  updateProduct,
  getCategories,
  publishProduct,
  hideProduct,
  archiveProduct,
  restoreProduct,
  addProductMedia,
  updateProductMedia,
  deleteProductMedia,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
  addCustomizationOption,
  updateCustomizationOption,
  deleteCustomizationOption,
  Category,
  Product,
  ProductMedia,
  ProductVariant,
  ProductCustomizationOption,
  CreateProductRequest,
  CreateVariantRequest,
  AddCustomizationOptionRequest,
} from '@/lib/api';

type ProductStatus = 'DRAFT' | 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';

type FormState = {
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  shortDescription: string;
  description: string;

  regularPrice: string;
  salePrice: string;
  currency: string;

  stockQuantity: string;
  trackInventory: boolean;
  allowBackorder: boolean;

  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;

  seoTitle: string;
  seoDesc: string;

  status: ProductStatus;
  isFeatured: boolean;
  isCustomizable: boolean;
};

type MediaDraft = {
  id?: string;
  url: string;
  altText: string;
  isMain: boolean;
  sortOrder: number;
};

type VariantDraft = {
  id?: string;
  name: string;
  sku: string;
  regularPrice: string;
  salePrice: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  stockQty: string;
  lowStockAt: string;
  trackInventory: boolean;
  allowBackorder: boolean;
  isAvailable: boolean;
  sortOrder: number;
};

type CustomizationDraft = {
  id?: string;
  groupName: string;
  optionLabel: string;
  priceDelta: string;
  sortOrder: number;
  isAvailable: boolean;
};

function emptyForm(): FormState {
  return {
    name: '',
    slug: '',
    sku: '',
    categoryId: '',
    shortDescription: '',
    description: '',

    regularPrice: '',
    salePrice: '',
    currency: 'USD',

    stockQuantity: '0',
    trackInventory: true,
    allowBackorder: false,

    weightKg: '',
    lengthCm: '',
    widthCm: '',
    heightCm: '',

    seoTitle: '',
    seoDesc: '',

    status: 'DRAFT',
    isFeatured: false,
    isCustomizable: false,
  };
}

function numberValue(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function positiveNumber(value: string): number | undefined {
  const parsed = numberValue(value);
  return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

function nonNegativeNumber(value: string): number | undefined {
  const parsed = numberValue(value);
  return parsed !== undefined && parsed >= 0 ? parsed : undefined;
}

function makeVariant(): VariantDraft {
  return {
    name: '',
    sku: '',
    regularPrice: '',
    salePrice: '',
    weightKg: '',
    lengthCm: '',
    widthCm: '',
    heightCm: '',
    stockQty: '0',
    lowStockAt: '',
    trackInventory: true,
    allowBackorder: false,
    isAvailable: true,
    sortOrder: 0,
  };
}

function makeCustomization(): CustomizationDraft {
  return {
    groupName: '',
    optionLabel: '',
    priceDelta: '0',
    sortOrder: 0,
    isAvailable: true,
  };
}

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const isNew = productId === 'new';

  const [form, setForm] = useState<FormState>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [media, setMedia] = useState<MediaDraft[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [customizations, setCustomizations] = useState<CustomizationDraft[]>([]);
  const [useVariants, setUseVariants] = useState(false);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [selectedLocalFiles, setSelectedLocalFiles] = useState<string[]>([]);
  const [localPreviews, setLocalPreviews] = useState<
    { name: string; url: string }[]
  >([]);

  useEffect(() => {
    void loadInitialData();
  }, [productId]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError('');
      const categoryData = await getCategories();
      setCategories(categoryData.filter((category) => category.isActive));

      if (!isNew) {
        await loadProduct();
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  async function loadProduct() {
    const product = await getProduct(productId);

    setForm({
      name: product.name ?? '',
      slug: product.slug ?? '',
      sku: product.sku ?? '',
      categoryId: product.categoryId ?? '',
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',

      regularPrice: String(product.regularPrice ?? ''),
      salePrice: product.salePrice == null ? '' : String(product.salePrice),
      currency: product.currency ?? 'USD',

      stockQuantity: String(product.stockQuantity ?? 0),
      trackInventory: product.trackInventory !== false,
      allowBackorder: product.allowBackorder === true,

      weightKg: product.weightKg == null ? '' : String(product.weightKg),
      lengthCm: product.lengthCm == null ? '' : String(product.lengthCm),
      widthCm: product.widthCm == null ? '' : String(product.widthCm),
      heightCm: product.heightCm == null ? '' : String(product.heightCm),

      seoTitle: product.seoTitle ?? '',
      seoDesc: product.seoDesc ?? '',

      status: product.status ?? 'DRAFT',
      isFeatured: product.isFeatured === true,
      isCustomizable: product.isCustomizable === true,
    });

    setMedia(
      (product.media ?? []).map((item: ProductMedia, index: number) => ({
        id: item.id,
        url: item.url,
        altText: item.altText ?? '',
        isMain: item.isMain === true,
        sortOrder: item.sortOrder ?? index,
      })),
    );

    setVariants(
      (product.variants ?? []).map((item: ProductVariant, index: number) => ({
        id: item.id,
        name: item.name,
        sku: item.sku ?? '',
        regularPrice:
          item.regularPrice == null ? '' : String(item.regularPrice),
        salePrice: item.salePrice == null ? '' : String(item.salePrice),
        weightKg: item.weightKg == null ? '' : String(item.weightKg),
        lengthCm: item.lengthCm == null ? '' : String(item.lengthCm),
        widthCm: item.widthCm == null ? '' : String(item.widthCm),
        heightCm: item.heightCm == null ? '' : String(item.heightCm),
        stockQty: String(item.stockQty ?? 0),
        lowStockAt:
          item.lowStockAt == null ? '' : String(item.lowStockAt),
        trackInventory: item.trackInventory !== false,
        allowBackorder: item.allowBackorder === true,
        isAvailable: item.isAvailable !== false,
        sortOrder: item.sortOrder ?? index,
      })),
    );

    setCustomizations(
      (product.customizationOptions ?? []).map(
        (item: ProductCustomizationOption, index: number) => ({
          id: item.id,
          groupName: item.groupName,
          optionLabel: item.optionLabel,
          priceDelta: String(item.priceDelta ?? 0),
          sortOrder: item.sortOrder ?? index,
          isAvailable: item.isAvailable !== false,
        }),
      ),
    );

    setUseVariants((product.variants ?? []).length > 0);
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleNameChange(name: string) {
    setForm((current) => ({
      ...current,
      name,
      slug: isNew ? generateSlug(name) : current.slug,
    }));
  }

  function addImage() {
    const url = imageUrl.trim();
    if (!url) return;

    setMedia((current) => {
      const next = [
        ...current,
        {
          url,
          altText: imageAlt.trim(),
          isMain: current.length === 0,
          sortOrder: current.length,
        },
      ];
      return next;
    });

    setImageUrl('');
    setImageAlt('');
  }

  function setMainImage(index: number) {
    setMedia((current) =>
      current.map((item, itemIndex) => ({
        ...item,
        isMain: itemIndex === index,
      })),
    );
  }

  async function removeImage(index: number) {
    const target = media[index];

    try {
      if (target.id) {
        await deleteProductMedia(target.id);
      }

      setMedia((current) => {
        const next = current.filter((_, itemIndex) => itemIndex !== index);
        if (next.length > 0 && !next.some((item) => item.isMain)) {
          next[0] = { ...next[0], isMain: true };
        }
        return next.map((item, itemIndex) => ({
          ...item,
          sortOrder: itemIndex,
        }));
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    setMedia((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      return next.map((item, itemIndex) => ({
        ...item,
        sortOrder: itemIndex,
      }));
    });
  }

  function handleLocalFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/'),
    );

    if (imageFiles.length === 0) {
      setError('Please select image files only.');
      return;
    }

    const previews = imageFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setLocalPreviews((current) => [...current, ...previews]);

    setSelectedLocalFiles((current) => [
      ...current,
      ...imageFiles.map((file) => file.name),
    ]);

    setNotice(
      `${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} selected from your PC. Preview is available     now; permanent upload will be connected to R2.`,
    );
  }

  function addVariant() {
    setUseVariants(true);
    setVariants((current) => [
      ...current,
      {
        ...makeVariant(),
        sortOrder: current.length,
      },
    ]);
  }

  function updateVariant(index: number, changes: Partial<VariantDraft>) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...changes } : variant,
      ),
    );
  }

  async function removeVariant(index: number) {
    const variant = variants[index];

    try {
      if (variant.id) {
        await deleteProductVariant(variant.id);
      }

      setVariants((current) =>
        current
          .filter((_, variantIndex) => variantIndex !== index)
          .map((item, variantIndex) => ({
            ...item,
            sortOrder: variantIndex,
          })),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove variant',
      );
    }
  }

  function addCustomization() {
    updateForm('isCustomizable', true);
    setCustomizations((current) => [
      ...current,
      {
        ...makeCustomization(),
        sortOrder: current.length,
      },
    ]);
  }

  function updateCustomization(
    index: number,
    changes: Partial<CustomizationDraft>,
  ) {
    setCustomizations((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    );
  }

  async function removeCustomization(index: number) {
    const option = customizations[index];

    try {
      if (option.id) {
        await deleteCustomizationOption(option.id);
      }

      setCustomizations((current) =>
        current
          .filter((_, itemIndex) => itemIndex !== index)
          .map((item, itemIndex) => ({
            ...item,
            sortOrder: itemIndex,
          })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to remove customization option',
      );
    }
  }

  async function saveProduct(forcedStatus?: ProductStatus) {
    if (!form.name.trim()) {
      throw new Error('Product name is required.');
    }

    const regularPrice = positiveNumber(form.regularPrice);
    if (regularPrice === undefined) {
      throw new Error('Regular price must be greater than 0.');
    }

    if (!form.categoryId) {
      throw new Error('Please select a category.');
    }

    const payload: CreateProductRequest = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      sku: form.sku.trim() || undefined,
      categoryId: form.categoryId,
      description: form.description.trim() || undefined,
      shortDescription: form.shortDescription.trim() || undefined,

      regularPrice,
      salePrice: positiveNumber(form.salePrice),
      currency: form.currency.trim().toUpperCase() || 'USD',

      status: forcedStatus ?? form.status,

      weightKg: nonNegativeNumber(form.weightKg),
      lengthCm: nonNegativeNumber(form.lengthCm),
      widthCm: nonNegativeNumber(form.widthCm),
      heightCm: nonNegativeNumber(form.heightCm),

      seoTitle: form.seoTitle.trim() || undefined,
      seoDesc: form.seoDesc.trim() || undefined,

      trackInventory: form.trackInventory,
      allowBackorder: form.allowBackorder,
      isFeatured: form.isFeatured,
      isCustomizable:
        form.isCustomizable || customizations.length > 0,
    };

    const savedProduct = isNew
      ? await createProduct(payload)
      : await updateProduct(productId, payload);

    const savedId = savedProduct.id;

    // Save media
    const mediaResults: ProductMedia[] = [];
    const mainIndex = media.findIndex((item) => item.isMain);

    for (let index = 0; index < media.length; index += 1) {
      const item = media[index];
      const isMain = mainIndex >= 0 ? index === mainIndex : index === 0;

      if (!item.url.trim()) continue;

      if (item.id) {
        const updated = await updateProductMedia(item.id, {
          type: 'IMAGE',
          url: item.url.trim(),
          altText: item.altText.trim() || undefined,
          sortOrder: index,
          isMain,
        });
        mediaResults.push(updated);
      } else {
        const created = await addProductMedia(savedId, {
          type: 'IMAGE',
          url: item.url.trim(),
          altText: item.altText.trim() || undefined,
          sortOrder: index,
          isMain,
        });
        mediaResults.push(created);
      }
    }

    // Save variants
    if (useVariants || variants.length > 0) {
      for (let index = 0; index < variants.length; index += 1) {
        const item = variants[index];

        if (!item.name.trim()) continue;

        const variantData: CreateVariantRequest = {
          name: item.name.trim(),
          sku: item.sku.trim() || undefined,
          sortOrder: index,

          regularPrice: positiveNumber(item.regularPrice),
          salePrice: positiveNumber(item.salePrice),

          weightKg: nonNegativeNumber(item.weightKg),
          lengthCm: nonNegativeNumber(item.lengthCm),
          widthCm: nonNegativeNumber(item.widthCm),
          heightCm: nonNegativeNumber(item.heightCm),

          stockQty: Math.max(0, Math.floor(Number(item.stockQty || 0))),
          lowStockAt:
            item.lowStockAt.trim() === ''
              ? undefined
              : Math.max(0, Math.floor(Number(item.lowStockAt))),

          trackInventory: item.trackInventory,
          allowBackorder: item.allowBackorder,
          isAvailable: item.isAvailable,
        };

        if (item.id) {
          await updateProductVariant(item.id, variantData);
        } else {
          await addProductVariant(savedId, variantData);
        }
      }
    } else {
      // Keep inventory functional for products without explicit variants.
      await addProductVariant(savedId, {
        name: 'Default',
        sortOrder: 0,
        stockQty: Math.max(
          0,
          Math.floor(Number(form.stockQuantity || 0)),
        ),
        regularPrice,
        salePrice: positiveNumber(form.salePrice),
        trackInventory: form.trackInventory,
        allowBackorder: form.allowBackorder,
        isAvailable: true,
      });
    }

    // Save customization options
    for (let index = 0; index < customizations.length; index += 1) {
      const item = customizations[index];

      if (!item.groupName.trim() || !item.optionLabel.trim()) continue;

      const optionData: AddCustomizationOptionRequest = {
        groupName: item.groupName.trim(),
        optionLabel: item.optionLabel.trim(),
        priceDelta: numberValue(item.priceDelta) ?? 0,
        sortOrder: index,
        isAvailable: item.isAvailable,
      };

      if (item.id) {
        await updateCustomizationOption(item.id, optionData);
      } else {
        await addCustomizationOption(savedId, optionData);
      }
    }

    return savedProduct;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    forcedStatus?: ProductStatus,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setNotice('');

      await saveProduct(forcedStatus);

      setNotice(
        forcedStatus === 'ACTIVE'
          ? 'Product saved and published successfully.'
          : isNew
            ? 'Product created successfully.'
            : 'Product updated successfully.',
      );

      setTimeout(() => {
        router.push('/products');
      }, 700);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusAction(
    action:
      | 'publish'
      | 'hide'
      | 'archive'
      | 'restore',
  ) {
    if (isNew) return;

    try {
      setActionBusy(true);
      setError('');
      setNotice('');

      if (action === 'publish') await publishProduct(productId);
      if (action === 'hide') await hideProduct(productId);
      if (action === 'archive') await archiveProduct(productId);
      if (action === 'restore') await restoreProduct(productId);

      const nextStatus: ProductStatus =
        action === 'publish'
          ? 'ACTIVE'
          : action === 'hide'
            ? 'HIDDEN'
            : action === 'archive'
              ? 'ARCHIVED'
              : 'ACTIVE';

      updateForm('status', nextStatus);
      setNotice(`Product status changed to ${nextStatus}.`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to change status');
    } finally {
      setActionBusy(false);
    }
  }

  const totalVariantStock = useMemo(
    () =>
      variants.reduce(
        (total, variant) =>
          total + Math.max(0, Number(variant.stockQty || 0)),
        0,
      ),
    [variants],
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-[var(--color-border)]" />
          <div className="h-80 bg-[var(--color-border)]" />
          <div className="h-64 bg-[var(--color-border)]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Product Catalog
            </p>
            <h1 className="mt-2 text-4xl font-serif text-[var(--color-primary)]">
              {isNew ? 'Add New Product' : 'Edit Product'}
            </h1>
            <p className="mt-2 text-[var(--color-muted)]">
              {isNew
                ? 'Create a complete product for your LuxeCraft storefront.'
                : 'Manage product details, media, variants, customization and publishing.'}
            </p>
          </div>

          {!isNew && (
            <div className="flex flex-wrap gap-2">
              {form.status !== 'ACTIVE' && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void handleStatusAction('publish')}
                  className="bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50"
                >
                  Publish
                </button>
              )}

              {form.status === 'ACTIVE' && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void handleStatusAction('hide')}
                  className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text)] disabled:opacity-50"
                >
                  Hide
                </button>
              )}

              {form.status !== 'ARCHIVED' && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void handleStatusAction('archive')}
                  className="border border-red-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-red-700 disabled:opacity-50"
                >
                  Archive
                </button>
              )}

              {form.status === 'ARCHIVED' && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void handleStatusAction('restore')}
                  className="bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50"
                >
                  Restore
                </button>
              )}
            </div>
          )}
        </div>

        {(error || notice) && (
          <div className="mb-6 space-y-3">
            {error && (
              <div className="border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">
                {error}
              </div>
            )}
            {notice && (
              <div className="border border-green-300 bg-green-50 px-5 py-4 text-sm text-green-800">
                {notice}
              </div>
            )}
          </div>
        )}

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
          {/* Basic Information */}
          <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-serif text-[var(--color-primary)]">
                Basic Information
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Core product information shown across the storefront.
              </p>
            </div>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                  placeholder="e.g. Persian Silk Rug - Royal Blue"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Slug
                  </label>
                  <input
                    value={form.slug}
                    onChange={(event) =>
                      updateForm('slug', event.target.value)
                    }
                    className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                    placeholder="persian-silk-rug-royal-blue"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    SKU
                  </label>
                  <input
                    value={form.sku}
                    onChange={(event) =>
                      updateForm('sku', event.target.value)
                    }
                    className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                    placeholder="PSR-001"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Category *
                  </label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(event) =>
                      updateForm('categoryId', event.target.value)
                    }
                    className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Currency
                  </label>
                  <input
                    maxLength={3}
                    value={form.currency}
                    onChange={(event) =>
                      updateForm('currency', event.target.value.toUpperCase())
                    }
                    className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 uppercase outline-none focus:border-[var(--color-accent)]"
                    placeholder="USD"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Short Description
                </label>
                <input
                  value={form.shortDescription}
                  onChange={(event) =>
                    updateForm('shortDescription', event.target.value)
                  }
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                  placeholder="Short customer-friendly summary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  rows={7}
                  value={form.description}
                  onChange={(event) =>
                    updateForm('description', event.target.value)
                  }
                  className="w-full resize-y border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                  placeholder="Detailed product description..."
                />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-serif text-[var(--color-primary)]">
                Pricing
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Set your base price and optional sale price.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Regular Price *
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.regularPrice}
                  onChange={(event) =>
                    updateForm('regularPrice', event.target.value)
                  }
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Sale Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(event) =>
                    updateForm('salePrice', event.target.value)
                  }
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Currency Code
                </label>
                <input
                  maxLength={3}
                  value={form.currency}
                  onChange={(event) =>
                    updateForm('currency', event.target.value.toUpperCase())
                  }
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 uppercase outline-none focus:border-[var(--color-accent)]"
                  placeholder="USD"
                />
              </div>
            </div>
          </section>

          {/* Inventory */}
          <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-serif text-[var(--color-primary)]">
                Inventory
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Inventory can be managed directly or through variants.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {!useVariants && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stockQuantity}
                    onChange={(event) =>
                      updateForm('stockQuantity', event.target.value)
                    }
                    className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              )}

              {useVariants && (
                <div className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                    Variant Stock
                  </p>
                  <p className="mt-2 text-2xl font-serif text-[var(--color-primary)]">
                    {totalVariantStock}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Total stock across all variants
                  </p>
                </div>
              )}

              <label className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.trackInventory}
                  onChange={(event) =>
                    updateForm('trackInventory', event.target.checked)
                  }
                  className="h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-medium">
                    Track inventory
                  </span>
                  <span className="block text-xs text-[var(--color-muted)]">
                    Reduce stock when orders are placed
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.allowBackorder}
                  onChange={(event) =>
                    updateForm('allowBackorder', event.target.checked)
                  }
                  className="h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-medium">
                    Allow backorder
                  </span>
                  <span className="block text-xs text-[var(--color-muted)]">
                    Accept orders when stock is unavailable
                  </span>
                </span>
              </label>
            </div>
          </section>

          {/* Physical Details */}
          <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-serif text-[var(--color-primary)]">
                Physical Details
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Optional product measurements for shipping and product details.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.weightKg}
                  onChange={(event) =>
                    updateForm('weightKg', event.target.value)
                  }
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Length (cm)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.lengthCm}
                  onChange={(event) =>
                    updateForm('lengthCm', event.target.value)
                  }
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Width (cm)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.widthCm}
                  onChange={(event) =>
                    updateForm('widthCm', event.target.value)
                  }
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.heightCm}
                  onChange={(event) =>
                    updateForm('heightCm', event.target.value)
                  }
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-serif text-[var(--color-primary)]">
                Product Images
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Add external image URLs now. PC upload is prepared for the R2
                storage connection.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
                <h3 className="font-serif text-lg">Add Image URL</h3>

                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  className="mt-4 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                  placeholder="https://..."
                />

                <input
                  type="text"
                  value={imageAlt}
                  onChange={(event) => setImageAlt(event.target.value)}
                  className="mt-3 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                  placeholder="Alt text"
                />

                <button
                  type="button"
                  onClick={addImage}
                  className="mt-4 bg-[var(--color-accent)] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Add Image
                </button>
              </div>

              <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-5">
                <h3 className="font-serif text-lg">Upload from PC</h3>

                <label className="mt-4 flex cursor-pointer items-center justify-center border border-[var(--color-accent)] px-5 py-4 text-center text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-surface)]">
                  Choose image files
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => handleLocalFiles(event.target.files)}
                    className="hidden"
                  />
                </label>

                {selectedLocalFiles.length > 0 && (
                  <div className="mt-4 space-y-1 text-xs text-[var(--color-muted)]">
                    {selectedLocalFiles.map((name) => (
                      <div key={name}>{name}</div>
                    ))}
                  </div>
                )}
                {localPreviews.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                      Selected from PC
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {localPreviews.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]"
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-28 w-full object-cover"
                      />

                      <div className="p-2">
                        <p className="truncate text-xs text-[var(--color-text)]">
                          {file.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

                <p className="mt-4 text-xs leading-5 text-[var(--color-muted)]">
                  Cloud upload will be connected to Cloudflare R2 after R2
                  activation. Selecting files here does not upload them yet.
                </p>
              </div>
            </div>

            {media.length > 0 && (
              <div className="mt-6 space-y-4">
                {media.map((item, index) => (
                  <div
                    key={item.id ?? `${item.url}-${index}`}
                    className="grid gap-4 border border-[var(--color-border)] bg-[var(--color-bg)] p-4 md:grid-cols-[110px_1fr_auto]"
                  >
                    <div className="h-24 w-28 overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
                      <img
                        src={item.url}
                        alt={item.altText || `Product image ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--color-muted)]">
                        {item.url}
                      </p>

                      <input
                        value={item.altText}
                        onChange={(event) =>
                          setMedia((current) =>
                            current.map((image, imageIndex) =>
                              imageIndex === index
                                ? { ...image, altText: event.target.value }
                                : image,
                            ),
                          )
                        }
                        className="mt-3 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                        placeholder="Alt text"
                      />

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMainImage(index)}
                          className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${
                            item.isMain
                              ? 'bg-[var(--color-accent)] text-white'
                              : 'border border-[var(--color-border)]'
                          }`}
                        >
                          {item.isMain ? 'Main Image' : 'Set Main'}
                        </button>

                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveImage(index, -1)}
                          className="border border-[var(--color-border)] px-3 py-2 text-xs disabled:opacity-40"
                        >
                          Move Left
                        </button>

                        <button
                          type="button"
                          disabled={index === media.length - 1}
                          onClick={() => moveImage(index, 1)}
                          className="border border-[var(--color-border)] px-3 py-2 text-xs disabled:opacity-40"
                        >
                          Move Right
                        </button>

                        <button
                          type="button"
                          onClick={() => void removeImage(index)}
                          className="border border-red-300 px-3 py-2 text-xs font-semibold text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Variants */}
          <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-serif text-[var(--color-primary)]">
                  Variants
                </h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Add sizes, finishes or other purchasable variants.
                </p>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="bg-[var(--color-accent)] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white"
              >
                + Add Variant
              </button>
            </div>

            {variants.length === 0 && (
              <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-6 text-sm text-[var(--color-muted)]">
                No variants yet. Add a variant when different sizes/options
                need separate stock or pricing. Without variants, a default
                variant will be created from the inventory fields when saved.
              </div>
            )}

            <div className="space-y-5">
              {variants.map((variant, index) => (
                <div
                  key={variant.id ?? `variant-${index}`}
                  className="border border-[var(--color-border)] bg-[var(--color-bg)] p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-serif text-xl">
                      Variant {index + 1}
                    </h3>

                    <button
                      type="button"
                      onClick={() => void removeVariant(index)}
                      className="text-xs font-semibold uppercase tracking-wider text-red-700"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                        Variant Name *
                      </label>
                      <input
                        value={variant.name}
                        onChange={(event) =>
                          updateVariant(index, { name: event.target.value })
                        }
                        className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
                        placeholder="Large - 400x300cm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                        SKU
                      </label>
                      <input
                        value={variant.sku}
                        onChange={(event) =>
                          updateVariant(index, { sku: event.target.value })
                        }
                        className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
                        placeholder="SKU-L"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                        Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={variant.stockQty}
                        onChange={(event) =>
                          updateVariant(index, { stockQty: event.target.value })
                        }
                        className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                        Regular Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.regularPrice}
                        onChange={(event) =>
                          updateVariant(index, {
                            regularPrice: event.target.value,
                          })
                        }
                        className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                        Sale Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.salePrice}
                        onChange={(event) =>
                          updateVariant(index, {
                            salePrice: event.target.value,
                          })
                        }
                        className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                        Low Stock At
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.lowStockAt}
                        onChange={(event) =>
                          updateVariant(index, {
                            lowStockAt: event.target.value,
                          })
                        }
                        className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                        Weight kg
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={variant.weightKg}
                        onChange={(event) =>
                          updateVariant(index, {
                            weightKg: event.target.value,
                          })
                        }
                        className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
                      />
                    </div>

                    {[
                      ['lengthCm', 'Length cm'],
                      ['widthCm', 'Width cm'],
                      ['heightCm', 'Height cm'],
                    ].map(([field, label]) => (
                      <div key={field}>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                          {label}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant[field as keyof VariantDraft] as string}
                          onChange={(event) =>
                            updateVariant(index, {
                              [field]: event.target.value,
                            } as Partial<VariantDraft>)
                          }
                          className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-5 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={variant.trackInventory}
                        onChange={(event) =>
                          updateVariant(index, {
                            trackInventory: event.target.checked,
                          })
                        }
                      />
                      Track inventory
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={variant.allowBackorder}
                        onChange={(event) =>
                          updateVariant(index, {
                            allowBackorder: event.target.checked,
                          })
                        }
                      />
                      Allow backorder
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={variant.isAvailable}
                        onChange={(event) =>
                          updateVariant(index, {
                            isAvailable: event.target.checked,
                          })
                        }
                      />
                      Available on storefront
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Customization */}
          <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-serif text-[var(--color-primary)]">
                  Customization Options
                </h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Add customer-selectable options such as Size, Color or Material.
                </p>
              </div>

              <button
                type="button"
                onClick={addCustomization}
                className="bg-[var(--color-accent)] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white"
              >
                + Add Option
              </button>
            </div>

            {customizations.length === 0 && (
              <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-6 text-sm text-[var(--color-muted)]">
                No customization options configured.
              </div>
            )}

            <div className="space-y-4">
              {customizations.map((item, index) => (
                <div
                  key={item.id ?? `custom-${index}`}
                  className="grid gap-4 border border-[var(--color-border)] bg-[var(--color-bg)] p-5 md:grid-cols-[1fr_1fr_160px_auto]"
                >
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                      Group
                    </label>
                    <input
                      value={item.groupName}
                      onChange={(event) =>
                        updateCustomization(index, {
                          groupName: event.target.value,
                        })
                      }
                      className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
                      placeholder="Size"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                      Option
                    </label>
                    <input
                      value={item.optionLabel}
                      onChange={(event) =>
                        updateCustomization(index, {
                          optionLabel: event.target.value,
                        })
                      }
                      className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
                      placeholder="Large"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                      Price Delta
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.priceDelta}
                      onChange={(event) =>
                        updateCustomization(index, {
                          priceDelta: event.target.value,
                        })
                      }
                      className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => void removeCustomization(index)}
                      className="w-full border border-red-300 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-red-700"
                    >
                      Remove
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-sm md:col-span-4">
                    <input
                      type="checkbox"
                      checked={item.isAvailable}
                      onChange={(event) =>
                        updateCustomization(index, {
                          isAvailable: event.target.checked,
                        })
                      }
                    />
                    Available to customers
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* SEO */}
          <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-serif text-[var(--color-primary)]">
                SEO
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Optional search-engine metadata.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  SEO Title
                </label>
                <input
                  maxLength={200}
                  value={form.seoTitle}
                  onChange={(event) =>
                    updateForm('seoTitle', event.target.value)
                  }
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                  placeholder="Product title for search engines"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  SEO Description
                </label>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={form.seoDesc}
                  onChange={(event) =>
                    updateForm('seoDesc', event.target.value)
                  }
                  className="w-full resize-y border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                  placeholder="Meta description..."
                />
              </div>
            </div>
          </section>

          {/* Publishing */}
          <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-serif text-[var(--color-primary)]">
                Publishing & Storefront
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateForm(
                      'status',
                      event.target.value as ProductStatus,
                    )
                  }
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="HIDDEN">Hidden</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <label className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) =>
                    updateForm('isFeatured', event.target.checked)
                  }
                  className="h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-medium">
                    Featured product
                  </span>
                  <span className="block text-xs text-[var(--color-muted)]">
                    Eligible for featured/homepage placements
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isCustomizable}
                  onChange={(event) =>
                    updateForm('isCustomizable', event.target.checked)
                  }
                  className="h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-medium">
                    Customizable
                  </span>
                  <span className="block text-xs text-[var(--color-muted)]">
                    Product accepts customer options
                  </span>
                </span>
              </label>
            </div>
          </section>

          {/* Actions */}
          <div className="sticky bottom-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => router.push('/products')}
                className="border border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-3 text-sm font-serif"
              >
                Cancel
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[var(--color-accent)] px-8 py-3 text-sm font-serif uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : isNew
                      ? 'Create Product'
                      : 'Save Changes'}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    const fakeEvent = {
                      preventDefault() {},
                    } as FormEvent<HTMLFormElement>;

                    void handleSubmit(fakeEvent, 'ACTIVE');
                  }}
                  className="border border-[var(--color-accent)] px-8 py-3 text-sm font-serif uppercase tracking-wider text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save & Publish
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
