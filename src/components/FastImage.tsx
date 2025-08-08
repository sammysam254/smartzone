import React, { memo, useState, useRef, useEffect } from 'react';

interface FastImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: string;
}

const FastImage = memo(({ 
  src, 
  alt, 
  className = '', 
  width, 
  height, 
  priority = false,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+'
}: FastImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Preload critical images
  useEffect(() => {
    if (priority && src) {
      const img = new Image();
      img.onload = () => setLoaded(true);
      img.onerror = () => setError(true);
      img.src = src;
    }
  }, [src, priority]);

  if (!src || error) {
    return (
      <div 
        className={`${className} bg-muted/10 flex items-center justify-center`}
        style={{ width, height }}
      >
        <div className="text-muted-foreground text-xs">Image unavailable</div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {/* Placeholder */}
      {!loaded && (
        <img
          src={placeholder}
          alt=""
          className={`${className} absolute inset-0`}
          style={{ width, height }}
        />
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
        style={{ width, height }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
});

FastImage.displayName = 'FastImage';

export default FastImage;