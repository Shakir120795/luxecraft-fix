import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-2xl text-center">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-9xl font-serif font-light text-luxury-gold leading-none">
            404
          </h1>
        </div>

        {/* Error Message */}
        <h2 className="text-4xl md:text-5xl font-serif font-light text-luxury-charcoal mb-6">
          Page Not Found
        </h2>
        
        <p className="text-lg text-luxury-brown mb-12 max-w-lg mx-auto leading-relaxed">
          We couldn't find the page you're looking for. It may have been moved, deleted, 
          or perhaps the link was incorrect.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/" className="btn-luxury px-10 py-4 inline-block">
            Return Home
          </Link>
          <Link href="/products" className="btn-luxury-outline px-10 py-4 inline-block">
            Browse Products
          </Link>
        </div>

        {/* Quick Links */}
        <div className="border-t border-luxury-sand pt-12">
          <h3 className="text-lg font-serif text-luxury-charcoal mb-6">
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-luxury-brown">
            <Link href="/products" className="hover:text-luxury-gold transition-colors">
              Shop All
            </Link>
            <Link href="/custom-design" className="hover:text-luxury-gold transition-colors">
              Custom Design
            </Link>
            <Link href="/about" className="hover:text-luxury-gold transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="hover:text-luxury-gold transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
