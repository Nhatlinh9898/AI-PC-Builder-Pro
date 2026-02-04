import React, { useState } from 'react';
import { Search, ShoppingBag, Loader2, Globe, Filter, Cpu, Layers, HardDrive, Zap, Box, Server, Monitor, Keyboard, Mouse, Database } from 'lucide-react';
import { generateProductFeed } from '../services/geminiService';
import { MarketplaceProduct, SearchFilters } from '../types';
import MarketplaceCard from '../components/MarketplaceCard';
import MarketplaceDetailModal from '../components/MarketplaceDetailModal';
import AdvancedFilterSidebar from '../components/AdvancedFilterSidebar';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

const Marketplace: React.FC = () => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  
  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    priceMin: '',
    priceMax: '',
    brands: [],
    rating: '',
    inStock: false,
    category: ''
  });

  const CATEGORIES = [
      { 
          title: "PC Components", 
          items: [
              { name: "Processors (CPU)", path: "cpu", icon: Cpu },
              { name: "Graphics Cards", path: "gpu", icon: Layers },
              { name: "Motherboards", path: "mainboard", icon: Server },
              { name: "Memory (RAM)", path: "ram", icon: Database },
              { name: "Storage", path: "ssd", icon: HardDrive },
              { name: "Power Supplies", path: "psu", icon: Zap },
              { name: "Cases", path: "case", icon: Box },
          ]
      },
      { 
          title: "Enterprise & Workstation", 
          items: [
              { name: "Server CPUs", path: "server-cpu", icon: Cpu },
              { name: "ECC Memory", path: "ecc-ram", icon: Database },
              { name: "Workstation GPUs", path: "workstation-gpu", icon: Layers },
              { name: "Server Chassis", path: "server-chassis", icon: Server },
          ]
      },
      { 
          title: "Peripherals", 
          items: [
              { name: "Monitors", path: "monitor", icon: Monitor },
              { name: "Keyboards", path: "keyboard", icon: Keyboard },
              { name: "Mice", path: "mouse", icon: Mouse },
          ]
      }
  ];

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') executeSearch();
  };

  // Modified to allow immediate search with new params
  const executeSearch = async (overrideFilters?: SearchFilters) => {
      const activeFilters = overrideFilters || filters;
      if (!query.trim() && !activeFilters.category) return;
      
      setLoading(true);
      setProducts([]);
      try {
        const result = await generateProductFeed(query, activeFilters);
        if (result && result.product_feed) setProducts(result.product_feed);
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
         <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                 <Link to="/" className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <ShoppingBag className="text-brand-600" />
                 </Link>
                 <h1 className="text-xl font-bold hidden sm:block">Global Market</h1>
             </div>

             <div className="flex-1 max-w-2xl relative flex gap-2">
                 <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                 >
                    <Filter size={20} />
                 </button>
                 <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder="Search hardware (e.g. RTX 4070 Ti, Ryzen 7)..."
                        className="w-full pl-4 pr-12 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                    <button 
                        onClick={() => executeSearch()}
                        className="absolute right-1 top-1 p-1.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-colors"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </button>
                 </div>
             </div>

             <div className="flex items-center gap-2">
                 <Link to="/builder">
                     <Button variant="ghost" className="hidden sm:flex">Back to Builder</Button>
                 </Link>
             </div>
         </div>
      </header>

      {/* Content Area with Sidebar */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full relative">
          
          {/* Module 2: Advanced Sidebar */}
          <AdvancedFilterSidebar 
             isOpen={showFilters} 
             onClose={() => setShowFilters(false)} 
             filters={filters}
             onFilterChange={(newFilters) => {
                 setFilters(newFilters);
                 executeSearch(newFilters);
             }}
          />

          {/* Main Grid */}
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
              
              {/* If no search, show Category Hub */}
              {products.length === 0 && !loading && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                      {CATEGORIES.map((section, idx) => (
                          <div key={idx} className="mb-8">
                              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                  {section.title}
                              </h2>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                  {section.items.map((cat) => (
                                      <Link 
                                        key={cat.path} 
                                        to={`/category/${cat.path}`}
                                        className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:shadow-md transition-all group text-center"
                                      >
                                          <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-brand-100 dark:group-hover:bg-brand-900 group-hover:text-brand-600 mb-3 transition-colors">
                                              <cat.icon size={24} />
                                          </div>
                                          <span className="font-medium text-sm">{cat.name}</span>
                                      </Link>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              {/* Loading Skeleton */}
              {loading && (
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
              )}

              {/* Product Grid */}
              {products.length > 0 && !loading && (
                  <div>
                      <div className="mb-4 text-sm text-slate-500">
                          Found {products.length} results for <span className="font-bold text-slate-900 dark:text-white">"{query || filters.category || 'Hardware'}"</span>
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

export default Marketplace;