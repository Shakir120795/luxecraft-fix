import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-luxury-night via-[#4A3F35] to-luxury-night text-white py-24">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-7xl font-serif font-light tracking-tight mb-6">
            About LuxeCraft
          </h1>
          <p className="text-xl md:text-2xl text-luxury-cream/90 leading-relaxed max-w-3xl mx-auto">
            Where timeless craftsmanship meets contemporary elegance
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-4xl font-serif font-light text-luxury-charcoal mb-8">Our Story</h2>
          
          <p className="text-luxury-brown text-lg leading-relaxed mb-6">
            Founded in 2020, LuxeCraft began with a simple vision: to create furniture that tells a story. 
            Each piece we craft is more than just an object—it's a testament to the enduring beauty of 
            artisanal excellence and thoughtful design.
          </p>

          <p className="text-luxury-brown text-lg leading-relaxed mb-6">
            Our journey started in a small workshop, where our founders combined their passion for 
            traditional woodworking with innovative design principles. Today, we've grown into a 
            trusted name in luxury furniture, but our commitment to quality and craftsmanship remains 
            unchanged.
          </p>

          <p className="text-luxury-brown text-lg leading-relaxed">
            Every item in our collection is meticulously crafted by skilled artisans who pour their 
            expertise and dedication into each detail. We source the finest materials from sustainable 
            suppliers, ensuring that beauty and responsibility go hand in hand.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-luxury-beige py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-light text-luxury-charcoal text-center mb-16">
            Our Values
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="border border-luxury-sand bg-luxury-cream p-8">
              <h3 className="text-2xl font-serif text-luxury-charcoal mb-4">Craftsmanship</h3>
              <p className="text-luxury-brown leading-relaxed">
                Every piece is handcrafted by master artisans who have honed their skills over decades. 
                We believe in the power of human touch and the beauty of imperfection.
              </p>
            </div>

            <div className="border border-luxury-sand bg-luxury-cream p-8">
              <h3 className="text-2xl font-serif text-luxury-charcoal mb-4">Sustainability</h3>
              <p className="text-luxury-brown leading-relaxed">
                We're committed to environmental responsibility, using sustainably sourced materials 
                and eco-friendly processes that minimize our impact on the planet.
              </p>
            </div>

            <div className="border border-luxury-sand bg-luxury-cream p-8">
              <h3 className="text-2xl font-serif text-luxury-charcoal mb-4">Timelessness</h3>
              <p className="text-luxury-brown leading-relaxed">
                Our designs transcend trends. We create furniture meant to be cherished for generations, 
                becoming more beautiful with age and use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-serif font-light text-luxury-charcoal mb-12 text-center">
          Our Process
        </h2>

        <div className="space-y-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="md:w-1/4">
              <div className="text-5xl font-serif text-luxury-gold">01</div>
            </div>
            <div className="md:w-3/4">
              <h3 className="text-2xl font-serif text-luxury-charcoal mb-3">Design</h3>
              <p className="text-luxury-brown leading-relaxed">
                Our design team carefully sketches and refines each concept, balancing aesthetic 
                appeal with functional excellence. Every curve, every joint is intentional.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="md:w-1/4">
              <div className="text-5xl font-serif text-luxury-gold">02</div>
            </div>
            <div className="md:w-3/4">
              <h3 className="text-2xl font-serif text-luxury-charcoal mb-3">Material Selection</h3>
              <p className="text-luxury-brown leading-relaxed">
                We source only the finest hardwoods, metals, and fabrics from trusted suppliers 
                who share our commitment to quality and sustainability.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="md:w-1/4">
              <div className="text-5xl font-serif text-luxury-gold">03</div>
            </div>
            <div className="md:w-3/4">
              <h3 className="text-2xl font-serif text-luxury-charcoal mb-3">Crafting</h3>
              <p className="text-luxury-brown leading-relaxed">
                Master craftspeople bring the design to life through traditional techniques 
                refined over generations, combined with modern precision tools.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="md:w-1/4">
              <div className="text-5xl font-serif text-luxury-gold">04</div>
            </div>
            <div className="md:w-3/4">
              <h3 className="text-2xl font-serif text-luxury-charcoal mb-3">Quality Control</h3>
              <p className="text-luxury-brown leading-relaxed">
                Each piece undergoes rigorous inspection to ensure it meets our exacting standards 
                before it's carefully packaged and delivered to your home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-luxury-night text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-serif font-light mb-6">
            Experience LuxeCraft
          </h2>
          <p className="text-xl text-luxury-cream/90 mb-10 leading-relaxed">
            Discover our curated collection of handcrafted furniture, or let us create 
            something uniquely yours through our custom design service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products" className="btn-luxury px-10 py-4 inline-block">
              Browse Collection
            </Link>
            <Link href="/custom-design" className="btn-luxury-outline px-10 py-4 inline-block border-white text-white hover:bg-white hover:text-luxury-night">
              Request Custom Design
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
