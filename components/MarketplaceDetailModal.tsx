import React, { useEffect, useState } from 'react';
import { X, Phone, Store, Globe, CheckCircle, ShieldCheck, ShoppingBag, Loader2, Sparkles, Activity, Clapperboard } from 'lucide-react';
import { MarketplaceProduct, DataRecoveryResult, MediaEnrichmentResult } from '../types';
import { recoverProductData, enrichProductMedia } from '../services/geminiService';
import Button from './ui/Button';
import ImageGallery from './ui/ImageGallery';
import ReviewSummary from './ui/ReviewSummary';
import DataStatusBadge from './ui/DataStatusBadge';
import DataPipelineVisualizer from './ui/DataPipelineVisualizer';

interface MarketplaceDetailModalProps {
  product: MarketplaceProduct | null;
  onClose: () => void;
}

const MarketplaceDetailModal: React.FC<MarketplaceDetailModalProps> = ({ product, onClose }) => {
  const [activeProduct, setActiveProduct] = useState<MarketplaceProduct | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<DataRecoveryResult['data_recovery'] | null>(null);
  const [enrichedMedia, setEnrichedMedia] = useState<any[]>([]); // Array for ImageGallery
  const [isRecovering, setIsRecovering] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);

  // When product opens, reset and start data enhancement
  useEffect(() => {
    if (product) {
        setActiveProduct(product);
        setRecoveryStatus(null);
        setEnrichedMedia([]);
        setIsRecovering(true);
        setShowPipeline(false);

        // Initialize with basic image
        const initialImages = (product.images && product.images.length > 0) 
            ? product.images.map(url => ({ type: 'image', url, source: 'retailer' }))
            : [{ type: 'image', url: product.image, source: 'retailer' }];
        setEnrichedMedia(initialImages);

        // Run recovery & media enrichment in parallel
        Promise.all([
            recoverProductData(product),
            enrichProductMedia(product.name)
        ]).then(([recoveryRes, mediaRes]) => {
            
            // 1. Handle Recovery Data
            if (recoveryRes && recoveryRes.data_recovery) {
                setRecoveryStatus(recoveryRes.data_recovery);
                setActiveProduct(prev => {
                    if(!prev) return null;
                    const rec = recoveryRes.data_recovery.recovered_fields;
                    return {
                        ...prev,
                        vendor_phone: prev.vendor_phone || rec.manufacturer_links.phone,
                        specs: {
                            ...prev.specs,
                            technical_details: prev.specs.technical_details.length > 0 ? prev.specs.technical_details : (rec.specs || [])
                        }
                    };
                });
            }

            // 2. Handle Media Enrichment
            if (mediaRes && mediaRes.media_enrichment) {
                const newMedia: any[] = [];
                
                // Add Videos First (Promotional priority)
                if (mediaRes.media_enrichment.videos) {
                    mediaRes.media_enrichment.videos.forEach(v => {
                        newMedia.push({ type: 'video', url: v.url, source: v.source, quality: v.quality });
                    });
                }

                // Add High Quality Official Images
                if (mediaRes.media_enrichment.images) {
                    mediaRes.media_enrichment.images.forEach(img => {
                        newMedia.push({ type: 'image', url: img.url, source: img.source, quality: img.quality, alt: img.alt });
                    });
                }

                // Merge with initial if not redundant (simple de-dupe by URL)
                const finalMedia = [...newMedia, ...initialImages.filter(init => !newMedia.some(n => n.url === init.url))];
                setEnrichedMedia(finalMedia);
            }

            setIsRecovering(false);
        });
    }
  }, [product]);

  if (!activeProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
             <div className="bg-slate-200 dark:bg-slate-700 rounded px-2 py-1 text-xs font-bold uppercase tracking-wider">
                 {activeProduct.specs.category || 'Hardware'}
             </div>
             <div className="text-slate-500 text-sm">/ {activeProduct.source}</div>
             {isRecovering && (
                 <div className="flex items-center gap-1 text-xs text-brand-600 animate-pulse bg-brand-50 px-2 py-0.5 rounded-full">
                     <Sparkles size={10} /> Refining Data...
                 </div>
             )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-slate-950">
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Left Column: Gallery & Reviews */}
                <div className="w-full lg:w-5/12 space-y-8">
                    {/* MODULE 1 & 19: Gallery with Videos */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                        <ImageGallery 
                            items={enrichedMedia}
                            productName={activeProduct.name} 
                        />
                        {/* Fallback Badge Overlay */}
                        {recoveryStatus?.fallback_used.images && enrichedMedia.length <= 1 && (
                             <div className="absolute top-6 left-6 bg-yellow-100 text-yellow-800 text-[10px] px-2 py-1 rounded font-bold shadow-sm flex items-center gap-1">
                                <Loader2 size={10} className="animate-spin"/> Updating Media...
                             </div>
                        )}
                    </div>

                    {/* MODULE 14: Data Health Badge */}
                    {recoveryStatus && (
                        <DataStatusBadge 
                            confidence={recoveryStatus.confidence_score} 
                            missingFields={recoveryStatus.missing_fields}
                            fallbackUsed={Object.values(recoveryStatus.fallback_used).some(v => v)}
                        />
                    )}

                    {/* MODULE 3: Reviews */}
                    <ReviewSummary productName={activeProduct.name} />
                </div>

                {/* Right Column: Info & Specs */}
                <div className="w-full lg:w-7/12">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                            {activeProduct.name}
                        </h2>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                            <span className="flex items-center gap-1 text-yellow-500 font-medium">
                                ⭐ {activeProduct.rating} <span className="text-slate-400 font-normal">Rating</span>
                            </span>
                            <span>•</span>
                            <span className="font-medium text-brand-600 dark:text-brand-400">{activeProduct.specs.brand}</span>
                            <span>•</span>
                            <span className="font-mono">{activeProduct.specs.model}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className="text-sm text-slate-500 mb-1">Price</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{activeProduct.price}</span>
                                    <span className="text-sm text-slate-500">{activeProduct.currency}</span>
                                </div>
                            </div>
                            <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center">
                                <div className={`flex items-center gap-2 font-medium ${activeProduct.availability.toLowerCase().includes('stock') ? 'text-green-600' : 'text-orange-500'}`}>
                                    <CheckCircle size={20} />
                                    {activeProduct.availability}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                             <a href={activeProduct.product_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                <Button size="lg" className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 border-none font-bold">
                                    <ShoppingBag size={18} className="mr-2"/> Buy Now on {activeProduct.source}
                                </Button>
                             </a>
                        </div>
                    </div>

                    <div className="space-y-6">
                        
                        {/* DATA PIPELINE TRIGGER */}
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white">Smart Data Analysis</h3>
                            <button 
                                onClick={() => setShowPipeline(!showPipeline)}
                                className="text-xs flex items-center gap-1 text-brand-600 font-medium hover:underline"
                            >
                                <Activity size={14}/> {showPipeline ? 'Hide Pipeline' : 'View Pipeline'}
                            </button>
                        </div>
                        
                        {/* MODULE 15, 16, 17: Visualizer */}
                        {showPipeline && (
                            <DataPipelineVisualizer productName={activeProduct.name} />
                        )}

                        {/* Vendor Details */}
                        <div>
                             <h3 className="font-bold flex items-center gap-2 mb-3 text-slate-900 dark:text-white">
                                 <Store size={18} /> Seller Information
                             </h3>
                             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex justify-between items-center shadow-sm">
                                 <div>
                                     <div className="font-bold text-lg">{activeProduct.vendor}</div>
                                     <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                                         <span className="flex items-center gap-1"><ShieldCheck size={12}/> Verified Seller</span>
                                         <span className="flex items-center gap-1"><Globe size={12}/> {activeProduct.source}</span>
                                     </div>
                                 </div>
                                 {activeProduct.vendor_phone && (
                                     <div className="text-right">
                                         <div className="text-xs text-slate-500 uppercase">Support</div>
                                         <div className="font-mono font-bold flex items-center gap-1">
                                             <Phone size={14}/> {activeProduct.vendor_phone}
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="font-bold mb-3">About this item</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                                {activeProduct.description}
                            </p>
                        </div>

                        {/* Technical Specs Table */}
                        <div>
                             <h3 className="font-bold mb-3">Technical Specifications</h3>
                             {activeProduct.specs.technical_details.length > 0 ? (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                                    {activeProduct.specs.technical_details.map((spec, idx) => (
                                        <div key={idx} className="flex border-b border-slate-100 dark:border-slate-800 last:border-0">
                                            <div className="w-1/3 bg-slate-50 dark:bg-slate-800/50 p-3 text-xs font-bold text-slate-500 uppercase flex items-center">
                                                {spec.name}
                                            </div>
                                            <div className="w-2/3 p-3 text-sm font-medium text-slate-900 dark:text-white">
                                                {spec.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                 <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 italic">
                                     Technical details are currently unavailable for this item.
                                 </div>
                             )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDetailModal;