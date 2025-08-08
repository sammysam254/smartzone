import React, { memo } from 'react';
import OptimizedProductCard from './OptimizedProductCard';
import CircularLoader from './CircularLoader';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string;
  images: string[];
  category: string;
  rating: number;
  reviews_count: number;
  badge: string | null;
  badge_color: string | null;
  in_stock: boolean;
}

interface FastProductGridProps {
  products: Product[];
  loading?: boolean;
  priority?: boolean;
}

const LoadingSkeleton = memo(() => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-card rounded-lg overflow-hidden animate-pulse">
        <div className="aspect-square bg-muted/20" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-muted/20 rounded" />
          <div className="h-3 bg-muted/20 rounded w-2/3" />
          <div className="h-4 bg-muted/20 rounded w-1/2" />
          <div className="h-8 bg-muted/20 rounded" />
        </div>
      </div>
    ))}
  </div>
));

const FastProductGrid = memo(({ products, loading = false, priority = false }: FastProductGridProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url
    });
  };

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <CircularLoader size="lg" text="Loading amazing products..." />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product, index) => (
        <OptimizedProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
          priority={priority && index < 4} // Prioritize first 4 images
        />
      ))}
    </div>
  );
});

FastProductGrid.displayName = 'FastProductGrid';

export default FastProductGrid;