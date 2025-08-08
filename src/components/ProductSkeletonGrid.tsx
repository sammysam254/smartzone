import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ProductSkeletonGridProps {
  count?: number;
}

const ProductSkeletonGrid = memo(({ count = 8 }: ProductSkeletonGridProps) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {[...Array(count)].map((_, i) => (
      <Card key={i} className="overflow-hidden animate-pulse">
        <CardContent className="p-0">
          <div className="aspect-square bg-gradient-to-br from-muted/20 to-muted/30 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
          <div className="p-3 space-y-2">
            <div className="h-4 bg-muted/30 rounded animate-pulse" />
            <div className="h-3 bg-muted/20 rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-muted/20 rounded w-1/2 animate-pulse" />
            <div className="h-8 bg-muted/30 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
));

ProductSkeletonGrid.displayName = 'ProductSkeletonGrid';

export default ProductSkeletonGrid;