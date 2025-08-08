import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

interface UseProductsQueryProps {
  category: string;
  sortBy: string;
  initialLimit?: number;
  fetchLimit?: number;
}

// Enhanced cache with memory management
const productCache = new Map<string, { 
  data: Product[]; 
  timestamp: number;
  count: number; // Track how many times this cache is used
}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
// Use parameters from props with fallbacks
const LOCAL_CACHE_PREFIX = 'products_cache_v2:';

// Image optimization constants
const MAX_IMAGES = 2; // Only keep 2 images per product
const IMAGE_QUALITY = 'low'; // Can be 'low' | 'medium' | 'high'

export const useProductsQuery = ({ category, sortBy, initialLimit = 8, fetchLimit = 16 }: UseProductsQueryProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController>();

  // Load real products immediately without any delays
  const [initialLoad, setInitialLoad] = useState(false);

  // Generate cache key with versioning
  const cacheKey = useMemo(() => `${LOCAL_CACHE_PREFIX}${category}-${sortBy}`, [category, sortBy]);

  // Memory-optimized cache hydration
  const hydrateFromCache = useCallback(() => {
    // First try memory cache
    const cached = productCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProducts(cached.data.slice(0, initialLimit)); // Only show initial set
      setLoading(false);
      setHasMore(cached.data.length > initialLimit);
      
      // Update cache usage count
      productCache.set(cacheKey, {
        ...cached,
        count: (cached.count || 0) + 1
      });
      
      return true;
    }

    // Fallback to localStorage
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: Product[]; timestamp: number };
        if (Date.now() - parsed.timestamp < CACHE_DURATION && parsed.data?.length) {
          // Store in memory cache for faster access
          productCache.set(cacheKey, {
            data: parsed.data,
            timestamp: parsed.timestamp,
            count: 1
          });
          
          setProducts(parsed.data.slice(0, initialLimit));
          setLoading(false);
          setHasMore(parsed.data.length > initialLimit);
          return true;
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    
    return false;
  }, [cacheKey]);

  // Ultra-fast image processing - direct array handling
  const processImages = useCallback((imageUrls: string | string[] | null): string[] => {
    if (!imageUrls) return [];
    if (Array.isArray(imageUrls)) return imageUrls.slice(0, 2);
    
    try {
      const raw = imageUrls.trim();
      if (raw.startsWith('[')) {
        return JSON.parse(raw).slice(0, 2);
      }
      return [raw];
    } catch {
      return [imageUrls];
    }
  }, []);

  // Remove image optimization - direct usage for speed
  // const optimizeImageUrl = (url: string): string => {
  //   return url; // Return as-is for maximum speed
  // };

  // Query builder with index hints
  const buildQuery = useCallback((offset: number, limit: number) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    // Select only needed fields
    let query = supabase
      .from('products')
      .select('id, name, price, original_price, image_urls, rating, reviews_count, badge, badge_color, in_stock')
      .eq('in_stock', true)
      .is('deleted_at', null)
      .not('image_urls', 'is', null)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    // Optimized sorting
    switch (sortBy) {
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false, nullsFirst: false })
                    .order('reviews_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    return query;
  }, [category, sortBy]);

  // Instant fetch function - no delays
  const fetchProducts = useCallback(async (loadMore = false, silent = false) => {
    if (loading && loadMore) return;

    const reqId = ++requestIdRef.current;
    const offset = loadMore ? products.length : 0;
    const limit = loadMore ? fetchLimit : initialLimit;

    if (!loadMore && !silent) {
      setLoading(true);
    }

    try {
      const query = buildQuery(offset, limit);
      const { data, error } = await query;

      // Ignore stale responses
      if (reqId !== requestIdRef.current) return;

      if (error) throw error;

      // Instant product transformation
      const transformProduct = (product: any): Product => {
        const transformedImages = processImages(product.image_urls);
        
        return {
          ...product,
          description: null,
          category: product.category || 'general',
          images: transformedImages,
          image_url: transformedImages[0] || ''
        };
      };

      const transformedProducts = (data || [])
        .map(transformProduct)
        .filter(p => p.images.length > 0);

      if (loadMore) {
        // Add to existing products for load more
        setProducts(prev => [...prev, ...transformedProducts]);
        setHasMore(transformedProducts.length === limit);
      } else {
        // Set real database products with fast rendering
        setProducts(transformedProducts);
        setHasMore(transformedProducts.length >= limit);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
        if (!loadMore && !silent) {
          console.log('📝 Error loading products, showing empty state');
          setProducts([]);
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [products, loading, buildQuery, processImages, initialLimit, fetchLimit]);

  // Instant load - no delays or logging
  useEffect(() => {
    fetchProducts(false, false);

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [category, sortBy]);

  // Cache cleanup on unmount
  useEffect(() => {
    return () => {
      // Prune least used cache entries
      if (productCache.size > 10) {
        const entries = Array.from(productCache.entries());
        entries.sort((a, b) => (a[1].count || 0) - (b[1].count || 0));
        for (let i = 0; i < Math.floor(entries.length / 2); i++) {
          productCache.delete(entries[i][0]);
        }
      }
    };
  }, []);

  return {
    products,
    loading,
    hasMore,
    fetchMore: () => fetchProducts(true)
  };
};
