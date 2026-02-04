import React, { useState, useMemo } from 'react';
import { useBuild } from '../context/BuildContext';
import { PART_CATEGORY, PC_TYPE, Part } from '../types';
import { MOCK_PARTS } from '../constants';
import PartCard from '../components/PartCard';
import Button from '../components/ui/Button';
import AIAdvisor from '../components/AIAdvisor';
import ComparisonModal from '../components/ComparisonModal';
import DealsModal from '../components/DealsModal';
import PrebuiltModal from '../components/PrebuiltModal';
import SystemTree from '../components/SystemTree';
import SaveLoadMenu from '../components/SaveLoadMenu';
import { generateBuildPDF } from '../utils/pdfGenerator';
import { AlertTriangle, CheckCircle, Download, Sparkles, ShoppingCart, Zap, ArrowLeft, Trash2, SlidersHorizontal, Search, Filter, Package, Monitor, GitMerge, LayoutGrid, Info, Save, FolderOpen, TrendingUp, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const Builder: React.FC = () => {
  const { build, selectPart, removePart, compatibilityIssues } = useBuild();
  const [activeCategory, setActiveCategory] = useState<PART_CATEGORY>(PART_CATEGORY.CPU);
  const [showAI, setShowAI] = useState(false);
  const [showPrebuilt, setShowPrebuilt] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState<'save' | 'load' | null>(null);
  const [compareList, setCompareList] = useState<Part[]>([]);
  const [activeDealPart, setActiveDealPart] = useState<Part | null>(null);
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({ min: '', max: '' });
  const [sortOption, setSortOption] = useState<'price-asc' | 'price-desc' | 'rating'>('rating');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Get unique brands for current category
  const availableBrands = useMemo(() => {
    const brands = new Set(MOCK_PARTS.filter(p => p.category === activeCategory).map(p => p.brand));
    return Array.from(brands);
  }, [activeCategory]);

  // Reset filters when category changes
  useMemo(() => {
    setSearchQuery('');
    setPriceRange({ min: '', max: '' });
    setSelectedBrands([]);
  }, [activeCategory]);

  // Filter & Sort Logic
  const filteredParts = useMemo(() => {
    return MOCK_PARTS.filter(p => {
      // 1. Category
      if (p.category !== activeCategory) return false;

      // 2. Search
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !JSON.stringify(p.specs).toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 3. Price
      const min = priceRange.min ? parseFloat(priceRange.min) : 0;
      const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
      if (p.price < min || p.price > max) return false;

      // 4. Brands
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;

      return true;
    }).sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'rating') return b.rating - a.rating;
      return 0;
    });
  }, [activeCategory, searchQuery, priceRange, selectedBrands, sortOption]);

  const handleCompare = (part: Part) => {
    if (compareList.find(p => p.id === part.id)) return;
    setCompareList(prev => [...prev, part]);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link to="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-500">
              {build.type} Builder
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">${build.totalPrice}</span>
                <span>•</span>
                <span className="flex items-center"><Zap size={12} className="mr-1"/> {build.totalWattage}W</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto items-center">
           <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Part Selection"
                >
                    <LayoutGrid size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('tree')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'tree' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="System Map"
                >
                    <GitMerge size={18} />
                </button>
           </div>

           <Link to="/marketplace">
               <Button variant="secondary" className="whitespace-nowrap px-3 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100" title="Global Marketplace">
                 <Globe size={18} className="mr-2" /> Shop
               </Button>
           </Link>

           <Link to="/dashboard">
               <Button variant="secondary" className="whitespace-nowrap px-3 mr-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300" title="Price Dashboard">
                 <TrendingUp size={18} className="mr-2" /> Prices
               </Button>
           </Link>

           <Button variant="secondary" onClick={() => setShowSaveLoad('save')} className="whitespace-nowrap px-3" title="Save Build">
             <Save size={18} />
           </Button>
           <Button variant="secondary" onClick={() => setShowSaveLoad('load')} className="whitespace-nowrap px-3 mr-2" title="Load Build">
             <FolderOpen size={18} />
           </Button>
           
           <Button variant="secondary" onClick={() => setShowPrebuilt(true)} className="whitespace-nowrap">
             <Package size={18} className="mr-2" /> Templates
           </Button>
           <Button variant="ghost" onClick={() => setShowAI(true)} className="text-brand-600 dark:text-brand-400 whitespace-nowrap bg-brand-50 dark:bg-brand-900/20">
             <Sparkles size={18} className="mr-2" /> AI Auto-Build
           </Button>
           <Button variant="primary" onClick={() => generateBuildPDF(build)} className="whitespace-nowrap">
             <Download size={18} className="mr-2" /> Export
           </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar - Categories (Only show in Grid mode) */}
        {viewMode === 'grid' && (
            <nav className="w-20 md:w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
            <div className="p-4 space-y-1">
                {Object.values(PART_CATEGORY).map((cat) => {
                const isSelected = !!build.parts[cat];
                const isActive = activeCategory === cat;
                return (
                    <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`
                        w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors
                        ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                    `}
                    >
                    <span className="flex items-center gap-2">
                        {cat === PART_CATEGORY.MONITOR && <Monitor size={14}/>}
                        {cat}
                    </span>
                    {isSelected && <CheckCircle size={14} className="text-green-500" />}
                    </button>
                );
                })}
            </div>
            </nav>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto flex flex-col">
           {/* AI Reasoning Banner */}
           {build.aiReasoning && (
               <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 border border-brand-100 dark:border-brand-800/50 flex gap-3 animate-in fade-in slide-in-from-top-2">
                   <div className="p-2 bg-white dark:bg-slate-800 rounded-full h-fit shadow-sm text-brand-600">
                       <Sparkles size={20} />
                   </div>
                   <div>
                       <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">AI Architect Strategy</h3>
                       <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{build.aiReasoning}</p>
                   </div>
               </div>
           )}

           {viewMode === 'grid' ? (
               <>
                   <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                        <h2 className="text-2xl font-bold mb-1">Select {activeCategory}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {filteredParts.length} parts available
                        </p>
                        </div>
                        
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className="md:hidden flex items-center gap-2 text-sm font-medium px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                            <SlidersHorizontal size={16} /> Filters
                        </button>
                    </div>

                    {/* Filters Toolbar */}
                    <div className={`
                        mb-6 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all
                        ${showFilters ? 'block' : 'hidden md:block'}
                    `}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                type="text" 
                                placeholder="Search (e.g. 144Hz, White)" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                />
                            </div>

                            {/* Price Range */}
                            <div className="flex items-center gap-2">
                                <input 
                                type="number" 
                                placeholder="Min $" 
                                value={priceRange.min}
                                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                />
                                <span className="text-slate-400">-</span>
                                <input 
                                type="number" 
                                placeholder="Max $" 
                                value={priceRange.max}
                                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                />
                            </div>

                            {/* Sort */}
                            <div>
                                <select 
                                value={sortOption} 
                                onChange={(e) => setSortOption(e.target.value as any)}
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                >
                                <option value="rating">Highest Rated</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                </select>
                            </div>
                            
                            {/* Brand Filter (Pills) */}
                            <div className="flex flex-wrap gap-2 items-center">
                                <Filter size={16} className="text-slate-400 mr-1" />
                                {availableBrands.length > 0 ? availableBrands.slice(0, 4).map(brand => (
                                <button
                                    key={brand}
                                    onClick={() => toggleBrand(brand)}
                                    className={`
                                    text-xs px-2 py-1 rounded-md border transition-colors
                                    ${selectedBrands.includes(brand) 
                                        ? 'bg-brand-100 dark:bg-brand-900 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300' 
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}
                                    `}
                                >
                                    {brand}
                                </button>
                                )) : <span className="text-xs text-slate-400">No brands</span>}
                            </div>
                        </div>
                    </div>

                    {/* Parts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                        {filteredParts.length > 0 ? (
                        filteredParts.map(part => (
                            <PartCard 
                            key={part.id} 
                            part={part} 
                            isSelected={build.parts[part.category]?.id === part.id}
                            onSelect={selectPart}
                            onCompare={() => handleCompare(part)}
                            onFindDeals={(p) => setActiveDealPart(p)}
                            />
                        ))
                        ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                            <Search size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">No parts found matching filters</p>
                            <Button variant="ghost" onClick={() => {
                            setSearchQuery('');
                            setPriceRange({min: '', max: ''});
                            setSelectedBrands([]);
                            }}>Clear Filters</Button>
                        </div>
                        )}
                    </div>
               </>
           ) : (
               /* TREE VIEW */
               <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">System Map</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Visualize how your components connect. Click any node for expert details.
                            </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border border-blue-100 dark:border-blue-800">
                            <Info size={14} /> Interactive Mode
                        </div>
                    </div>
                    <SystemTree />
               </div>
           )}
        </main>

        {/* Right Panel - Summary & Issues */}
        <aside className="w-80 flex-shrink-0 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-6 hidden lg:block">
            {/* Compatibility Section */}
            <div className={`mb-6 p-4 rounded-lg border ${compatibilityIssues.length > 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                    {compatibilityIssues.length > 0 ? <AlertTriangle className="text-red-500"/> : <CheckCircle className="text-green-500"/>}
                    Compatibility
                </h3>
                {compatibilityIssues.length === 0 ? (
                    <p className="text-sm text-green-700 dark:text-green-400">Everything looks good!</p>
                ) : (
                    <ul className="space-y-2">
                        {compatibilityIssues.map((issue, idx) => (
                            <li key={idx} className="text-xs text-red-600 dark:text-red-400 flex gap-2">
                                <span>•</span>
                                {issue.message}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Selected Parts List */}
            <h3 className="font-bold text-lg mb-4">Your List</h3>
            <div className="space-y-3">
                {(Object.entries(build.parts) as [string, Part][]).map(([cat, part]) => (
                    <div key={cat} className="flex justify-between items-start group">
                        <div className="overflow-hidden">
                            <div className="text-xs text-slate-500 font-medium">{cat}</div>
                            <div className="text-sm font-medium truncate w-48" title={part.name}>{part.name}</div>
                            <div className="text-xs text-slate-500">${part.price}</div>
                        </div>
                        <button 
                            onClick={() => removePart(cat as PART_CATEGORY)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {Object.keys(build.parts).length === 0 && (
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                        <ShoppingCart className="mx-auto mb-2 opacity-50"/>
                        <p className="text-sm">No parts selected</p>
                    </div>
                )}
            </div>

            {/* Total Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>${build.totalPrice}</span>
                </div>
            </div>
        </aside>
      </div>

      {/* Modals */}
      <AIAdvisor isOpen={showAI} onClose={() => setShowAI(false)} />
      
      {showPrebuilt && (
          <PrebuiltModal onClose={() => setShowPrebuilt(false)} />
      )}

      {showSaveLoad && (
          <SaveLoadMenu type={showSaveLoad} onClose={() => setShowSaveLoad(null)} />
      )}

      {compareList.length > 0 && (
        <ComparisonModal 
            parts={compareList} 
            onClose={() => setCompareList([])} 
        />
      )}

      {activeDealPart && (
        <DealsModal 
            part={activeDealPart}
            onClose={() => setActiveDealPart(null)}
        />
      )}
    </div>
  );
};

export default Builder;