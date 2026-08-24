interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  size = 'md', 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const spinner = (
    <div className="text-center">
      {/* Spinner */}
      <div className={`relative ${sizeClasses[size]} mx-auto ${text ? 'mb-4' : ''}`}>
        <div className="absolute inset-0 border-4 border-luxury-sand rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-luxury-gold rounded-full animate-spin"></div>
      </div>

      {/* Optional Text */}
      {text && (
        <p className="text-luxury-brown font-serif">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-luxury-cream/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
