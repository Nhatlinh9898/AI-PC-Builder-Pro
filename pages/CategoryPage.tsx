import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCategoryProducts } from '../services/geminiService';
import { MarketplaceProduct, SearchFilters } from '../types';
import MarketplaceCard from '../components/MarketplaceCard';
import MarketplaceDetailModal from '../components/MarketplaceDetailModal';
import AdvancedFilterSidebar from '../components/AdvancedFilterSidebar';
import { Filter, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    priceMin: '',
    priceMax: '',
    brands: [],
    rating: '',
    inStock: false,
    category: category || ''
  });

  useEffect(() => {
    // Reset and fetch when category changes
    setFilters(prev => ({ ...prev, category: category || '' }));
    fetchProducts();
  }, [category]);

  const fetchProducts = async (activeFilters?: SearchFilters) => {
    if (!category) return;
    setLoading(true);
    setProducts([]);
    try {
      const result = await getCategoryProducts(category, 1, activeFilters || filters);
      if (result && result.category_page) {
        setProducts(result.category_page.products);
      }
    } catch (error) {
      console.error("Failed to load category", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    fetchProducts(newFilters);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
         <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
             <Link to="/marketplace" className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <ArrowLeft size={20} />
             </Link>
             <h1 className="text-xl font-bold capitalize">{category?.replace('-', ' ')} Store</h1>
             <div className="ml-auto md:hidden">
                 <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                 >
                    <Filter size={20} />
                 </button>
             </div>
         </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full relative">
          
          <AdvancedFilterSidebar 
             isOpen={showFilters} 
             onClose={() => setShowFilters(false)} 
             filters={filters}
             onFilterChange={handleFilterChange}
          />

          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
              {loading ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                       {[...Array(8)].map((_, i) => (
                           <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 h-96 animate-pulse border border-slate-200 dark:border-slate-700">
                               <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
                               <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                               <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                               <div className="mt-auto h-8 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                           </div>
                       ))}
                   </div>
              ) : products.length > 0 ? (
                  <div>
                      <div className="mb-4 text-sm text-slate-500">
                          Showing top results for <span className="font-bold text-slate-900 dark:text-white capitalize">{category}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
                          {products.map((product, idx) => (
                              <MarketplaceCard 
                                 key={idx} 
                                 product={product} 
                                 onViewDetails={setSelectedProduct} 
                              />
                          ))}
                      </div>
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <AlertCircle size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-medium">No products found in this category.</p>
                      <Button variant="ghost" onClick={() => fetchProducts({ ...filters, priceMin: '', priceMax: '', brands: [] })}>
                          Reset Filters
                      </Button>
                  </div>
              )}
          </main>
      </div>

      <MarketplaceDetailModal 
         product={selectedProduct} 
         onClose={() => setSelectedProduct(null)} 
      />
    </div>
  );
};

export default CategoryPage;