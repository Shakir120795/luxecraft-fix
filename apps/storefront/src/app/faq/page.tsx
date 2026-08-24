'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Orders & Shipping',
    question: 'How long does shipping take?',
    answer: 'Standard shipping typically takes 7-10 business days. Express shipping is available and takes 3-5 business days. Custom orders may require additional time based on complexity.'
  },
  {
    category: 'Orders & Shipping',
    question: 'Do you ship internationally?',
    answer: 'Yes, we ship worldwide. International shipping times vary by destination, typically 10-21 business days. Additional customs fees may apply based on your country\'s regulations.'
  },
  {
    category: 'Orders & Shipping',
    question: 'How can I track my order?',
    answer: 'Once your order ships, you\'ll receive a tracking number via email. You can also track your order status from your account dashboard under "My Orders".'
  },
  {
    category: 'Orders & Shipping',
    question: 'Can I change or cancel my order?',
    answer: 'Orders can be modified or cancelled within 24 hours of placement. After this period, orders enter production and cannot be changed. Please contact us immediately if you need assistance.'
  },
  {
    category: 'Products & Quality',
    question: 'What materials do you use?',
    answer: 'We use premium, sustainably sourced hardwoods including walnut, oak, and maple. All metals are solid brass or stainless steel. Upholstery fabrics are carefully selected for durability and luxury.'
  },
  {
    category: 'Products & Quality',
    question: 'Are your products handmade?',
    answer: 'Yes, every piece is handcrafted by skilled artisans in our workshops. We combine traditional woodworking techniques with modern precision tools to ensure the highest quality.'
  },
  {
    category: 'Products & Quality',
    question: 'Do you offer warranties?',
    answer: 'All products come with a 5-year warranty covering manufacturing defects. Custom pieces include a lifetime structural warranty. Normal wear and tear is not covered.'
  },
  {
    category: 'Products & Quality',
    question: 'How do I care for my furniture?',
    answer: 'Care instructions are provided with each piece. Generally, dust regularly with a soft cloth, avoid direct sunlight and excessive moisture, and use coasters for drinks. Professional cleaning is recommended for upholstered items.'
  },
  {
    category: 'Custom Design',
    question: 'How does the custom design process work?',
    answer: 'Submit your design request through our custom design form. Our team will review and contact you within 2-3 business days. We\'ll discuss your vision, provide sketches, and create a detailed quote. Once approved, production begins.'
  },
  {
    category: 'Custom Design',
    question: 'How long do custom orders take?',
    answer: 'Custom orders typically take 8-12 weeks from design approval to delivery, depending on complexity. We\'ll provide a detailed timeline with your quote and keep you updated throughout the process.'
  },
  {
    category: 'Custom Design',
    question: 'Can I make changes to a custom order?',
    answer: 'Design changes can be made during the approval phase at no cost. Once production begins, significant changes may incur additional fees and extend the timeline.'
  },
  {
    category: 'Custom Design',
    question: 'What is the minimum order for custom pieces?',
    answer: 'We accept custom orders starting at $2,000. This ensures we can dedicate the proper time and resources to create a truly exceptional piece for you.'
  },
  {
    category: 'Returns & Refunds',
    question: 'What is your return policy?',
    answer: 'We offer 30-day returns on all standard products in original condition. Custom orders are non-refundable unless there\'s a manufacturing defect. Return shipping is the customer\'s responsibility.'
  },
  {
    category: 'Returns & Refunds',
    question: 'How do I initiate a return?',
    answer: 'Contact our customer service team to request a return authorization. Once approved, carefully pack the item and ship it back using a tracked service. Refunds are processed within 7-10 business days of receiving the return.'
  },
  {
    category: 'Returns & Refunds',
    question: 'What if my item arrives damaged?',
    answer: 'While rare, damage can occur during shipping. Contact us immediately with photos of the damage and packaging. We\'ll arrange a replacement or full refund at no cost to you.'
  },
  {
    category: 'Payment & Pricing',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for large orders. Payment is processed securely through our encrypted system.'
  },
  {
    category: 'Payment & Pricing',
    question: 'Do you offer financing?',
    answer: 'Yes, we offer financing options for purchases over $1,000 through our partner Affirm. Choose financing at checkout to see available payment plans with 0% APR options.'
  },
  {
    category: 'Payment & Pricing',
    question: 'Are prices negotiable?',
    answer: 'Our pricing reflects the quality of materials and craftsmanship. For large orders or trade customers, please contact our sales team to discuss volume discounts.'
  }
];

const categories = Array.from(new Set(faqs.map(faq => faq.category)));

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFAQs = activeCategory === 'All' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-luxury-night via-[#4A3F35] to-luxury-night text-white py-24">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-7xl font-serif font-light tracking-tight mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-luxury-cream/90 leading-relaxed max-w-3xl mx-auto">
            Find answers to common questions about our products, orders, and services
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category Filter */}
        <div className="mb-12 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-6 py-2 font-serif transition-colors ${
              activeCategory === 'All'
                ? 'bg-luxury-gold text-white'
                : 'border border-luxury-sand bg-luxury-beige text-luxury-brown hover:border-luxury-gold'
            }`}
          >
            All Questions
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 font-serif transition-colors ${
                activeCategory === category
                  ? 'bg-luxury-gold text-white'
                  : 'border border-luxury-sand bg-luxury-beige text-luxury-brown hover:border-luxury-gold'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="border border-luxury-sand bg-luxury-beige overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-luxury-cream transition-colors"
              >
                <div className="flex-1 pr-4">
                  <div className="text-xs uppercase tracking-wider text-luxury-brown mb-1">
                    {faq.category}
                  </div>
                  <h3 className="text-lg font-serif text-luxury-charcoal">
                    {faq.question}
                  </h3>
                </div>
                <div className="text-2xl text-luxury-gold">
                  {openIndex === index ? '−' : '+'}
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-6 text-luxury-brown leading-relaxed border-t border-luxury-sand pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-16 border border-luxury-sand bg-luxury-cream p-10 text-center">
          <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-4">
            Still Have Questions?
          </h2>
          <p className="text-luxury-brown mb-8 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our customer service team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-luxury px-8 py-3 inline-block">
              Contact Us
            </Link>
            <Link href="/products" className="btn-luxury-outline px-8 py-3 inline-block">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
