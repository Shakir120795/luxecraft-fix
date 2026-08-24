export default function Loading() {
  return (
    <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
      <div className="text-center">
        {/* Luxury Spinner */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-luxury-sand rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-luxury-gold rounded-full animate-spin"></div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-serif font-light text-luxury-charcoal mb-2">
          Loading
        </h2>
        <p className="text-luxury-brown">
          Please wait a moment...
        </p>
      </div>
    </div>
  );
}
