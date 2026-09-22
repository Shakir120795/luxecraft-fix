import Link from 'next/link';

const sections = [
  {
    title: '1. Information We Collect',
    paragraphs: [
      'When you visit our site or make a purchase, we collect certain personal information to process your order and provide a seamless shopping experience:',
      'Personal Details: Name, email address, phone number, shipping address, and billing address.',
      'Order & Customization Details: Specific dimensions, designs, or custom requirements for your handcrafted Hand-Tufted, Hand-Knotted or Flat Weave Rugs.',
      'Payment Information: Payment card details, PayPal information, or other financial details. (Note: All payments are processed securely through third-party encrypted payment gateways. We do not store your full payment card details on our servers.)',
      'Technical & Usage Data: IP address, browser type, device information, pages viewed, and cookies to improve website functionality.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    paragraphs: [
      'We use the information we collect for the following purposes:',
      'To process, manufacture, and ship your orders directly from our factory in Mirzapur, Uttar Pradesh, India to your doorstep.',
      'To communicate with you regarding order confirmations, tracking details, custom order approvals, or customer service requests.',
      'To manage your WOLHOMES account.',
      'To improve our website experience, products, and custom services.',
      'To send promotional emails and newsletters (only if you have opted in; you can unsubscribe at any time).',
    ],
  },
  {
    title: '3. Sharing Your Information',
    paragraphs: [
      'We respect your privacy and do not sell, trade, or rent your personal information to third parties. We only share information with trusted third parties to facilitate operations, such as:',
      'Shipping & Courier Partners: Global shipping carriers to handle door-to-door delivery from our factory to your destination.',
      'Payment Processors: Secure payment gateways to process transactions.',
      'Legal Requirements: If required by law, regulation, or legal process to protect our rights or comply with judicial proceedings.',
    ],
  },
  {
    title: '4. International Data Transfers',
    paragraphs: [
      'As our primary manufacturing facility and administrative operations are located at Devpurwa Road, Mirzapur, Uttar Pradesh, India, your data may be transferred and processed in India and other locations where our service providers operate. We ensure that appropriate security measures are taken to protect your personal data globally.',
    ],
  },
  {
    title: '5. Cookies and Tracking Technologies',
    paragraphs: [
      'WOLHOMES uses cookies to remember user preferences, maintain session state, and enhance site navigation. You can choose to disable cookies through your individual browser options, though some site functions may be affected.',
    ],
  },
  {
    title: '6. Data Security',
    paragraphs: [
      'We implement industry-standard administrative, technical, and physical security measures to safeguard your personal information. While we strive to use commercially acceptable means to protect your personal data, no method of transmission over the Internet or electronic storage is 100% secure.',
    ],
  },
  {
    title: '7. Contact Us Regarding Your Privacy',
    paragraphs: [
      'If you wish to access, correct, or delete any personal information we have about you, or if you have any questions regarding this policy, please reach out to us:',
      'Email: info@wolhomes.com',
      'Factory Address: 575/2-C, Devpurwa Road, Mirzapur, Uttar Pradesh – 231001, India',
    ],
  },
];

const intro = 'At WOLHOMES, accessible from our online store, protecting the privacy and security of our customers and website visitors is one of our main priorities. This Privacy Policy document outlines the types of information that is collected and recorded by WOLHOMES and how we use it.';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#40372f] via-[#51463c] to-[#29241f] py-20 text-white md:py-24 lg:py-28">
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <h1 className="mb-5 text-5xl font-serif font-light tracking-tight sm:text-6xl md:text-7xl">
            Privacy Policy
          </h1>
          <p className="max-w-2xl text-base text-luxury-cream/90 sm:text-lg md:text-xl">
            Effective Date: September 19, 2026
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20 lg:px-10">
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <p className="text-lg leading-relaxed text-luxury-brown">{intro}</p>
            <p className="mt-6 text-lg leading-relaxed text-luxury-brown">
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at{' '}
              <a href="mailto:info@wolhomes.com" className="text-luxury-gold underline hover:text-luxury-brown">
                info@wolhomes.com
              </a>.
            </p>
          </section>

          {sections.map((section) => (
            <section key={section.title} className="mb-14 border-b border-[#d8cec2] pb-10 last:border-b-0">
              <h2 className="mb-7 text-3xl font-serif font-light text-luxury-charcoal md:text-4xl">
                {section.title}
              </h2>
              <div className="space-y-4 leading-relaxed text-luxury-brown">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-[#ddd2c5] bg-white p-7 shadow-sm md:p-8">
          <h3 className="mb-6 text-2xl font-serif text-luxury-charcoal">Related Policies</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/terms" className="text-luxury-brown transition-colors hover:text-luxury-gold">
              Terms of Service
            </Link>
            <Link href="/returns" className="text-luxury-brown transition-colors hover:text-luxury-gold">
              Returns Policy
            </Link>
            <Link href="/contact" className="text-luxury-brown transition-colors hover:text-luxury-gold">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
