import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#40372f] via-[#51463c] to-[#29241f] text-white py-20 md:py-24 lg:py-28">
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 lg:px-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-light tracking-tight mb-5">
            Terms of Service
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-luxury-cream/90 leading-relaxed max-w-2xl">
            Effective Date: September 19, 2026
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-14 md:py-20">
        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-12">
            <p className="text-luxury-brown text-lg leading-relaxed">
              Welcome to Wolhomes. These Terms and Conditions ("Terms") govern your use of our website 
              and the purchase of our products. By accessing our website or making a purchase, you agree 
              to be bound by these Terms.
            </p>
          </section>

          {/* Section 1 */}
          <section className="mb-14 pb-10 border-b border-[#d8cec2]">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-luxury-charcoal mb-7">
              1. General Terms
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                <strong>1.1</strong> By placing an order with Wolhomes, you warrant that you are legally 
                capable of entering into binding contracts and are at least 18 years of age.
              </p>
              <p>
                <strong>1.2</strong> We reserve the right to refuse service to anyone for any reason at any time.
              </p>
              <p>
                <strong>1.3</strong> These Terms may be updated from time to time. Continued use of our 
                services after changes constitutes acceptance of the new Terms.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-14 pb-10 border-b border-[#d8cec2]">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-luxury-charcoal mb-7">
              2. Products & Pricing
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                <strong>2.1</strong> All products are subject to availability. We reserve the right to 
                discontinue any product at any time.
              </p>
              <p>
                <strong>2.2</strong> Prices are in USD and are subject to change without notice. The price 
                charged will be the price displayed at the time of order placement.
              </p>
              <p>
                <strong>2.3</strong> We strive to display product colors and details accurately, but cannot 
                guarantee that your device's display accurately reflects the actual product.
              </p>
              <p>
                <strong>2.4</strong> Custom products are made to order and specifications agreed upon during 
                the design consultation process.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-14 pb-10 border-b border-[#d8cec2]">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-luxury-charcoal mb-7">
              3. Orders & Payment
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                <strong>3.1</strong> All orders are subject to acceptance and availability. We may decline 
                orders at our discretion.
              </p>
              <p>
                <strong>3.2</strong> Payment must be received in full before orders are processed. We accept 
                major credit cards, PayPal, and bank transfers.
              </p>
              <p>
                <strong>3.3</strong> For custom orders, a 50% deposit is required to commence work. The 
                remaining balance is due before delivery.
              </p>
              <p>
                <strong>3.4</strong> You are responsible for providing accurate billing and shipping information. 
                We are not liable for delays or non-delivery due to incorrect information.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-14 pb-10 border-b border-[#d8cec2]">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-luxury-charcoal mb-7">
              4. Shipping & Delivery
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                <strong>4.1</strong> Shipping times are estimates and not guaranteed. See our{' '}{' '}
                for detailed information.
              </p>
              <p>
                <strong>4.2</strong> Risk of loss and title for products pass to you upon delivery to the carrier.
              </p>
              <p>
                <strong>4.3</strong> We are not responsible for delays caused by customs, weather, or carrier issues.
              </p>
              <p>
                <strong>4.4</strong> International customers are responsible for all customs duties, taxes, 
                and import fees.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-14 pb-10 border-b border-[#d8cec2]">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-luxury-charcoal mb-7">
              5. Returns & Refunds
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                <strong>5.1</strong> Standard products may be returned within 30 days of delivery in original 
                condition. See our{' '}
                <Link href="/returns" className="text-luxury-gold underline hover:text-luxury-brown">
                  Returns Policy
                </Link>{' '}
                for complete details.
              </p>
              <p>
                <strong>5.2</strong> Custom-made products are non-refundable except in cases of manufacturing 
                defects or damage during shipping.
              </p>
              <p>
                <strong>5.3</strong> Refunds will be issued to the original payment method within 7-10 business 
                days of receiving the returned item.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-14 pb-10 border-b border-[#d8cec2]">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-luxury-charcoal mb-7">
              6. Warranty
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                <strong>6.1</strong> All products carry a 5-year warranty against manufacturing defects under 
                normal use conditions.
              </p>
              <p>
                <strong>6.2</strong> Custom pieces include a lifetime structural warranty.
              </p>
              <p>
                <strong>6.3</strong> Warranties do not cover normal wear and tear, damage from misuse, 
                unauthorized modifications, or failure to follow care instructions.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-14 pb-10 border-b border-[#d8cec2]">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-luxury-charcoal mb-7">
              7. Intellectual Property
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                <strong>7.1</strong> All content on this website, including images, text, logos, and designs, 
                is the property of Wolhomes and protected by copyright and trademark laws.
              </p>
              <p>
                <strong>7.2</strong> You may not reproduce, distribute, or create derivative works from our 
                content without express written permission.
              </p>
              <p>
                <strong>7.3</strong> Custom designs created for you remain our intellectual property unless 
                otherwise agreed in writing.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-14 pb-10 border-b border-[#d8cec2]">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-luxury-charcoal mb-7">
              8. Limitation of Liability
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                <strong>8.1</strong> Wolhomes shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages arising from your use of our products or services.
              </p>
              <p>
                <strong>8.2</strong> Our total liability shall not exceed the amount paid for the product in question.
              </p>
              <p>
                <strong>8.3</strong> We are not liable for delays or failures in performance resulting from 
                circumstances beyond our reasonable control.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="mb-14 pb-10 border-b border-[#d8cec2]">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-luxury-charcoal mb-7">
              9. Privacy
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                Your use of our website is also governed by our{' '}
                <Link href="/privacy" className="text-luxury-gold underline hover:text-luxury-brown">
                  Privacy Policy
                </Link>
                , which is incorporated into these Terms by reference.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section className="mb-14 pb-10 border-b border-[#d8cec2]">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-luxury-charcoal mb-7">
              10. Governing Law
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                <strong>10.1</strong> These Terms are governed by the laws of the State of New York, 
                United States, without regard to conflict of law provisions.
              </p>
              <p>
                <strong>10.2</strong> Any disputes arising from these Terms or your use of our services 
                shall be resolved in the courts of New York, NY.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section className="mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-luxury-charcoal mb-7">
              11. Contact Information
            </h2>
            <div className="text-luxury-brown leading-relaxed">
              <p className="mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="rounded-r-xl border-l-4 border-[#b7925e] bg-white px-6 py-5 shadow-sm">
                <p>
                  <strong>Wolhomes</strong><br />
                  123 Artisan Boulevard<br />
                  New York, NY 10001<br />
                  United States
                </p>
                <p className="mt-4">
                  Email:{' '}
                  <a href="mailto:legal@wolhomes.com" className="text-luxury-gold hover:underline">
                    legal@wolhomes.com
                  </a>
                  <br />
                  Phone:{' '}
                  <a href="tel:+1234567890" className="text-luxury-gold hover:underline">
                    +1 (234) 567-890
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Related Links */}
        <div className="mt-16 rounded-2xl border border-[#ddd2c5] bg-white p-7 md:p-8 shadow-sm">
          <h3 className="text-2xl font-serif text-luxury-charcoal mb-6">Related Policies</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/privacy" className="text-luxury-brown hover:text-luxury-gold transition-colors">
               Privacy Policy
            </Link>
            <Link href="/returns" className="text-luxury-brown hover:text-luxury-gold transition-colors">
               Returns Policy
            </Link>
            <Link href="/contact" className="text-luxury-brown hover:text-luxury-gold transition-colors">
               Contact Us
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}


