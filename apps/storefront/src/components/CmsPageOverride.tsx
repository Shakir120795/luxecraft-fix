'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

interface SitePage {
  slug: string;
  title: string;
  lastUpdated: string;
  content: string;
}

const EDITABLE_SLUGS = new Set(['privacy', 'terms', 'about', 'returns', 'contact']);

function renderContent(content: string) {
  const blocks = content.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);

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
        <h2 key={index} className="mb-6 mt-10 border-b border-[#d8cec2] pb-4 text-3xl font-serif font-light text-luxury-charcoal">
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

export function CmsPageOverride({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const slug = useMemo(() => {
    const candidate = pathname?.replace(/^\//, '').split('/')[0] ?? '';
    return EDITABLE_SLUGS.has(candidate) ? candidate : null;
  }, [pathname]);

  const [page, setPage] = useState<SitePage | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!slug) {
      setPage(null);
      setChecked(true);
      return;
    }

    const controller = new AbortController();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api/v1';

    setChecked(false);
    fetch(`${apiBase}/storefront/pages/${slug}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const json = await response.json();
        const data = json?.data ?? json;
        return data?.content?.trim() ? (data as SitePage) : null;
      })
      .then((data) => setPage(data))
      .catch(() => setPage(null))
      .finally(() => setChecked(true));

    return () => controller.abort();
  }, [slug]);

  if (!checked || !page) {
    return <>{children}</>;
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
