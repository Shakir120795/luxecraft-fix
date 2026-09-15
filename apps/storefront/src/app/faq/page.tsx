'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getFaqs, FaqItem } from '@/lib/api';

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getFaqs()
      .then((data) => {
        if (mounted) setFaqs(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(faqs.map((faq) => faq.category)))],
    [faqs],
  );

  const filteredFaqs = useMemo(
    () =>
      activeCategory === 'All'
        ? faqs
        : faqs.filter((faq) => faq.category === activeCategory),
    [activeCategory, faqs],
  );

  return (
    <main className="min-h-screen bg-[#f8f6f2] text-[#302b35]">
      <section className="border-b border-[#ded8d0] bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a5d38]">
              Wolhomes Concierge
            </p>
            <h1 className="max-w-3xl font-serif text-5xl font-light tracking-tight text-[#302b35] sm:text-6xl lg:text-7xl">
              Answers for a more considered experience.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#756d73] sm:text-lg">
              Explore common questions about Wolhomes pieces, shipping, custom
              work, returns and payment.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#ded8d0] bg-[#f8f6f2] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setActiveCategory(category);
                  setOpenId(null);
                }}
                className={`shrink-0 border px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  activeCategory === category
                    ? 'border-[#8a5d38] bg-[#8a5d38] text-white'
                    : 'border-[#ded8d0] bg-white text-[#635b61] hover:border-[#8a5d38] hover:text-[#8a5d38]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="border border-[#ded8d0] bg-white p-12 text-center">
              <p className="text-sm text-[#756d73]">Loading answers...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="border border-[#ded8d0] bg-white p-12 text-center">
              <h2 className="font-serif text-2xl text-[#302b35]">
                No questions available
              </h2>
              <p className="mt-3 text-sm text-[#756d73]">
                Our FAQ collection is being updated. Please contact our
                concierge team for assistance.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#ded8d0] border-y border-[#ded8d0] bg-white">
              {filteredFaqs.map((faq) => {
                const isOpen = openId === faq.id;

                return (
                  <article key={faq.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className="flex w-full items-start justify-between gap-8 px-5 py-6 text-left transition-colors hover:bg-[#fbfaf8] sm:px-8 sm:py-7"
                    >
                      <span className="min-w-0">
                        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a5d38]">
                          {faq.category}
                        </span>
                        <span className="block font-serif text-xl leading-7 text-[#302b35] sm:text-2xl">
                          {faq.question}
                        </span>
                      </span>

                      <span
                        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-[#d8d1c9] text-lg text-[#8a5d38] transition-transform ${
                          isOpen ? 'rotate-45' : ''
                        }`}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-7 sm:px-8 sm:pb-8">
                        <div className="max-w-3xl border-l border-[#b99b7d] pl-5 text-sm leading-7 text-[#756d73] sm:pl-6">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-14 border border-[#ded8d0] bg-white p-8 sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a5d38]">
                  Still need help?
                </p>
                <h2 className="mt-2 font-serif text-3xl font-light text-[#302b35] sm:text-4xl">
                  Speak with the Wolhomes concierge.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#756d73]">
                  We are here to help with product details, custom projects,
                  orders and anything else you are considering.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/contact"
                  className="border border-[#8a5d38] bg-[#8a5d38] px-7 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
                >
                  Contact Us
                </Link>
                <Link
                  href="/custom-design"
                  className="border border-[#d8d1c9] px-7 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#302b35] transition-colors hover:border-[#8a5d38] hover:text-[#8a5d38]"
                >
                  Explore Custom Design
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}