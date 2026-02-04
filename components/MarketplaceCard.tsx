import React from 'react';
import { MarketplaceProduct } from '../types';
import { Star, ShoppingCart, Eye, Store, AlertCircle, Layers, Bell } from 'lucide-react';
import Button from './ui/Button';

interface MarketplaceCardProps {
  product: MarketplaceProduct;
  onViewDetails: (product: MarketplaceProduct) => void;
}

const MarketplaceCard: React.FC<MarketplaceCardProps> = ({ product, onViewDetails }) => {
  // Data Sanitization & Checks
  const ratingVal = parseFloat(product.rating) || 0;
  const hasPrice = product.price && product.price !== '0' && product.price.toLowerCase() !== 'unknown';
  const hasLink = product.product_url && product.product_url !== '#' && product.product_url !== '';
  const isAggregated = product.vendor.toLowerCase().includes('aggregated') || product.vendor.toLowerCase().includes('various');
  const isStocked = product.availability?.toLowerCase().includes('stock');

  // Fallback for Vendor Name
  const displayVendor = isAggregated ? 'Aggregated Retailers' : (product.vendor || 'Unknown Vendor');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full relative">
      
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {isAggregated && (
              <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1 shadow-sm">
                  <Layers size={10} /> Aggregated
              </span>
          )}
          {!hasPrice && (
              <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                  <AlertCircle size={10} /> Price TBD
              </span>
          )}
      </div>

      <div className="absolute top-2 right-2 z-10">
           <span className="bg-white/90 dark:bg-black/60 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-700">
               {product.source}
           </span>
      </div>

      {/* Image Area */}
      <div className="relative aspect-[4/3] p-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
        <img 
          src={product.image || `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`} 
          alt={product.name} 
          className={`max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110 ${!product.image ? 'opacity-50 grayscale' : 'mix-blend-multiply dark:mix-blend-normal'}`}
          onError={(e) => {
              (e.target as HTMLImageElement).src = `https://placehold.co/400x400?text=No+Image`;
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 border-t border-slate-100 dark:border-slate-700/50">
        
        {/* Rating */}
        <div className="flex items-center gap-1 text-yellow-400 text-xs mb-2">
           {[...Array(5)].map((_, i) => (
             <Star key={i} size={12} fill={i < Math.round(ratingVal) ? "currentColor" : "none"} stroke="currentColor" />
           ))}
           <span className="text-slate-400 ml-1 text-[10px] font-medium">{product.rating ? `(${product.rating})` : '(No Reviews)'}</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 mb-3 text-sm leading-snug min-h-[40px] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" title={product.name}>
          {product.name}
        </h3>

        {/* Specs Snippet (if available) */}
        {product.specs?.technical_details && product.specs.technical_details.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
                {product.specs.technical_details.slice(0, 2).map((spec, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500">
                        {spec.value}
                    </span>
                ))}
            </div>
        )}

        <div className="mt-auto">
            {/* Price & Vendor Row */}
            <div className="flex justify-between items-end mb-4">
                <div>
                   {hasPrice ? (
                       <div className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                           {product.price} <span className="text-[10px] font-normal text-slate-500 align-top">{product.currency}</span>
                       </div>
                   ) : (
                       <div className="text-sm font-bold text-slate-400 italic">Check availability</div>
                   )}
                   
                   <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate max-w-[120px]" title={displayVendor}>
                      <Store size={10} /> {displayVendor}
                   </div>
                </div>

                <div className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide border ${
                    isStocked 
                    ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-900' 
                    : 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:border-orange-900'
                }`}>
                   {product.availability || 'Unknown Stock'}
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
               <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => onViewDetails(product)} 
                  className="w-full text-xs h-9 hover:border-brand-300 dark:hover:border-brand-700"
               >
                  <Eye size={14} className="mr-1.5" /> Details
               </Button>
               
               {hasLink ? (
                   <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="w-full">
                       <Button size="sm" className="w-full bg-brand-600 hover:bg-brand-700 text-white border-none text-xs h-9 shadow-sm shadow-brand-200 dark:shadow-none">
                          <ShoppingCart size={14} className="mr-1.5" /> Buy Now
                       </Button>
                   </a>
               ) : (
                   <Button size="sm" variant="secondary" className="w-full text-xs h-9 opacity-70 cursor-not-allowed">
                      <Bell size={14} className="mr-1.5" /> Notify Me
                   </Button>
               )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceCard;