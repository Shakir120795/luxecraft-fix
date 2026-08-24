import Link from 'next/link';
import { Category } from '@/lib/api';

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/categories/${category.slug}`}>
      <div className="group cursor-pointer">
        <div className="relative mb-4 aspect-square overflow-hidden border border-luxury-sand bg-luxury-beige">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-luxury-beige to-luxury-gold/20 flex items-center justify-center">
              <span className="text-luxury-charcoal text-base font-serif text-center px-6">
                {category.name}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-luxury-night/0 transition-colors duration-300 group-hover:bg-luxury-night/10" />
        </div>
        <h3 className="font-serif text-lg text-luxury-charcoal group-hover:text-luxury-brown transition-colors">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-sm text-luxury-brown/70 mt-2 line-clamp-1">{category.description}</p>
        )}
      </div>
    </Link>
  );
}
