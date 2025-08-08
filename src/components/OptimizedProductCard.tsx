import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ShoppingCart } from 'lucide-react';
import FastImage from './FastImage';

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

interface OptimizedProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  priority?: boolean;
}

const OptimizedProductCard = memo(({ 
  product, 
  onAddToCart, 
  onProductClick, 
  priority = false 
}: OptimizedProductCardProps) => {
  
  if (!product.image_url) return null;

  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100) 
    : 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-150 hover:-translate-y-0.5 h-full group">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <FastImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-150"
            priority={priority}
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 right-2 flex justify-between">
            {product.badge && (
              <Badge className={`text-xs ${product.badge_color || 'bg-primary'} text-white`}>
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
        <div className="p-3 space-y-2 flex-1 flex flex-col">
          <h3 
            className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors flex-1"
            onClick={() => onProductClick(product)}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviews_count || 0})
            </span>
          </div>

          {/* Price */}
          <div className="flex flex-col space-y-1">
            <span className="text-lg font-bold text-primary">
              KES {product.price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                KES {product.original_price!.toLocaleString()}
              </span>
            )}
          </div>

          <Button
            variant="default"
            size="sm"
            className="w-full text-xs mt-auto"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={!product.in_stock}
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedProductCard.displayName = 'OptimizedProductCard';

export default OptimizedProductCard;