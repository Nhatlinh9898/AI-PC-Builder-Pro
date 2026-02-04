import React from 'react';
import { Part } from '../types';
import { Plus, Check, Search, ShoppingCart, Globe } from 'lucide-react';
import Button from './ui/Button';

interface PartCardProps {
  part: Part;
  isSelected: boolean;
  onSelect: (part: Part) => void;
  onCompare?: (part: Part) => void;
  onFindDeals?: (part: Part) => void;
}

const PartCard: React.FC<PartCardProps> = ({ part, isSelected, onSelect, onCompare, onFindDeals }) => {
  return (
    <div className={`
      relative flex flex-col p-4 rounded-xl border transition-all duration-200 h-full
      ${isSelected 
        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md ring-1 ring-brand-500' 
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-300 dark:hover:border-brand-700 shadow-sm hover:shadow-md'}
    `}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider bg-brand-100 dark:bg-brand-900 px-2 py-0.5 rounded">
          {part.brand}
        </span>
        <div className="flex items-center text-yellow-500 text-sm">
          ★ <span className="ml-1 text-slate-700 dark:text-slate-300">{part.rating}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <img src={part.image} alt={part.name} className="w-16 h-16 object-cover rounded-md bg-slate-100 dark:bg-slate-900" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white leading-tight mb-1 truncate" title={part.name}>{part.name}</h3>
          <div className="flex items-baseline gap-2">
             <p className="text-lg font-bold text-slate-900 dark:text-white">${part.price}</p>
             <span className="text-xs text-slate-500">est.</span>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-4">
        {Object.entries(part.specs).slice(0, 3).map(([key, value]) => (
          <div key={key} className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-1 last:border-0">
            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate ml-2">{value?.toString()}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-3">
        {/* Vendor List */}
        <div className="flex flex-wrap gap-2">
            {part.vendors.slice(0, 3).map((v, idx) => (
                <a 
                    key={idx} 
                    href={v.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    {v.name === 'Amazon' ? <ShoppingCart size={10} /> : <Globe size={10} />}
                    {v.name}: ${v.price}
                </a>
            ))}
        </div>

        <div className="flex gap-2">
            <Button 
            variant={isSelected ? "primary" : "secondary"} 
            className="flex-1"
            size="sm"
            onClick={() => onSelect(part)}
            >
            {isSelected ? (
                <><Check size={14} className="mr-1" /> Selected</>
            ) : (
                <><Plus size={14} className="mr-1" /> Add</>
            )}
            </Button>
            {onCompare && (
                <Button variant="ghost" size="sm" onClick={() => onCompare(part)} title="Compare" className="px-2">
                    <span className="text-xs">Comp</span>
                </Button>
            )}
            {onFindDeals && (
                 <Button variant="ghost" size="sm" onClick={() => onFindDeals(part)} title="Check Live Deals" className="px-2 text-brand-600">
                    <Search size={14} />
                 </Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default PartCard;
