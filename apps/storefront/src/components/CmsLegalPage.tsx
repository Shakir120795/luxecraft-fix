'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface SitePage {
  slug: string;
  title: string;
  lastUpdated: string;
  content: string;
}

function renderContent(content: string) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split('\n').map((line) => line.trimEnd());
    const first = lines[0]?.trim() ?? '';

    if (first.startsWith('### ')) {
      return (
        <h3 key={index} className="mb-4 mt-8 text-xl font-serif text-luxury-charcoal">
          {first.slice(4)}
        </h3>
      );
    }

    if (first.startsWith('## ')) {
      return (
        <h2
          key={index}
          className="mb-6 mt-10 border-b border-[#d8cec2] pb-4 text-3xl font-serif font-light text-luxury-charcoal"
        >
          {first.slice(3)}
        </h2>
      );
    }

    if (lines.every((line) => line.trim().startsWith('- '))) {
      return (
        <ul key={index} className="mb-6 list-disc space-y-2 pl-6 text-luxury-brown leading-relaxed">
          {lines.map((line, itemIndex) => (
            <li key={itemIndex}>{line.trim().slice(2)}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={index} className="mb-6 text-luxury-brown leading-relaxed">
        {lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {line}
            {lineIndex < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    );
  });
}

function LoadingPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#40372f] via-[#51463c] to-[#29241f] py-20 text-white md:py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <div className="h-3 w-28 animate-pulse rounded-full bg-white/20" />
          <div className="mt-6 h-16 max-w-3xl animate-pulse rounded-xl bg-white/10 sm:h-20" />
          <div className="mt-5 h-5 max-w-2xl animate-pulse rounded-full bg-white/10" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20 lg:px-10">
        <div className="space-y-5">
          <div className="h-5 w-11/12 animate-pulse rounded bg-[#e8e1d8]" />
          <div className="h-5 w-10/12 animate-pulse rounded bg-[#e8e1d8]" />
          <div className="h-5 w-8/12 animate-pulse rounded bg-[#e8e1d8]" />
          <div className="mt-8 h-8 w-5/12 animate-pulse rounded bg-[#ddd4c8]" />
          <div className="h-5 w-11/12 animate-pulse rounded bg-[#e8e1d8]" />
          <div className="h-5 w-9/12 animate-pulse rounded bg-[#e8e1d8]" />
        </div>
      </div>
    </main>
  );
}

export function CmsLegalPage({ slug }: { slug: string }) {
  const pathname = usePathname();
  const [page, setPage] = useState<SitePage | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!pathname) return;

    const controller = new AbortController();
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api/v1';

    setChecked(false);

    fetch(apiBase + '/storefront/pages/' + slug, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load page');
        const json = await response.json();
        const data = json?.data ?? json;

        if (!data?.content?.trim()) {
          throw new Error('Page content is unavailable');
        }

        return data as SitePage;
      })
      .then((data) => setPage(data))
      .catch(() => setPage(null))
      .finally(() => setChecked(true));

    return () => controller.abort();
  }, [pathname, slug]);

  if (!checked) {
    return <LoadingPage />;
  }

  if (!page) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] px-5 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#ddd2c5] bg-white p-10 text-center shadow-sm">
          <h1 className="font-serif text-3xl text-luxury-charcoal">
            This page is temporarily unavailable.
          </h1>
          <p className="mt-3 text-luxury-brown">
            Please try again in a moment.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#40372f] via-[#51463c] to-[#29241f] py-20 text-white md:py-24 lg:py-28">
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <h1 className="mb-5 text-5xl font-serif font-light tracking-tight sm:text-6xl md:text-7xl">
            {page.title}
          </h1>
          {page.lastUpdated ? (
            <p className="max-w-2xl text-base text-luxury-cream/90 sm:text-lg md:text-xl">
              Last updated: {page.lastUpdated}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20 lg:px-10">
        <div className="prose prose-lg max-w-none">
          {renderContent(page.content)}
        </div>
      </div>
    </main>
  );
}
