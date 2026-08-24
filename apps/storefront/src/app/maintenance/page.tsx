import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-2xl text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-block p-8 border-4 border-luxury-gold/30 rounded-full">
            <svg
              className="w-24 h-24 text-luxury-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-4xl md:text-5xl font-serif font-light text-luxury-charcoal mb-6">
          Under Maintenance
        </h1>
        
        <p className="text-lg text-luxury-brown mb-8 max-w-lg mx-auto leading-relaxed">
          We're currently performing scheduled maintenance to improve your experience. 
          We'll be back shortly.
        </p>

        {/* Estimated Time */}
        <div className="inline-block border border-luxury-sand bg-luxury-beige px-8 py-4 mb-12">
          <p className="text-sm uppercase tracking-wider text-luxury-brown mb-1">
            Estimated Completion
          </p>
          <p className="text-2xl font-serif text-luxury-charcoal">
            30 Minutes
          </p>
        </div>

        {/* Updates Section */}
        <div className="border-t border-luxury-sand pt-12">
          <h3 className="text-lg font-serif text-luxury-charcoal mb-4">
            Stay Updated
          </h3>
          <p className="text-luxury-brown mb-6">
            Follow us on social media for real-time updates and announcements.
          </p>
          
          <div className="flex gap-6 justify-center text-luxury-brown">
            <a href="#" className="hover:text-luxury-gold transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-luxury-gold transition-colors">
              Instagram
            </a>
            <a href="#" className="hover:text-luxury-gold transition-colors">
              Facebook
            </a>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-12 border border-luxury-sand bg-luxury-cream p-6">
          <p className="text-luxury-brown text-sm">
            Urgent inquiries? Contact us at{' '}
            <a href="mailto:support@luxecraft.com" className="text-luxury-gold hover:underline">
              support@luxecraft.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
