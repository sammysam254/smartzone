
import { memo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import FastProductGrid from './FastProductGrid';

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

const FeaturedProducts = memo(() => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false); // Start as false for instant display

  // Lightning-fast image processing
  const processImageUrl = (imageUrls: string | string[] | null): string => {
    if (!imageUrls) return '';
    if (Array.isArray(imageUrls)) return imageUrls[0] || '';
    
    try {
      const raw = imageUrls.trim();
      return raw.startsWith('[') ? JSON.parse(raw)[0] || raw : raw;
    } catch {
      return typeof imageUrls === 'string' ? imageUrls : '';
    }
  };

  // Instant product loading - no delays
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, price, original_price, category, rating, reviews_count, badge, badge_color, in_stock, image_urls')
          .eq('in_stock', true)
          .is('deleted_at', null)
          .not('image_urls', 'is', null)
          .order('created_at', { ascending: false })
          .limit(4);

        const transformedProducts = (data || []).map(product => ({
          ...product,
          image_url: processImageUrl(product.image_urls),
          images: [processImageUrl(product.image_urls)].filter(Boolean),
          category: product.category || 'general',
          rating: product.rating || 0,
          reviews_count: product.reviews_count || 0
        })).filter(p => p.image_url);

        setProducts(transformedProducts);
      } catch (error) {
        console.error('Featured products error:', error);
        setProducts([]);
      }
    };

    loadProducts();
  }, []);

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
          products={products} 
          loading={loading} 
          priority={true}
        />
      </div>
    </section>
  );
});

FeaturedProducts.displayName = 'FeaturedProducts';

export default FeaturedProducts;
