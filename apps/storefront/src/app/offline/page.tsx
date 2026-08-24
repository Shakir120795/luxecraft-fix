'use client';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-2xl text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-block p-8 border-4 border-luxury-sand rounded-full">
            <svg
              className="w-24 h-24 text-luxury-brown"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-4xl md:text-5xl font-serif font-light text-luxury-charcoal mb-6">
          You're Offline
        </h1>
        
        <p className="text-lg text-luxury-brown mb-12 max-w-lg mx-auto leading-relaxed">
          It looks like you've lost your internet connection. Please check your network 
          and try again.
        </p>

        {/* Action */}
        <button
          onClick={() => window.location.reload()}
          className="btn-luxury px-10 py-4 mb-16"
        >
          Try Again
        </button>

        {/* Help Text */}
        <div className="border-t border-luxury-sand pt-12">
          <h3 className="text-lg font-serif text-luxury-charcoal mb-4">
            Troubleshooting Tips
          </h3>
          <ul className="text-luxury-brown space-y-2 max-w-md mx-auto text-left">
            <li>• Check your WiFi or mobile data connection</li>
            <li>• Try turning airplane mode off and on</li>
            <li>• Restart your router if using WiFi</li>
            <li>• Contact your internet service provider</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
