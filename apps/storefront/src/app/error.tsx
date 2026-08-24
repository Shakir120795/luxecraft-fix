'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-2xl text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="inline-block p-8 border-4 border-luxury-terracotta/30 rounded-full">
            <svg
              className="w-24 h-24 text-luxury-terracotta"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl md:text-5xl font-serif font-light text-luxury-charcoal mb-6">
          Something Went Wrong
        </h1>
        
        <p className="text-lg text-luxury-brown mb-8 max-w-lg mx-auto leading-relaxed">
          We encountered an unexpected error. Our team has been notified and is working to fix it.
        </p>

        {/* Error Details (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 border border-luxury-terracotta/50 bg-luxury-terracotta/10 p-6 text-left">
            <h3 className="font-mono text-sm text-luxury-charcoal mb-2">Error Details:</h3>
            <p className="font-mono text-xs text-luxury-brown break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-luxury-brown/70 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button
            onClick={reset}
            className="btn-luxury px-10 py-4"
          >
            Try Again
          </button>
          <Link href="/" className="btn-luxury-outline px-10 py-4 inline-block">
            Return Home
          </Link>
        </div>

        {/* Help Section */}
        <div className="border-t border-luxury-sand pt-12">
          <h3 className="text-lg font-serif text-luxury-charcoal mb-4">
            Need Assistance?
          </h3>
          <p className="text-luxury-brown mb-6">
            If this problem persists, please contact our support team.
          </p>
          <Link
            href="/contact"
            className="text-luxury-gold hover:text-luxury-brown transition-colors underline"
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </main>
  );
}
