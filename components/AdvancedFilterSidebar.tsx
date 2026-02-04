import React, { useState } from 'react';
import { SearchFilters, PART_CATEGORY } from '../types';
import { Filter, X, Check } from 'lucide-react';
import Button from './ui/Button';

interface AdvancedFilterSidebarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_BRANDS = ['Intel', 'AMD', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'Corsair', 'Samsung', 'LG', 'Dell'];

const AdvancedFilterSidebar: React.FC<AdvancedFilterSidebarProps> = ({ filters, onFilterChange, isOpen, onClose }) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const handleApply = () => {
    onFilterChange(localFilters);
    if (window.innerWidth < 768) onClose();
  };

  const toggleBrand = (brand: string) => {
    const current = localFilters.brands;
    const newBrands = current.includes(brand)
      ? current.filter(b => b !== brand)
      : [...current, brand];
    setLocalFilters({ ...localFilters, brands: newBrands });
  };

  const handleChange = (key: keyof SearchFilters, value: any) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0 md:shadow-none md:h-auto
    `}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-6 md:hidden">
          <h2 className="font-bold text-lg flex items-center gap-2"><Filter size={20}/> Filters</h2>
          <button onClick={onClose}><X size={20}/></button>
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Category</label>
          <select 
            value={localFilters.category} 
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          >
            <option value="">All Categories</option>
            {Object.values(PART_CATEGORY).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Price Range ($)</label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Min" 
              value={localFilters.priceMin}
              onChange={(e) => handleChange('priceMin', e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={localFilters.priceMax}
              onChange={(e) => handleChange('priceMax', e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>
        </div>

        {/* Stock */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={localFilters.inStock}
              onChange={(e) => handleChange('inStock', e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700"
            />
            <span className="text-sm font-medium">In Stock Only</span>
          </label>
        </div>

        {/* Minimum Rating */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Min Rating</label>
          <div className="flex gap-1">
            {[4, 3, 2, 1].map(r => (
              <button 
                key={r}
                onClick={() => handleChange('rating', r.toString())}
                className={`flex-1 py-1.5 text-xs rounded border transition-colors ${localFilters.rating === r.toString() ? 'bg-yellow-100 border-yellow-400 text-yellow-800 font-bold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
              >
                {r}+ ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div className="mb-8">
          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Brands</label>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
            {COMMON_BRANDS.map(brand => (
              <label key={brand} className="flex items-center justify-between cursor-pointer group p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="text-sm text-slate-700 dark:text-slate-300">{brand}</span>
                <div 
                  onClick={(e) => { e.preventDefault(); toggleBrand(brand); }}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${localFilters.brands.includes(brand) ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}
                >
                  {localFilters.brands.includes(brand) && <Check size={10} strokeWidth={4} />}
                </div>
              </label>
            ))}
          </div>
        </div>

        <Button onClick={handleApply} className="w-full">
          Apply Filters
        </Button>
      </div>
    </aside>
  );
};

export default AdvancedFilterSidebar;