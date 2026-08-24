'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCustomRequests, isAuthenticated, CustomRequest } from '@/lib/api';

export default function CustomRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login?redirect=/custom-design/requests');
      return;
    }

    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await getCustomRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load custom requests:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-luxury-brown">
            <div className="w-4 h-4 bg-luxury-gold rounded-full animate-pulse" />
            <span className="font-serif">Loading requests...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-luxury-cream">
      {/* Header */}
      <div className="bg-luxury-beige border-b border-luxury-sand py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-3">
            My Custom Design Requests
          </h1>
          <p className="text-luxury-brown text-lg">Track your bespoke projects</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8 flex justify-between items-center">
          <Link
            href="/account"
            className="text-luxury-gold hover:text-luxury-darkGold underline"
          >
            ← Back to Account
          </Link>

          <Link
            href="/custom-design"
            className="btn-luxury px-6 py-3"
          >
            + New Request
          </Link>
        </div>

        {requests.length > 0 ? (
          <div className="space-y-6">
            {requests.map(request => (
              <Link
                key={request.id}
                href={`/custom-design/requests/${request.id}`}
                className="block border border-luxury-sand bg-luxury-beige p-6 hover:border-luxury-gold transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-serif text-xl text-luxury-charcoal">{request.title}</h3>
                      <span className={`text-xs px-3 py-1 ${
                        request.status === 'Completed' ? 'bg-luxury-gold/20 text-luxury-gold' :
                        request.status === 'In Progress' ? 'bg-luxury-gold/10 text-luxury-gold' :
                        request.status === 'Quoted' ? 'bg-luxury-gold/10 text-luxury-gold' :
                        'bg-luxury-sand text-luxury-brown'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-luxury-brown mb-2">
                      Request #{request.requestNumber}
                    </p>
                    {request.productCategory && (
                      <p className="text-sm text-luxury-brown/70">
                        Category: {request.productCategory}
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-sm text-luxury-brown/70">
                      Created {new Date(request.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {request.estimatedBudget && (
                      <p className="text-sm text-luxury-brown mt-1">
                        Budget: ${request.estimatedBudget.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-luxury-brown line-clamp-2 mb-4">{request.description}</p>

                <div className="flex items-center gap-6 text-sm text-luxury-brown/70">
                  {request.desiredDimensions && (
                    <span>📐 {request.desiredDimensions}</span>
                  )}
                  {request.quantity > 1 && (
                    <span>Qty: {request.quantity}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-luxury-sand bg-luxury-beige p-16 text-center">
            <div className="mb-6">
              <span className="text-8xl">✏️</span>
            </div>
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-4">
              No Custom Requests Yet
            </h2>
            <p className="text-luxury-brown mb-8 max-w-md mx-auto">
              Start your bespoke design journey. Our master artisans are ready to create something extraordinary for you.
            </p>
            <Link
              href="/custom-design"
              className="btn-luxury px-10 py-4 inline-block"
            >
              Create Custom Design →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
