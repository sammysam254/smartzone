
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
  const [loading, setLoading] = useState(true);

  // Process image URLs instantly
  const processImageUrl = (imageUrls: string | string[] | null): string => {
    if (!imageUrls) return '';
    
    try {
      if (Array.isArray(imageUrls)) {
        return imageUrls[0] || '';
      }
      
      const raw = imageUrls.trim();
      if (raw.startsWith('[')) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed[0] || '' : raw;
      }
      
      return raw;
    } catch {
      return typeof imageUrls === 'string' ? imageUrls : '';
    }
  };

  // Instant product loading
  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, original_price, category, rating, reviews_count, badge, badge_color, in_stock, image_urls')
          .eq('in_stock', true)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) throw error;

        const transformedProducts = (data || []).map(product => {
          const imageUrl = processImageUrl(product.image_urls);
          
          return {
            ...product,
            image_url: imageUrl,
            images: [imageUrl].filter(Boolean),
            category: product.category || 'general',
            rating: product.rating || 0,
            reviews_count: product.reviews_count || 0
          };
        }).filter(p => p.image_url);

        setProducts(transformedProducts);
      } catch (error) {
        console.error('Featured products load error:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProducts();
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
