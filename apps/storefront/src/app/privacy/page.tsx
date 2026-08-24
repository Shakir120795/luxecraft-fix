import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-luxury-night via-[#4A3F35] to-luxury-night text-white py-24">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-6xl md:text-7xl font-serif font-light tracking-tight mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-luxury-cream/90 leading-relaxed">
            Last updated: January 1, 2024
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-12">
            <p className="text-luxury-brown text-lg leading-relaxed">
              At LuxeCraft, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you visit our website or make a purchase 
              from us.
            </p>
          </section>

          {/* Section 1 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              1. Information We Collect
            </h2>
            <div className="space-y-6 text-luxury-brown leading-relaxed">
              <div>
                <h3 className="text-xl font-serif text-luxury-charcoal mb-3">
                  1.1 Personal Information
                </h3>
                <p>
                  When you make a purchase or create an account, we collect personal information including:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Name and contact information (email, phone, address)</li>
                  <li>Billing and shipping addresses</li>
                  <li>Payment information (processed securely through our payment providers)</li>
                  <li>Order history and preferences</li>
                  <li>Communication preferences</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-serif text-luxury-charcoal mb-3">
                  1.2 Automatically Collected Information
                </h3>
                <p>
                  When you visit our website, we automatically collect certain information:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>IP address and browser type</li>
                  <li>Device information and operating system</li>
                  <li>Pages visited and time spent on our site</li>
                  <li>Referring website and search terms</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-serif text-luxury-charcoal mb-3">
                  1.3 Custom Design Information
                </h3>
                <p>
                  For custom design requests, we collect additional information including design preferences, 
                  measurements, material choices, and photos or sketches you provide.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              2. How We Use Your Information
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Communicate with you about your orders and account</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Improve our website, products, and services</li>
                <li>Prevent fraud and enhance security</li>
                <li>Comply with legal obligations</li>
                <li>Analyze website usage and optimize user experience</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              3. Information Sharing
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Service Providers:</strong> Payment processors, shipping companies, and email 
                  service providers who assist in operating our business
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law, court order, or government 
                  regulation
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale 
                  of assets
                </li>
                <li>
                  <strong>Protection:</strong> To protect our rights, property, or safety, and that of 
                  our customers
                </li>
              </ul>
              <p className="mt-4">
                All third-party service providers are contractually obligated to protect your information 
                and use it only for the purposes we specify.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              4. Cookies & Tracking Technologies
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                We use cookies and similar technologies to enhance your browsing experience. Cookies are 
                small data files stored on your device that help us:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Remember your preferences and settings</li>
                <li>Keep you logged into your account</li>
                <li>Maintain items in your shopping cart</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Deliver personalized content and advertisements</li>
              </ul>
              <p className="mt-4">
                You can control cookie settings through your browser preferences. However, disabling 
                cookies may limit your ability to use certain features of our website.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              5. Data Security
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                We implement appropriate technical and organizational measures to protect your personal 
                information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>SSL encryption for data transmission</li>
                <li>Secure servers and databases</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Employee training on data protection</li>
              </ul>
              <p className="mt-4">
                While we strive to protect your information, no method of transmission over the internet 
                is 100% secure. We cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              6. Your Rights & Choices
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Access:</strong> Request a copy of the personal information we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Update or correct inaccurate information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal information (subject to 
                  legal requirements)
                </li>
                <li>
                  <strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time
                </li>
                <li>
                  <strong>Data Portability:</strong> Request your data in a portable format
                </li>
                <li>
                  <strong>Object:</strong> Object to certain processing of your personal information
                </li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:privacy@luxecraft.com" className="text-luxury-gold underline hover:text-luxury-brown">
                  privacy@luxecraft.com
                </a>
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              7. Data Retention
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                We retain your personal information for as long as necessary to fulfill the purposes 
                outlined in this policy, unless a longer retention period is required or permitted by law.
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Account information: Retained while your account is active</li>
                <li>Order history: Retained for 7 years for tax and legal purposes</li>
                <li>Marketing data: Retained until you opt-out</li>
                <li>Website analytics: Anonymized after 26 months</li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              8. Children's Privacy
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                Our website is not intended for children under 18 years of age. We do not knowingly 
                collect personal information from children. If we become aware that we have collected 
                information from a child, we will promptly delete it.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              9. International Transfers
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                Your information may be transferred to and processed in countries other than your country 
                of residence. These countries may have different data protection laws. We ensure appropriate 
                safeguards are in place to protect your information.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section className="mb-12 pb-8 border-b border-luxury-sand">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              10. Changes to This Policy
            </h2>
            <div className="space-y-4 text-luxury-brown leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant 
                changes by posting the new policy on our website and updating the "Last Updated" date. 
                Continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section className="mb-12">
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-6">
              11. Contact Us
            </h2>
            <div className="text-luxury-brown leading-relaxed">
              <p className="mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices:
              </p>
              <div className="border-l-4 border-luxury-gold pl-6">
                <p>
                  <strong>Privacy Officer</strong><br />
                  LuxeCraft<br />
                  123 Artisan Boulevard<br />
                  New York, NY 10001<br />
                  United States
                </p>
                <p className="mt-4">
                  Email:{' '}
                  <a href="mailto:privacy@luxecraft.com" className="text-luxury-gold hover:underline">
                    privacy@luxecraft.com
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
        <div className="mt-16 border border-luxury-sand bg-luxury-beige p-8">
          <h3 className="text-2xl font-serif text-luxury-charcoal mb-6">Related Policies</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/terms" className="text-luxury-brown hover:text-luxury-gold transition-colors">
              → Terms & Conditions
            </Link>
            <Link href="/shipping" className="text-luxury-brown hover:text-luxury-gold transition-colors">
              → Shipping Policy
            </Link>
            <Link href="/returns" className="text-luxury-brown hover:text-luxury-gold transition-colors">
              → Returns Policy
            </Link>
            <Link href="/contact" className="text-luxury-brown hover:text-luxury-gold transition-colors">
              → Contact Us
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
