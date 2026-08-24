import Link from 'next/link';

export default function ShippingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-luxury-night via-[#4A3F35] to-luxury-night text-white py-24">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-6xl md:text-7xl font-serif font-light tracking-tight mb-6">
            Shipping Information
          </h1>
          <p className="text-xl text-luxury-cream/90 leading-relaxed">
            Delivering craftsmanship to your door with care
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-12">
            <p className="text-luxury-brown text-lg leading-relaxed">
              We understand that receiving your LuxeCraft furniture is an exciting moment. We've partnered 
              with premium carriers to ensure your pieces arrive safely and on time.
            </p>
          </section>

          {/* Section 1 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Shipping Methods & Timeframes
            </h2>
            <div className="space-y-6">
              <div className="border border-luxury-sand bg-luxury-beige p-6">
                <h3 className="text-xl font-serif text-luxury-charcoal mb-3">Standard Shipping</h3>
                <div className="text-luxury-brown space-y-2">
                  <p><strong>Delivery Time:</strong> 7-10 business days</p>
                  <p><strong>Cost:</strong> $50-$150 depending on size and location</p>
                  <p><strong>Tracking:</strong> Provided via email</p>
                  <p className="text-sm mt-3">
                    Suitable for most items. White glove delivery not included.
                  </p>
                </div>
              </div>

              <div className="border border-luxury-sand bg-luxury-beige p-6">
                <h3 className="text-xl font-serif text-luxury-charcoal mb-3">Express Shipping</h3>
                <div className="text-luxury-brown space-y-2">
                  <p><strong>Delivery Time:</strong> 3-5 business days</p>
                  <p><strong>Cost:</strong> $150-$300 depending on size and location</p>
                  <p><strong>Tracking:</strong> Real-time tracking available</p>
                  <p className="text-sm mt-3">
                    Priority handling for faster delivery. White glove service available for additional fee.
                  </p>
                </div>
              </div>

              <div className="border border-luxury-gold bg-luxury-gold/10 p-6">
                <h3 className="text-xl font-serif text-luxury-charcoal mb-3">White Glove Delivery</h3>
                <div className="text-luxury-brown space-y-2">
                  <p><strong>Delivery Time:</strong> Scheduled within 2-3 weeks</p>
                  <p><strong>Cost:</strong> $200-$500 depending on location</p>
                  <p><strong>Includes:</strong></p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Inside delivery to room of choice</li>
                    <li>Unpacking and assembly</li>
                    <li>Placement and positioning</li>
                    <li>Packaging removal</li>
                    <li>Final inspection</li>
                  </ul>
                  <p className="text-sm mt-3">
                    Recommended for large, custom, or valuable pieces.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Processing Times
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-1/3 font-serif text-luxury-charcoal">In-Stock Items:</div>
                <div className="sm:w-2/3">1-2 business days</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-1/3 font-serif text-luxury-charcoal">Made-to-Order Items:</div>
                <div className="sm:w-2/3">4-6 weeks before shipping</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-1/3 font-serif text-luxury-charcoal">Custom Designs:</div>
                <div className="sm:w-2/3">8-12 weeks before shipping</div>
              </div>
              <p className="mt-6 text-sm">
                Processing times are in addition to shipping times. You'll receive email notifications 
                at each stage: order confirmed, in production, ready to ship, and shipped.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              International Shipping
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                We ship worldwide to most countries. International shipping includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Delivery time: 10-21 business days (varies by destination)</li>
                <li>Shipping cost: Calculated at checkout based on weight and destination</li>
                <li>Tracking provided for all international shipments</li>
                <li>Professional packaging to protect items during transit</li>
              </ul>
              <div className="mt-6 border border-luxury-terracotta/50 bg-luxury-terracotta/10 p-6">
                <h4 className="font-serif text-luxury-charcoal mb-2">Important Note:</h4>
                <p>
                  International customers are responsible for all customs duties, taxes, and import fees. 
                  These charges are determined by your country's customs office and are not included in 
                  our prices or shipping costs. Contact your local customs office for estimated charges.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Order Tracking
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                Once your order ships, you'll receive a tracking number via email. You can:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Track your shipment using the carrier's website</li>
                <li>View order status in your account dashboard</li>
                <li>Receive email updates at key delivery milestones</li>
                <li>Contact us if you have tracking concerns</li>
              </ul>
              <p className="mt-6">
                <Link href="/account/orders" className="text-luxury-gold underline hover:text-luxury-brown">
                  Track your orders →
                </Link>
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Packaging & Protection
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                Every piece is carefully packaged to ensure safe delivery:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Multiple layers of protective wrapping</li>
                <li>Reinforced corners and edges</li>
                <li>Custom crates for large or delicate items</li>
                <li>Moisture protection for international shipments</li>
                <li>Secure padding to prevent movement</li>
              </ul>
              <p className="mt-6">
                We recommend keeping all packaging materials until you've inspected your item and 
                confirmed it's in perfect condition.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Delivery Instructions
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                <strong>Before Delivery:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ensure someone 18+ is available to receive and sign for the delivery</li>
                <li>Measure doorways and hallways to confirm the item will fit</li>
                <li>Clear the delivery path of obstacles</li>
                <li>Provide any special access instructions (gate codes, elevator keys)</li>
              </ul>

              <p className="mt-6">
                <strong>Upon Delivery:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Inspect packaging for visible damage</li>
                <li>Note any damage on the delivery receipt</li>
                <li>Carefully unpack and inspect the item within 48 hours</li>
                <li>Contact us immediately if you discover any issues</li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Shipping Restrictions
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                We cannot ship to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>P.O. boxes (for large items)</li>
                <li>Military APO/FPO addresses (contact us for options)</li>
                <li>Some remote or restricted locations</li>
              </ul>
              <p className="mt-4">
                If you have questions about shipping to your location, please{' '}
                <Link href="/contact" className="text-luxury-gold underline hover:text-luxury-brown">
                  contact us
                </Link>{' '}
                before placing your order.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-12">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              Damaged or Lost Shipments
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                While rare, items can be damaged or lost during shipping:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Damaged in Transit:</strong> Contact us within 48 hours with photos. We'll 
                  file a claim and send a replacement at no cost.
                </li>
                <li>
                  <strong>Lost Shipment:</strong> If tracking shows no movement for 10+ days, contact 
                  us. We'll investigate and resolve promptly.
                </li>
                <li>
                  <strong>Delivery Issues:</strong> For delivery problems (wrong address, access issues), 
                  contact us immediately so we can work with the carrier.
                </li>
              </ul>
              <p className="mt-6">
                All shipments are fully insured. You will not be responsible for carrier-related damage or loss.
              </p>
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-16 border border-luxury-sand bg-luxury-beige p-10 text-center">
          <h3 className="text-3xl font-serif font-light text-luxury-charcoal mb-4">
            Questions About Shipping?
          </h3>
          <p className="text-luxury-brown mb-8 max-w-2xl mx-auto">
            Our customer service team is here to help with any shipping questions or concerns.
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
        <div className="mt-8 border border-luxury-sand bg-luxury-cream p-8">
          <h3 className="text-2xl font-serif text-luxury-charcoal mb-6">Related Policies</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/returns" className="text-luxury-brown hover:text-luxury-gold transition-colors">
              → Returns Policy
            </Link>
            <Link href="/terms" className="text-luxury-brown hover:text-luxury-gold transition-colors">
              → Terms & Conditions
            </Link>
            <Link href="/privacy" className="text-luxury-brown hover:text-luxury-gold transition-colors">
              → Privacy Policy
            </Link>
            <Link href="/account/orders" className="text-luxury-brown hover:text-luxury-gold transition-colors">
              → Track Orders
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
