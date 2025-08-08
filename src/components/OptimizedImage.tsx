import React, { memo, useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = '', 
  width, 
  height, 
  loading = 'eager',
  priority = false 
}: OptimizedImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  if (!src || imageError) {
    return (
      <div 
        className={`${className} bg-muted/20 flex items-center justify-center animate-pulse`}
        style={{ width, height }}
      >
        <div className="text-muted-foreground text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}
      style={{ width, height }}
      loading="eager"
      decoding="async"
      fetchPriority="high"
      onLoad={() => setImageLoaded(true)}
      onError={() => setImageError(true)}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;