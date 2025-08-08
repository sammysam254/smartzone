import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useOptimizedProducts } from '@/hooks/useOptimizedProducts';
import FastProductGrid from '@/components/FastProductGrid';
import ProductModal from '@/components/ProductModal';
import SEOBreadcrumbs from '@/components/SEOBreadcrumbs';
import { Button } from "@/components/ui/button";

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

const CATEGORIES = [
  { value: 'all', label: 'All Products' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'books', label: 'Books' },
  { value: 'sports', label: 'Sports' },
  { value: 'computers', label: 'Computers' },
  { value: 'printers', label: 'Printers' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { products, loading, hasMore, fetchMore } = useOptimizedProducts({
    category: selectedCategory,
    sortBy,
    initialLimit: 12,
    fetchLimit: 8
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Products - SmartHub Computers | Computer Store in Kenya</title>
        <meta name="description" content="Shop computers, laptops, printers and tech accessories at SmartHub Computers. Fast delivery across Kenya." />
        <meta name="keywords" content="computers Kenya, laptops, printers, tech accessories, SmartHub" />
        <link rel="canonical" href="https://smarthubcomputers.com/products" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <SEOBreadcrumbs />
          
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Products</h1>
                <p className="text-muted-foreground mt-2">
                  Discover our amazing collection of products ({products.length} items)
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-6">
              <FastProductGrid 
                products={products} 
                loading={loading} 
                priority={true}
              />
              
              {hasMore && !loading && (
                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={fetchMore}
                    variant="outline"
                    size="lg"
                    className="min-w-[200px]"
                  >
                    Load More Products
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
        
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </div>
    </>
  );
}