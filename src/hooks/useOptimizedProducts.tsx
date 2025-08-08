import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  description: string | null;
}

interface UseOptimizedProductsProps {
  category: string;
  sortBy: string;
  initialLimit?: number;
  fetchLimit?: number;
}

// Lightweight cache for metadata only
const productMetaCache = new Map<string, { 
  data: Omit<Product, 'images' | 'image_url'>[]; 
  timestamp: number;
}>();

// Separate image cache
const imageCache = new Map<string, string>();

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const useOptimizedProducts = ({ 
  category, 
  sortBy, 
  initialLimit = 8, 
  fetchLimit = 16 
}: UseOptimizedProductsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Generate cache key
  const cacheKey = useMemo(() => `products-${category}-${sortBy}`, [category, sortBy]);

  // Fast image processing - no blob conversion
  const processImageUrl = useCallback((imageUrls: string | string[] | null): string => {
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
  }, []);

  // Optimized query - fetch minimal data first
  const buildOptimizedQuery = useCallback((offset: number, limit: number) => {
    let query = supabase
      .from('products')
      .select('id, name, price, original_price, category, rating, reviews_count, badge, badge_color, in_stock, image_urls')
      .eq('in_stock', true)
      .is('deleted_at', null)
      .range(offset, offset + limit - 1);

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    switch (sortBy) {
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false })
                    .order('reviews_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    return query;
  }, [category, sortBy]);

  // Ultra-fast fetch with immediate rendering
  const fetchProducts = useCallback(async (loadMore = false) => {
    // Check cache first for instant loading
    const cached = productMetaCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION && !loadMore) {
      const cachedProducts = cached.data.map(product => ({
        ...product,
        image_url: processImageUrl((product as any).image_urls),
        images: [(product as any).image_urls].filter(Boolean).slice(0, 1)
      })) as Product[];
      
      setProducts(cachedProducts.slice(0, initialLimit));
      setLoading(false);
      setHasMore(cachedProducts.length >= initialLimit);
      return;
    }

    try {
      const offset = loadMore ? products.length : 0;
      const limit = loadMore ? fetchLimit : initialLimit;
      
      const query = buildOptimizedQuery(offset, limit);
      const { data, error } = await query;

      if (error) throw error;

      // Transform products immediately
      const transformedProducts = (data || []).map(product => {
        const imageUrl = processImageUrl(product.image_urls);
        
        return {
          ...product,
          description: null,
          category: product.category || 'general',
          image_url: imageUrl,
          images: [imageUrl].filter(Boolean)
        };
      }).filter(p => p.image_url);

      if (loadMore) {
        setProducts(prev => [...prev, ...transformedProducts]);
      } else {
        setProducts(transformedProducts);
        // Cache metadata only
        productMetaCache.set(cacheKey, {
          data: transformedProducts.map(({ images, image_url, ...rest }) => rest),
          timestamp: Date.now()
        });
      }

      setHasMore(transformedProducts.length === limit);
    } catch (error) {
      console.error('Fetch error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [products.length, buildOptimizedQuery, processImageUrl, cacheKey, initialLimit, fetchLimit]);

  // Immediate load
  useEffect(() => {
    setLoading(true);
    fetchProducts(false);
  }, [category, sortBy]);

  return {
    products,
    loading,
    hasMore,
    fetchMore: () => fetchProducts(true)
  };
};