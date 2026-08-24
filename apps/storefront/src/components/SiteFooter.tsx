import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-luxury-sand bg-luxury-night text-luxury-ivory">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="font-serif text-2xl tracking-[0.16em]">LUXECRAFT</Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-luxury-ivory/70">
              Handcrafted pieces, thoughtfully chosen for enduring homes around the world.
            </p>
          </div>
          <FooterGroup title="Shop" links={['All pieces', 'New arrivals', 'Featured collections']} />
          <FooterGroup title="Our promise" links={['Artisan made', 'Worldwide delivery', 'Bespoke service']} />
          <div>
            <h2 className="text-xs uppercase tracking-[0.16em] text-luxury-gold">Private notes</h2>
            <p className="mt-4 text-sm leading-6 text-luxury-ivory/70">Join for collection previews and studio stories.</p>
            <Link href="/products" className="mt-5 inline-block border-b border-luxury-gold pb-1 text-xs uppercase tracking-[0.14em] text-luxury-ivory transition-colors hover:text-luxury-gold">
              Explore the collection
            </Link>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs tracking-wide text-luxury-ivory/55 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} LuxeCraft. Crafted with care.</span>
          <span>Quiet luxury · Indian craftsmanship · Worldwide</span>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h2 className="text-xs uppercase tracking-[0.16em] text-luxury-gold">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm text-luxury-ivory/70">
        {links.map((link) => <li key={link}>{link}</li>)}
      </ul>
    </div>
  );
}
