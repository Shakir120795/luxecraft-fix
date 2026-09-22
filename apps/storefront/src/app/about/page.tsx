import Link from 'next/link';

const sections = [
  {
    title: 'Why Buyers & Interior Designers Worldwide Choose Us',
    items: [
      ['Master Craftsmanship', 'Every rug we produce is a work of art. From intricate Tibetan hand-knotted patterns to luxurious hand-tufted textures, our master weavers pour exceptional skill, precision, and dedication into every piece.'],
      ['Direct Factory-to-Doorstep Model', 'Based in our manufacturing facility at Devpurwa Road, Mirzapur, Uttar Pradesh (India), we manage the entire production process in-house—from raw material selection to weaving, washing, and final quality inspection. Delivering directly from our factory to your door eliminates unnecessary middlemen and guarantees true factory-direct pricing.'],
      ['Custom & Bespoke Rugs', 'Because we own and operate our manufacturing factory, we offer full customization for trade professionals, architects, interior designers, and individual buyers worldwide. Whether you require a unique size, specific color palette, or custom design, we build your rug exactly to your specifications.'],
      ['Global Door-to-Door Delivery', 'We cater to rug lovers across the globe, providing reliable, fully tracked door-to-door shipping straight from our looms in India to your address, anywhere in the world.'],
    ],
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#40372f] via-[#51463c] to-[#29241f] py-20 text-white md:py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 text-center sm:px-8 lg:px-10">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4a556]">
            About Us
          </p>
          <h1 className="font-serif text-5xl font-light tracking-tight sm:text-6xl md:text-7xl">
            Crafting Timeless Heritage
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-luxury-cream/90 sm:text-xl md:text-2xl">
            Delivered Straight from Our Loom to Your Home.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-20 lg:px-10">
        <div className="prose prose-lg max-w-none">
          <h2 className="mb-6 font-serif text-4xl font-light text-luxury-charcoal">
            Welcome to WOLHOMES
          </h2>
          <p className="text-lg leading-relaxed text-luxury-brown">
            We are master rug makers and artisans dedicated to the timeless art of handcrafted floor coverings.
          </p>
          <p className="text-lg leading-relaxed text-luxury-brown">
            Our journey began in 1990 as a family tradition deeply rooted in perfecting ancient weaving techniques—specifically Tibetan Hand-Knotted and premium Hand-Tufted rug-making. Over the decades, our skilled artisans passed down these traditional skills from generation to generation. Building upon this 35+ years of heritage, our firm was formally registered in 2017 as a modern manufacturing unit, allowing us to serve global clients with structured quality standards.
          </p>
        </div>
      </section>

      <section className="bg-[#eee7df] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <h2 className="mb-12 text-center font-serif text-4xl font-light text-luxury-charcoal">
            {sections[0].title}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {sections[0].items.map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-[#ddd2c5] bg-white p-7 shadow-sm">
                <h3 className="mb-4 font-serif text-2xl text-luxury-charcoal">{title}</h3>
                <p className="leading-relaxed text-luxury-brown">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-20 lg:px-10">
        <div className="rounded-2xl border border-[#ddd2c5] bg-white p-8 shadow-sm md:p-10">
          <h2 className="mb-5 font-serif text-4xl font-light text-luxury-charcoal">
            Our Promise
          </h2>
          <p className="text-lg leading-relaxed text-luxury-brown">
            Whether you are seeking a statement Tibetan hand-knotted heirloom or a bespoke hand-tufted rug crafted for your space, WOLHOMES promises uncompromised quality, authentic craftsmanship, and a seamless shopping experience from our factory to your home.
          </p>
          <div className="mt-8 border-t border-[#eee9e3] pt-6 text-sm leading-7 text-luxury-brown">
            <strong className="text-luxury-charcoal">Factory Address:</strong> Devpurwa Road, Mirzapur, Uttar Pradesh, India
            <br />
            <strong className="text-luxury-charcoal">Customer Care:</strong>{' '}
            <a href="mailto:info@wolhomes.com" className="text-luxury-gold underline hover:text-luxury-brown">
              info@wolhomes.com
            </a>
          </div>
        </div>
      </section>

      <section className="bg-luxury-night py-20 text-white">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8 lg:px-10">
          <h2 className="mb-6 font-serif text-4xl font-light">Explore WOLHOMES</h2>
          <p className="mb-8 text-lg leading-relaxed text-luxury-cream/90">
            Discover our handcrafted rug collection or talk to us about a custom rug made to your specifications.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/products" className="btn-luxury px-10 py-4">
              Browse Collection
            </Link>
            <Link href="/custom-design" className="btn-luxury-outline px-10 py-4">
              Request Custom Design
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
