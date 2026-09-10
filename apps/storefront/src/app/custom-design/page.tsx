'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCustomRequest, isAuthenticated } from '@/lib/api';

export default function CustomDesignPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productCategory: '',
    desiredDimensions: '',
    preferredColors: '',
    preferredMaterials: '',
    quantity: 1,
    estimatedBudget: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const allowedExtensions = new Set([
    'jpg', 'jpeg', 'png', 'webp', 'gif', 'avif',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt',
  ]);
  const maxFiles = 8;
  const maxFileSize = 10 * 1024 * 1024;

  function addFiles(incoming: File[]) {
    setError(null);

    setSelectedFiles(prev => {
      const merged = [...prev, ...incoming];
      const unique = merged.filter((file, index, list) =>
        list.findIndex(item =>
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified
        ) === index
      );

      const valid = unique.filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        return allowedExtensions.has(ext) && file.size <= maxFileSize;
      });

      if (unique.some(file => !allowedExtensions.has(file.name.split('.').pop()?.toLowerCase() || ''))) {
        setError('Unsupported file type. Please use JPG, JPEG, PNG, WEBP, GIF, AVIF, PDF, DOC, DOCX, XLS, XLSX or TXT.');
      } else if (unique.some(file => file.size > maxFileSize)) {
        setError('Each reference file must be 10 MB or smaller.');
      }

      if (valid.length > maxFiles) {
        setError('You can upload a maximum of 8 reference files.');
        return valid.slice(0, maxFiles);
      }

      return valid;
    });
  }

  function removeFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function uploadReferenceFiles(requestId: string) {
    if (!selectedFiles.length) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api/v1';
    const token = localStorage.getItem('accessToken');

    if (!token) {
      throw new Error('Authentication token is missing.');
    }

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));

    const uploadResponse = await fetch(
      `${apiUrl}/custom-requests/${requestId}/files`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(
        Array.isArray(uploadData.message)
          ? uploadData.message.join(', ')
          : uploadData.message || 'Failed to upload reference files.'
      );
    }

    const attachments = Array.isArray(uploadData)
      ? uploadData.map((item: { url: string }) => item.url)
      : [];

    if (!attachments.length) return;

    const messageResponse = await fetch(
      `${apiUrl}/custom-requests/${requestId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Reference files attached.',
          attachments,
        }),
      }
    );

    const messageData = await messageResponse.json();

    if (!messageResponse.ok) {
      throw new Error(
        messageData.message || 'Files uploaded but could not be attached to the conversation.'
      );
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Check authentication
    if (!isAuthenticated()) {
      router.push('/auth/login?redirect=/custom-design');
      return;
    }

    setError(null);
    setSubmitting(true);

    const result = await createCustomRequest({
      title: formData.title,
      description: formData.description,
      productCategory: formData.productCategory || undefined,
      desiredDimensions: formData.desiredDimensions || undefined,
      preferredColors: formData.preferredColors || undefined,
      preferredMaterials: formData.preferredMaterials || undefined,
      quantity: formData.quantity,
      estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : undefined,
    });

    if (result.success && result.data) {
      try {
        await uploadReferenceFiles(result.data.id);
        router.push(`/custom-design/requests/${result.data.id}`);
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : 'Request was created, but the reference files could not be uploaded.'
        );
        setSubmitting(false);
      }
    } else {
      setError(result.message || 'Failed to submit request');
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-luxury-cream">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-luxury-night via-[#4A3F35] to-luxury-night text-white py-20">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl font-serif font-light tracking-tight mb-6">
            Bespoke <span className="text-luxury-gold">Design Service</span>
          </h1>
          <p className="text-xl text-luxury-cream/90 mb-8 leading-relaxed max-w-2xl mx-auto">
            Create something truly unique. Our master artisans will bring your vision to life with unparalleled craftsmanship.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-4xl font-serif font-semibold text-luxury-charcoal text-center mb-10">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-serif text-luxury-gold">1</span>
            </div>
            <h3 className="font-serif text-xl font-semibold text-luxury-charcoal mb-2">Share Your Vision</h3>
            <p className="text-base text-luxury-brown leading-relaxed">Tell us about your dream piece and requirements</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-serif text-luxury-gold">2</span>
            </div>
            <h3 className="font-serif text-xl font-semibold text-luxury-charcoal mb-2">Consultation</h3>
            <p className="text-base text-luxury-brown leading-relaxed">Our experts refine the design with you</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-serif text-luxury-gold">3</span>
            </div>
            <h3 className="font-serif text-xl font-semibold text-luxury-charcoal mb-2">Approval</h3>
            <p className="text-base text-luxury-brown leading-relaxed">Review quote and design before crafting begins</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-serif text-luxury-gold">4</span>
            </div>
            <h3 className="font-serif text-xl font-semibold text-luxury-charcoal mb-2">Handcrafted</h3>
            <p className="text-base text-luxury-brown leading-relaxed">Master artisans create your piece</p>
          </div>
        </div>
      </section>

      {/* Request Form */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="border border-luxury-sand bg-luxury-beige p-8 sm:p-12">
          <h2 className="text-3xl font-serif font-bold text-luxury-charcoal mb-8 text-center">
            Start Your Custom Design
          </h2>

          {error && (
            <div className="mb-8 border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-6 py-4 text-luxury-charcoal">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-base font-serif font-bold text-black mb-2 tracking-wide">
                Project Title *
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="input-luxury w-full"
                placeholder="e.g., Custom Living Room Rug"
              />
            </div>

            <div>
              <label className="block text-base font-serif font-bold text-black mb-2 tracking-wide">
                Product Category
              </label>
              <select
                name="productCategory"
                value={formData.productCategory}
                onChange={handleChange}
                className="input-luxury w-full"
              >
                <option value="">Select a category</option>
                <option value="Hand Knotted Rugs">Hand Knotted Rugs</option>
                <option value="Hand Tufted Rugs">Hand Tufted Rugs</option>
                <option value="Flat Weave Rugs">Flat Weave Rugs</option>
                <option value="Craft & Statue">Craft & Statue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-base font-serif font-bold text-black mb-2 tracking-wide">
                Detailed Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                className="input-luxury w-full"
                placeholder="Describe your vision in detail. Include style preferences, intended use, room decor, inspiration, or any specific requirements..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-serif font-bold text-black mb-2 tracking-wide">
                  Desired Dimensions
                </label>
                <input
                  name="desiredDimensions"
                  value={formData.desiredDimensions}
                  onChange={handleChange}
                  className="input-luxury w-full"
                  placeholder="e.g., 8x10 feet"
                />
              </div>

              <div>
                <label className="block text-base font-serif font-bold text-black mb-2 tracking-wide">
                  Quantity *
                </label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  className="input-luxury w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-serif font-bold text-black mb-2 tracking-wide">
                  Preferred Colors
                </label>
                <input
                  name="preferredColors"
                  value={formData.preferredColors}
                  onChange={handleChange}
                  className="input-luxury w-full"
                  placeholder="e.g., Ivory, Navy, Gold accents"
                />
              </div>

              <div>
                <label className="block text-base font-serif font-bold text-black mb-2 tracking-wide">
                  Preferred Materials
                </label>
                <input
                  name="preferredMaterials"
                  value={formData.preferredMaterials}
                  onChange={handleChange}
                  className="input-luxury w-full"
                  placeholder="e.g., Wool, Silk, Cotton"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-serif font-bold text-black mb-2 tracking-wide">
                Estimated Budget (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-brown">$</span>
                <input
                  name="estimatedBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimatedBudget}
                  onChange={handleChange}
                  className="input-luxury w-full pl-8"
                  placeholder="0.00"
                />
              </div>
              <p className="text-sm text-luxury-brown/80 mt-2">
                This helps us provide accurate recommendations
              </p>
            </div>

            <div className="border border-luxury-gold/30 bg-luxury-gold/5 p-6 sm:p-7">
              <h3 className="font-serif text-xl font-semibold text-black mb-2">
                Reference Files
              </h3>
              <p className="text-sm sm:text-base text-luxury-brown mb-5">
                Add inspiration images, documents or spreadsheets from your PC.
                You can choose files or drag and drop them here.
              </p>

              <input
                id="reference-files"
                type="file"
                multiple
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp,.gif,.avif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={e => addFiles(Array.from(e.target.files || []))}
              />

              <label
                htmlFor="reference-files"
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  addFiles(Array.from(e.dataTransfer.files));
                }}
                className={`block rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
                  isDragging
                    ? 'border-luxury-gold bg-luxury-gold/10'
                    : 'border-luxury-gold/40 hover:border-luxury-gold hover:bg-white/40'
                }`}
              >
                <div className="text-3xl mb-3">?</div>
                <p className="font-semibold text-luxury-charcoal">
                  Choose files from PC or drag & drop
                </p>
                <p className="text-sm text-luxury-brown mt-2">
                  Up to 8 files ? 10 MB per file
                </p>
                <p className="text-xs text-luxury-brown/70 mt-1">
                  JPG, JPEG, PNG, WEBP, GIF, AVIF, PDF, DOC, DOCX, XLS, XLSX, TXT
                </p>
              </label>

              {selectedFiles.length > 0 && (
                <div className="mt-5 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center justify-between gap-4 bg-white/70 border border-luxury-sand px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-luxury-charcoal truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-luxury-brown">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="shrink-0 text-sm font-semibold text-luxury-terracotta hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[#302b35] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#211e24] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting Request...' : 'Submit Design Request '}
            </button>

            <p className="text-xs text-luxury-brown/70 text-center">
              By submitting, you agree to our{' '}
              <Link href="/terms" className="text-luxury-gold underline">Terms of Service</Link>.
              One of our design specialists will contact you within 24 hours.
            </p>
          </form>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-luxury-beige py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-5xl mb-4"></div>
              <h3 className="text-xl font-serif text-luxury-charcoal mb-3">Master Craftsmanship</h3>
              <p className="text-luxury-brown">
                Decades of artisan experience in every piece
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4"></div>
              <h3 className="text-xl font-serif text-luxury-charcoal mb-3">No Commitment Quote</h3>
              <p className="text-luxury-brown">
                Free consultation and transparent pricing
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4"></div>
              <h3 className="text-xl font-serif text-luxury-charcoal mb-3">Global Delivery</h3>
              <p className="text-luxury-brown">
                White-glove shipping to your door anywhere
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
