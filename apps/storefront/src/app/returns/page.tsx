const sections = [
  {
    title: '14-Day Return Window',
    paragraphs: [
      'We offer a 14-day return policy. You have 14 days from the date you receive your item to request a return.',
      'To be eligible for a return:',
      'Your item must be unused, unworn, and in the same condition that you received it.',
      'It must be in the original packaging with all tags attached.',
      'Proof of purchase (order number or receipt) is required.',
    ],
  },
  {
    title: 'Non-Returnable Items (Custom & Personalized Orders)',
    paragraphs: [
      'Please note that Custom and Personalized Orders CANNOT be returned or exchanged.',
      'Why? Custom items are specially made-to-order according to your unique specifications, measurements, or designs, making them non-resalable.',
      'Defective or Damaged Custom Orders: If your custom item arrives damaged, defective, or incorrect due to our error, please contact us within 48 hours of delivery with photos, and we will immediately send a free replacement or issue a full refund.',
    ],
  },
  {
    title: 'How to Initiate a Return',
    paragraphs: [
      'Contact Us: Send an email to info@wolhomes.com with your Order ID and the reason for the return.',
      'Get Approval: Our team will review your request and send you the return shipping instructions and factory return address.',
      'Ship the Item: Package the item securely and send it back to our factory using a trackable shipping method.',
    ],
  },
  {
    title: 'Important Return Shipping & Duty Notice',
    paragraphs: [
      'The buyer is solely responsible for paying all return shipping charges, including any applicable customs duties, taxes, and import fees required to deliver the package directly to our Factory (Delivered Duty Paid / DDP). Returns shipped with unpaid duties or postage-due will not be accepted at our factory. (Note: Return shipping fees will only be covered by us if the item arrived damaged, defective, or incorrect).',
    ],
  },
  {
    title: 'Refunds',
    paragraphs: [
      'Once we receive and inspect your returned item at our factory, we will notify you via email regarding the approval or rejection of your refund.',
      'If approved, your refund will be processed immediately to your original method of payment (Credit Card, PayPal, etc.).',
      'Please allow 3 to 7 business days for the refund to reflect in your bank account, depending on your card issuer.',
    ],
  },
  {
    title: 'Damaged, Defective, or Incorrect Items',
    paragraphs: [
      'Please inspect your order upon arrival. If the item is defective, damaged, or if you received the wrong item, contact us immediately at info@wolhomes.com so we can evaluate the issue and make it right for you.',
    ],
  },
];

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#40372f] via-[#51463c] to-[#29241f] py-20 text-white md:py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4a556]">
            Returns
          </p>
          <h1 className="font-serif text-5xl font-light tracking-tight sm:text-6xl md:text-7xl">
            Return & Refund Policy
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-luxury-cream/90 sm:text-xl">
            Thank you for shopping with us! We want you to love your purchase. If you are not completely satisfied, we are here to help.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20 lg:px-10">
        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.title} className="border-b border-[#d8cec2] pb-10">
              <h2 className="mb-6 font-serif text-3xl font-light text-luxury-charcoal md:text-4xl">
                {section.title}
              </h2>
              <div className="space-y-4 text-lg leading-relaxed text-luxury-brown">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <section className="border-b border-[#d8cec2] pb-10">
            <h2 className="mb-6 font-serif text-3xl font-light text-luxury-charcoal md:text-4xl">
              Contact Us
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-luxury-brown">
              <p>If you have any questions about our Return Policy, please reach out to us:</p>
              <p>
                Email:{' '}
                <a href="mailto:info@wolhomes.com" className="text-luxury-gold underline hover:text-luxury-brown">
                  info@wolhomes.com
                </a>
              </p>
              <p>Customer Support Hours: Monday - Friday (9 AM - 5 PM EST)</p>
              <p>Factory Address: 575/2-C, Devpurwa Road, Mirzapur, Uttar Pradesh, India</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
