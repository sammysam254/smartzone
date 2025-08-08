import React from 'react';
import { cn } from '@/lib/utils';

interface CircularLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const CircularLoader = React.memo(({ 
  size = 'md', 
  className,
  text = "Loading products..." 
}: CircularLoaderProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="relative">
        {/* Outer ring */}
        <div className={cn(
          "animate-spin rounded-full border-4 border-muted/20 border-t-primary",
          sizeClasses[size]
        )} />
        
        {/* Inner ring for enhanced effect */}
        <div className={cn(
          "absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-primary/60",
          "animate-[spin_1.5s_linear_infinite_reverse]"
        )} />
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
      
      {text && (
        <p className={cn(
          "text-muted-foreground font-medium animate-pulse",
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
});

CircularLoader.displayName = 'CircularLoader';

export default CircularLoader;