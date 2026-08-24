import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}

export function EmptyState({
  icon = '📦',
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-20 border border-luxury-sand bg-luxury-beige px-6">
      {/* Icon */}
      <div className="mb-6">
        <span className="text-7xl">{icon}</span>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-4">
        {title}
      </h2>

      {/* Description */}
      <p className="text-luxury-brown mb-8 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {actionLabel && actionHref && (
            <Link href={actionHref} className="btn-luxury px-8 py-3 inline-block">
              {actionLabel}
            </Link>
          )}
          {secondaryActionLabel && secondaryActionHref && (
            <Link href={secondaryActionHref} className="btn-luxury-outline px-8 py-3 inline-block">
              {secondaryActionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
