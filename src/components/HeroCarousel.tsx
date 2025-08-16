import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';

const HeroCarousel = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState([]);

  type HeroSlide = {
    id: string;
    category: string;
    brand: string;
    image: string;
    title: string;
    description: string;
    productId: string;
  };

  // Instant fallback slides
  const fallbackSlides: HeroSlide[] = [
    {
      id: 'fallback-1',
      category: 'Computers',
      brand: 'SmartHub',
      image: '/src/assets/hero-computers.jpg',
      title: 'Premium Computers & Laptops',
      description: 'Starting from KES 25,000',
      productId: 'fallback-1'
    },
    {
      id: 'fallback-2',
      category: 'Electronics',
      brand: 'SmartHub',
      image: '/src/assets/hero-computers.jpg',
      title: 'Latest Electronics & Accessories',
      description: 'Starting from KES 5,000',
      productId: 'fallback-2'
    }
  ];

  // Ultra-fast product loading with immediate display
  useEffect(() => {
    // Show fallback immediately
    setHeroSlides(fallbackSlides);
    
    // Load real products in background - no await, no loading states
    const loadProducts = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, price, category, image_urls')
          .eq('in_stock', true)
          .is('deleted_at', null)
          .not('image_urls', 'is', null)
          .order('created_at', { ascending: false })
          .limit(4);

        if (data?.length) {
          const productSlides = data.map(p => {
            let imageUrl = '';
            try {
              if (Array.isArray(p.image_urls)) {
                imageUrl = p.image_urls[0] || '';
              } else if (typeof p.image_urls === 'string') {
                const raw = p.image_urls.trim();
                imageUrl = raw.startsWith('[') ? JSON.parse(raw)[0] || raw : raw;
              }
            } catch {
              imageUrl = typeof p.image_urls === 'string' ? p.image_urls : '';
            }

            return {
              id: p.id,
              category: p.category || 'Product',
              brand: p.category || 'SmartHub',
              image: imageUrl,
              title: p.name,
              description: `From KES ${Number(p.price || 0).toLocaleString()}`,
              productId: p.id
            };
          }).filter(slide => slide.image);

          // Update with real products only if we got valid data
          if (productSlides.length > 0) {
            setHeroSlides([fallbackSlides[0], ...productSlides]);
          }
        }
      } catch (error) {
        console.error('Hero load error:', error);
        // Keep fallback slides on error
      }
    };

    loadProducts();
  }, []);

  // Auto-slide
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const nextSlide = () => {
    if (heroSlides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    if (heroSlides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <section className="relative bg-gradient-to-br from-background via-secondary/20 to-accent/10 py-8 md:py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative">
          <div className="relative h-[500px] md:h-[600px] rounded-2xl overflow-hidden shadow-card bg-gradient-to-br from-background to-secondary/20">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Mobile Layout */}
                <div className="flex flex-col lg:hidden h-full">
                  <div className="relative h-[300px] w-full bg-white rounded-lg">
                    <img 
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent rounded-lg"></div>
                  </div>
                  
                  <div className="flex-1 space-y-4 px-6 py-6 bg-background rounded-b-lg">
                    <div className="space-y-3">
                      <div className="text-xs text-primary font-semibold uppercase tracking-wider">
                        {slide.brand}
                      </div>
                      <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight line-clamp-2">
                        {slide.title}
                      </h1>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {slide.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="hero" 
                        size="sm" 
                        className="group w-full"
                        onClick={() => navigate('/products')}
                      >
                        Shop Now
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => navigate('/products')}
                      >
                        View Catalog
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-2 gap-8 items-center h-full">
                  <div className="space-y-6 px-6 md:px-12 py-8">
                    <div className="space-y-4">
                      <div className="text-sm text-primary font-semibold uppercase tracking-wider">
                        {slide.brand}
                      </div>
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight line-clamp-3">
                        {slide.title}
                      </h1>
                      <p className="text-lg md:text-xl text-muted-foreground max-w-lg line-clamp-2">
                        {slide.description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        variant="hero" 
                        size="lg" 
                        className="group"
                        onClick={() => navigate('/products')}
                      >
                        Shop Now
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => navigate('/products')}
                      >
                        View Catalog
                      </Button>
                    </div>
                  </div>

                  <div className="relative h-full min-h-[400px] bg-white rounded-lg p-4">
                    <img 
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          {heroSlides.length > 1 && (
            <>
              <button 
                onClick={prevSlide}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 md:p-3 rounded-full shadow-md z-10 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 md:p-3 rounded-full shadow-md z-10 transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4 md:h-6 md:w-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
