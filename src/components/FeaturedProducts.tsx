import { memo } from 'react';
import { useOptimizedProducts } from '@/hooks/useOptimizedProducts';
import FastProductGrid from './FastProductGrid';

const FeaturedProducts = memo(() => {
  const { products, loading } = useOptimizedProducts({
    category: 'all',
    sortBy: 'newest',
    initialLimit: 4
  });

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <p className="text-muted-foreground mt-2">
              Discover our handpicked selection of top products
            </p>
          </div>
        </div>

        <FastProductGrid 
          products={products.slice(0, 4)} 
          loading={loading} 
          priority={true}
        />
      </div>
    </section>
  );
});

FeaturedProducts.displayName = 'FeaturedProducts';

export default FeaturedProducts;