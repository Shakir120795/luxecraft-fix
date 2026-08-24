import Link from 'next/link';

export default function ReturnsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-luxury-night via-[#4A3F35] to-luxury-night text-white py-24">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-6xl md:text-7xl font-serif font-light tracking-tight mb-6">
            Returns & Refunds
          </h1>
          <p className="text-xl text-luxury-cream/90 leading-relaxed">
            Your satisfaction is our priority
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-12">
            <p className="text-luxury-brown text-lg leading-relaxed">
              We want you to love your LuxeCraft furniture. If you're not completely satisfied, we offer 
              a straightforward return policy to ensure your peace of mind.
            </p>
          </section>

          {/* Section 1 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              30-Day Return Policy
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <div className="border border-luxury-gold bg-luxury-gold/10 p-6">
                <p className="font-serif text-lg text-luxury-charcoal mb-3">
                  Standard Products
                </p>
                <p>
                  You may return any standard (non-custom) product within <strong>30 days of delivery</strong> 
                  for a full refund, provided the item is:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>In original, unused condition</li>
                  <li>In original packaging with all materials</li>
                  <li>Free from damage, stains, or alterations</li>
                  <li>Accompanied by proof of purchase</li>
                </ul>
              </div>

              <div className="border border-luxury-terracotta/50 bg-luxury-terracotta/10 p-6">
                <p className="font-serif text-lg text-luxury-charcoal mb-3">
                  Custom & Made-to-Order Products
                </p>
                <p>
                  Custom-made and made-to-order items are <strong>non-refundable</strong> except in cases of:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Manufacturing defects</li>
                  <li>Damage during shipping</li>
                  <li>Significant deviation from approved specifications</li>
                </ul>
                <p className="mt-3 text-sm">
                  These items are crafted specifically for you and cannot be resold.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              How to Initiate a Return
            </h2>
            <div className="space-y-6 text-luxury-brown leading-relaxed">
              <div className="flex gap-4">
                <div className="text-3xl font-serif text-luxury-gold">1</div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg text-luxury-charcoal mb-2">
                    Contact Us
                  </h3>
                  <p>
                    Email us at{' '}
                    <a href="mailto:returns@luxecraft.com" className="text-luxury-gold underline hover:text-luxury-brown">
                      returns@luxecraft.com
                    </a>{' '}
                    or call{' '}
                    <a href="tel:+1234567890" className="text-luxury-gold underline hover:text-luxury-brown">
                      +1 (234) 567-890
                    </a>
                    {' '}within 30 days of delivery. Provide your order number and reason for return.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl font-serif text-luxury-gold">2</div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg text-luxury-charcoal mb-2">
                    Receive Authorization
                  </h3>
                  <p>
                    We'll review your request and send a Return Authorization (RA) number within 1-2 
                    business days, along with return instructions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl font-serif text-luxury-gold">3</div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg text-luxury-charcoal mb-2">
                    Package & Ship
                  </h3>
                  <p>
                    Carefully repackage the item in its original packaging. Include the RA number on 
                    the outside of the box. Ship via a tracked service (you're responsible for return 
                    shipping costs).
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl font-serif text-luxury-gold">4</div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg text-luxury-charcoal mb-2">
                    Receive Refund
                  </h3>
                  <p>
                    Once we receive and inspect your return, we'll process your refund within 7-10 
                    business days to your original payment method.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Return Shipping Costs
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <div className="border-l-4 border-luxury-gold pl-6">
                <h4 className="font-serif text-luxury-charcoal mb-2">Customer Responsibility:</h4>
                <p>
                  If you're returning an item because you changed your mind, you're responsible for 
                  return shipping costs. We recommend using a tracked service with insurance.
                </p>
              </div>

              <div className="border-l-4 border-luxury-gold pl-6">
                <h4 className="font-serif text-luxury-charcoal mb-2">LuxeCraft Responsibility:</h4>
                <p>
                  If we sent the wrong item, or the item arrived damaged or defective, we'll cover all 
                  return shipping costs and send a prepaid label.
                </p>
              </div>

              <div className="border-l-4 border-luxury-gold pl-6">
                <h4 className="font-serif text-luxury-charcoal mb-2">Large Items:</h4>
                <p>
                  For furniture requiring freight shipping, please contact us to arrange return logistics. 
                  Special handling fees may apply.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Refund Processing
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                Once your return is received and inspected:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Approved Returns:</strong> Full refund processed within 7-10 business days 
                  to your original payment method
                </li>
                <li>
                  <strong>Original Shipping Fees:</strong> Not refundable (unless we made an error)
                </li>
                <li>
                  <strong>Partial Refunds:</strong> May apply if item shows signs of use or damage
                </li>
                <li>
                  <strong>Rejected Returns:</strong> Items not meeting return criteria will be sent 
                  back at your expense
                </li>
              </ul>
              <p className="mt-4 text-sm">
                Depending on your bank, it may take an additional 2-3 business days for the refund 
                to appear in your account.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Exchanges
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                We currently do not offer direct exchanges. If you'd like a different item:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Return the original item following our return process</li>
                <li>Once your refund is processed, place a new order</li>
              </ol>
              <p className="mt-4">
                For size or color variations within the same product line, contact us—we may be 
                able to arrange a direct exchange.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Damaged or Defective Items
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                If your item arrives damaged or has a manufacturing defect:
              </p>
              <div className="border border-luxury-sand bg-luxury-beige p-6">
                <ol className="list-decimal pl-6 space-y-3">
                  <li>
                    <strong>Inspect Upon Delivery:</strong> Note any visible damage on the delivery receipt
                  </li>
                  <li>
                    <strong>Contact Us Immediately:</strong> Within 48 hours, email photos of the damage 
                    to{' '}
                    <a href="mailto:support@luxecraft.com" className="text-luxury-gold underline hover:text-luxury-brown">
                      support@luxecraft.com
                    </a>
                  </li>
                  <li>
                    <strong>Resolution:</strong> We'll send a replacement or issue a full refund, including 
                    original shipping costs
                  </li>
                  <li>
                    <strong>No Return Needed:</strong> In many cases, we won't require you to return 
                    damaged items
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Non-Returnable Items
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                The following items cannot be returned:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Custom-made or personalized products</li>
                <li>Final sale or clearance items (marked as such)</li>
                <li>Items damaged due to misuse or negligence</li>
                <li>Items without original packaging or RA number</li>
                <li>Items returned after 30 days</li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Cancellations
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                <strong>Before Production:</strong> Orders can be cancelled within 24 hours of placement 
                for a full refund. Contact us immediately at{' '}
                <a href="mailto:support@luxecraft.com" className="text-luxury-gold underline hover:text-luxury-brown">
                  support@luxecraft.com
                </a>
              </p>
              <p>
                <strong>After Production Begins:</strong> Once an item enters production, it cannot be 
                cancelled. Our team begins crafting your piece shortly after order confirmation.
              </p>
              <p>
                <strong>Custom Orders:</strong> Cannot be cancelled once the design is approved and 
                deposit is paid, as materials are specifically sourced for your project.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="mb-12">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              International Returns
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                International customers may return items following the same policy, with these notes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You're responsible for all return shipping costs and customs fees</li>
                <li>Items must clear customs and arrive in our facility within 30 days</li>
                <li>Original customs duties and taxes are non-refundable</li>
                <li>Contact us before returning to ensure proper documentation</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Warranty Info */}
        <div className="mt-16 border border-luxury-sand bg-luxury-beige p-10">
          <h3 className="text-3xl font-serif font-light text-luxury-charcoal mb-4 text-center">
            Our Warranty
          </h3>
          <p className="text-luxury-brown mb-6 text-center max-w-2xl mx-auto">
            All LuxeCraft furniture includes a 5-year warranty against manufacturing defects. 
            Custom pieces include a lifetime structural warranty.
          </p>
          <div className="text-center">
            <Link href="/terms" className="text-luxury-gold underline hover:text-luxury-brown">
              Read Full Warranty Terms →
            </Link>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-8 border border-luxury-sand bg-luxury-cream p-10 text-center">
          <h3 className="text-3xl font-serif font-light text-luxury-charcoal mb-4">
            Questions About Returns?
          </h3>
          <p className="text-luxury-brown mb-8 max-w-2xl mx-auto">
            Our customer service team is here to make the return process as smooth as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-luxury px-8 py-3 inline-block">
              Contact Support
            </Link>
            <Link href="/faq" className="btn-luxury-outline px-8 py-3 inline-block">
              View FAQ
            </Link>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 border border-luxury-sand bg-luxury-beige p-8">
          <h3 className="text-2xl font-serif text-luxury-charcoal mb-6">Related Policies</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/shipping" className="text-luxury-brown hover:text-luxury-gold transition-colors">
              → Shipping Information
            </Link>
            <Link href="/terms" className="text-luxury-brown hover:text-luxury-gold transition-colors">
              → Terms & Conditions
            </Link>
            <Link href="/privacy" className="text-luxury-brown hover:text-luxury-gold transition-colors">
              → Privacy Policy
            </Link>
            <Link href="/account/orders" className="text-luxury-brown hover:text-luxury-gold transition-colors">
              → View Your Orders
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
