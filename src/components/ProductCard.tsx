import React, { memo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ShoppingCart } from 'lucide-react';

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

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

const ProductCard = memo(({ product, onAddToCart, onProductClick }: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Early return for invalid products
  if (!product.image_url && (!product.images || product.images.length === 0)) {
    return null;
  }

  // Get image directly
  const displayImage = product.image_url || product.images?.[0] || '';
  
  if (!displayImage) return null;

  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100) 
    : 0;

  return (
    <Card className="hover:shadow-card transition-all duration-200 hover:-translate-y-1 h-full">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted/20 animate-pulse flex items-center justify-center">
              <div className="text-muted-foreground text-xs">Loading...</div>
            </div>
          )}
          <img
            src={displayImage}
            alt={product.name}
            className={`w-full h-full object-contain transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Image indicators */}
          {product.images?.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
              {product.images.slice(0, 5).map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                    index === 0 ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 right-2 flex justify-between">
            {product.badge && (
              <Badge className={`text-xs md:text-sm ${product.badge_color || 'bg-primary'} text-white`}>
                {product.badge}
              </Badge>
            )}

            {hasDiscount && (
              <Badge className="bg-red-500 text-white text-xs">
                -{discountPercent}%
              </Badge>
            )}
          </div>
          
          {!product.in_stock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2 md:p-4 space-y-2 md:space-y-3 flex-1 flex flex-col">
          <h3 
            className="font-semibold text-sm md:text-lg line-clamp-2 cursor-pointer hover:text-primary transition-colors flex-1"
            onClick={() => onProductClick(product)}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 md:h-4 md:w-4 ${
                    i < Math.floor(product.rating) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs md:text-sm text-muted-foreground">
              ({product.reviews_count || 0})
            </span>
          </div>

          {/* Price */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
            <span className="text-base md:text-2xl font-bold text-primary">
              KES {product.price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs md:text-sm text-muted-foreground line-through">
                KES {product.original_price!.toLocaleString()}
              </span>
            )}
          </div>

          <Button
            variant="cart"
            size="sm"
            className="w-full text-xs md:text-sm mt-auto"
            onClick={() => onAddToCart(product)}
            disabled={!product.in_stock}
          >
            <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;