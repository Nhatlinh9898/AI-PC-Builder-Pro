import React, { useEffect, useState } from 'react';
import { X, Globe, Info, Settings, Phone, Loader2, BarChart2, CheckCircle, ExternalLink, Download, LifeBuoy, Store, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { Part, ComponentLinks, PriceCrawlResult, RealTimePriceUpdate, VendorSyncResult } from '../types';
import { CATEGORY_GUIDES } from '../constants';
import Button from './ui/Button';
import { getPartAlternatives, getComponentLinks, crawlComponentPrices, checkPriceUpdate, syncVendorData } from '../services/geminiService';
import { useBuild } from '../context/BuildContext';

interface PartDetailModalProps {
  part: Part | null;
  categoryName?: string;
  onClose: () => void;
}

const PartDetailModal: React.FC<PartDetailModalProps> = ({ part, categoryName, onClose }) => {
  const { build } = useBuild();
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'resources'>('overview');
  
  // Data States
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [links, setLinks] = useState<ComponentLinks | null>(null);
  const [vendorData, setVendorData] = useState<VendorSyncResult | null>(null);
  const [crawlData, setCrawlData] = useState<PriceCrawlResult | null>(null);
  const [realTimeUpdate, setRealTimeUpdate] = useState<RealTimePriceUpdate | null>(null);
  
  // Loading States
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [analyzingPrices, setAnalyzingPrices] = useState(false);

  if (!part && !categoryName) return null;

  const guide = part ? CATEGORY_GUIDES[part.category] : (categoryName ? CATEGORY_GUIDES[categoryName as any] : null);

  // Fetch data when part changes
  useEffect(() => {
      if (part) {
          // Reset states
          setActiveTab('overview');
          setAlternatives([]);
          setLinks(null);
          setVendorData(null);
          setCrawlData(null);
          setRealTimeUpdate(null);
          
          // Fetch Alternatives
          setLoadingAlts(true);
          getPartAlternatives(part, build.type).then(alts => {
              setAlternatives(alts);
              setLoadingAlts(false);
          });

          // Fetch Links (Legacy) & Vendor Sync (Module 8)
          setLoadingLinks(true);
          Promise.all([
            getComponentLinks(part.name).then(data => setLinks(data)),
            syncVendorData(part.name).then(data => setVendorData(data))
          ]).finally(() => setLoadingLinks(false));
      }
  }, [part?.id]);

  const handlePriceAnalysis = async () => {
      if (!part) return;
      setAnalyzingPrices(true);
      try {
          // Execute Module 2 (Crawler) and Module 3 (Real-Time Update) in parallel
          const [crawlResult, updateResult] = await Promise.all([
              crawlComponentPrices(part.name),
              checkPriceUpdate(part.name, part.price)
          ]);
          setCrawlData(crawlResult);
          setRealTimeUpdate(updateResult);
      } catch (e) {
          console.error("Price analysis failed", e);
      } finally {
          setAnalyzingPrices(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 {part ? part.name : guide?.title}
                 {part && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full uppercase">Selected</span>}
             </h3>
             <p className="text-sm text-brand-600 dark:text-brand-400 font-medium">
                 {part ? part.category : "Component Guide"}
             </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation (Only if part is selected) */}
        {part && (
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setActiveTab('comparison')}
                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'comparison' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Comparison
                </button>
                <button 
                    onClick={() => setActiveTab('resources')}
                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'resources' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Resources & Buy
                </button>
            </div>
        )}

        <div className="p-6 overflow-y-auto">
            {/* Guide View (No Part Selected) */}
            {!part && guide && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
                     <Info className="text-blue-500 mx-auto mb-4" size={48} />
                     <h4 className="font-bold text-xl text-blue-900 dark:text-blue-100 mb-2">{guide.title}</h4>
                     <p className="text-slate-700 dark:text-slate-300 mb-4 max-w-xl mx-auto">{guide.description}</p>
                     <div className="inline-block bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-blue-200 dark:border-slate-700">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Pro Tip: </span>
                        <span className="text-slate-600 dark:text-slate-400">{guide.importance}</span>
                     </div>
                </div>
            )}

            {/* TAB CONTENT */}
            {part && activeTab === 'overview' && (
                <div className="flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-full md:w-1/3">
                        <img src={part.image} alt={part.name} className="w-full aspect-square object-cover rounded-xl bg-slate-100 dark:bg-slate-800 shadow-md mb-4" />
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-2xl text-green-600">${part.price}</span>
                            <div className="flex items-center gap-1 text-slate-500 text-xs">
                                <Globe size={12}/> Global Avg
                            </div>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-2/3">
                        {part.reasoning && (
                            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800 text-sm text-purple-800 dark:text-purple-200 italic">
                                "AI Reason: {part.reasoning}"
                            </div>
                        )}

                        <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <Settings size={18} /> Technical Specifications
                        </h4>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {Object.entries(part.specs).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                    <span className="text-xs text-slate-500 uppercase font-semibold">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <span className="text-sm font-medium">{value?.toString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {part && activeTab === 'comparison' && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-xl flex items-center gap-2">
                            <BarChart2 size={20} className="text-brand-500" /> Market Comparison
                        </h4>
                        {loadingAlts && <Loader2 className="animate-spin text-brand-500" size={20} />}
                    </div>
                    
                    {loadingAlts ? (
                        <div className="flex flex-col items-center justify-center h-40 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            <Loader2 className="animate-spin text-brand-500 mb-2" size={32} />
                            <p className="text-slate-500">AI is scouting 5 alternative components...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">Feature</th>
                                        <th className="px-6 py-4 bg-brand-50 dark:bg-brand-900/20 border-x border-brand-200 dark:border-brand-800">
                                            <div className="flex items-center gap-1 text-brand-700 dark:text-brand-400">
                                                Current Choice <CheckCircle size={14}/>
                                            </div>
                                        </th>
                                        {alternatives.map((alt, i) => (
                                            <th key={i} className="px-6 py-4 min-w-[200px]">Alternative {i+1}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {/* Price Row */}
                                    <tr className="bg-white dark:bg-slate-900">
                                        <td className="px-6 py-4 font-medium sticky left-0 bg-white dark:bg-slate-900">Price</td>
                                        <td className="px-6 py-4 font-bold text-green-600 bg-brand-50/30 border-x border-brand-100 dark:border-brand-900/30">${part.price}</td>
                                        {alternatives.map((alt, i) => (
                                            <td key={i} className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                ${alt.price} 
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Name Row */}
                                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                                        <td className="px-6 py-4 font-medium sticky left-0 bg-slate-50 dark:bg-slate-800/50">Name</td>
                                        <td className="px-6 py-4 bg-brand-50/30 border-x border-brand-100 dark:border-brand-900/30 text-xs">{part.name}</td>
                                        {alternatives.map((alt, i) => (
                                            <td key={i} className="px-6 py-4 text-xs font-semibold">{alt.name}</td>
                                        ))}
                                    </tr>
                                    {/* Specs Row Loop */}
                                    {Object.keys(part.specs).slice(0, 4).map(key => (
                                        <tr key={key} className="bg-white dark:bg-slate-900">
                                            <td className="px-6 py-4 font-medium capitalize sticky left-0 bg-white dark:bg-slate-900">{key.replace(/([A-Z])/g, ' $1')}</td>
                                            <td className="px-6 py-4 bg-brand-50/30 border-x border-brand-100 dark:border-brand-900/30">{part.specs[key]?.toString()}</td>
                                            {alternatives.map((alt, i) => (
                                                <td key={i} className="px-6 py-4 text-slate-500">{alt.specs?.[key] || alt.specs?.benchmarkScore || '-'}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                 </div>
            )}

            {part && activeTab === 'resources' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    {loadingLinks ? (
                         <div className="flex flex-col items-center justify-center h-40 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            <Loader2 className="animate-spin text-brand-500 mb-2" size={32} />
                            <p className="text-slate-500">Retrieving official manufacturer links...</p>
                        </div>
                    ) : links ? (
                        <>
                            {/* MODULE 1 & 8: Official Links (Enhanced with Vendor Sync) */}
                            <div>
                                <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <LifeBuoy size={20} className="text-blue-500" /> Official Support
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <a href={vendorData?.vendor_sync.official_vendor.product_page || links.official_links.product_page} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                            <Globe size={24} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-white">Product Page</div>
                                            <div className="text-xs text-slate-500">Official Features & Overview</div>
                                        </div>
                                        <ExternalLink size={16} className="ml-auto text-slate-400" />
                                    </a>

                                    <a href={links.official_links.spec_page} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group">
                                        <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                            <Settings size={24} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-white">Technical Specs</div>
                                            <div className="text-xs text-slate-500">Datasheets & Manuals</div>
                                        </div>
                                        <ExternalLink size={16} className="ml-auto text-slate-400" />
                                    </a>

                                    <a href={links.official_links.driver_page} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group">
                                        <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                                            <Download size={24} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-white">Drivers & Firmware</div>
                                            <div className="text-xs text-slate-500">Download Latest Updates</div>
                                        </div>
                                        <ExternalLink size={16} className="ml-auto text-slate-400" />
                                    </a>

                                    <a href={vendorData?.vendor_sync.official_vendor.support_page || links.official_links.support_page} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group">
                                        <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                                            <LifeBuoy size={24} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-white">Support Center</div>
                                            <div className="text-xs text-slate-500">
                                                {vendorData?.vendor_sync.official_vendor.phone ? `Call: ${vendorData.vendor_sync.official_vendor.phone}` : 'Warranty & Troubleshooting'}
                                            </div>
                                        </div>
                                        <ExternalLink size={16} className="ml-auto text-slate-400" />
                                    </a>
                                </div>
                            </div>

                            {/* MODULE 3: Real-Time Price Update Section */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                            <Store size={20} className="text-brand-500" /> Market Intelligence
                                        </h4>
                                        <p className="text-sm text-slate-500">Real-time price tracking & analysis</p>
                                    </div>
                                    <Button onClick={handlePriceAnalysis} disabled={analyzingPrices} size="sm" className="gap-2">
                                        {analyzingPrices ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                        {analyzingPrices ? 'Analyzing...' : 'Live Price Check'}
                                    </Button>
                                </div>

                                {analyzingPrices && (
                                    <div className="h-32 flex items-center justify-center text-slate-500 italic">
                                        Scanning global marketplaces for {part.name}...
                                    </div>
                                )}

                                {!analyzingPrices && realTimeUpdate && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Current Trend</div>
                                            <div className={`text-lg font-bold flex items-center gap-2 ${
                                                realTimeUpdate.price_change === 'decrease' ? 'text-green-600' : 
                                                realTimeUpdate.price_change === 'increase' ? 'text-red-500' : 'text-slate-600'
                                            }`}>
                                                {realTimeUpdate.price_change === 'decrease' && <TrendingDown size={24} />}
                                                {realTimeUpdate.price_change === 'increase' && <TrendingUp size={24} />}
                                                {realTimeUpdate.price_change === 'stable' && <Minus size={24} />}
                                                <span className="capitalize">{realTimeUpdate.price_change}</span>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Lowest Price</div>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                                                ${realTimeUpdate.new_price}
                                            </div>
                                            <div className="text-xs text-slate-400">vs Old: ${realTimeUpdate.old_price}</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Best Deal At</div>
                                            <div className="text-lg font-bold text-brand-600 truncate">
                                                {realTimeUpdate.best_store}
                                            </div>
                                            <div className="text-xs text-slate-400">{new Date().toLocaleTimeString()}</div>
                                        </div>
                                    </div>
                                )}

                                {/* MODULE 2: Price Crawler Results */}
                                {!analyzingPrices && crawlData && (
                                    <div>
                                        <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                            <Globe size={14} className="text-slate-400"/> Global Listings
                                        </h5>
                                        <div className="space-y-2">
                                            {crawlData.results.map((item, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                                                            {item.store.substring(0,2)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{item.store}</div>
                                                            <div className="text-xs text-slate-500 flex gap-2">
                                                                <span className={item.availability.toLowerCase().includes('stock') ? 'text-green-600' : 'text-orange-500'}>
                                                                    {item.availability}
                                                                </span>
                                                                {item.rating && <span>⭐ {item.rating}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold">${item.price}</div>
                                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline">
                                                            View Deal
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* MODULE 8: Vendor Sync Retailers (Fallback if no crawler data) */}
                            {!crawlData && (
                                <div>
                                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                        <Store size={20} className="text-brand-500" /> Standard Retailers
                                    </h4>
                                    <div className="space-y-3">
                                        {(vendorData?.vendor_sync.retail_vendors || links.retail_links).map((link, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 transition-colors">
                                                <div className="flex items-center gap-4 mb-2 sm:mb-0">
                                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                                                        {link.store.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">{link.store}</div>
                                                        <div className="text-xs flex items-center gap-2 text-slate-500">
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${link.availability.toLowerCase().includes('stock') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {link.availability}
                                                            </span>
                                                            {link.phone && (
                                                                <span className="flex items-center gap-1"><Phone size={10}/> {link.phone}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                                    <div className="text-lg font-bold text-slate-900 dark:text-white">{link.price}</div>
                                                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                                                        <Button size="sm">Go to Store</Button>
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-10 text-slate-500">
                            Failed to load resources.
                        </div>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default PartDetailModal;