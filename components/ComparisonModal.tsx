import React, { useEffect, useState } from 'react';
import { X, Loader2, Trophy, ThumbsUp, Wallet, AlertCircle, Phone, CheckCircle, PlusCircle, MinusCircle } from 'lucide-react';
import { Part, ComparisonResult } from '../types';
import { generateDetailedComparison } from '../services/geminiService';
import Button from './ui/Button';

const ComparisonModal: React.FC<{ parts: Part[]; onClose: () => void }> = ({ parts, onClose }) => {
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchComparison = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await generateDetailedComparison(parts);
        if (data) {
          setResult(data);
        } else {
          setError(true);
        }
      } catch (error) {
        console.error(error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (parts.length > 0) fetchComparison();
  }, [parts]);

  if (!loading && error) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
             <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl p-6 text-center">
                 <AlertCircle size={48} className="mx-auto text-red-500 mb-4"/>
                 <h3 className="text-xl font-bold mb-2">Analysis Failed</h3>
                 <p className="text-slate-500 mb-6">Could not generate comparison data. Please try again.</p>
                 <Button onClick={onClose}>Close</Button>
             </div>
        </div>
      );
  }

  // Helper to highlight winning cards
  const getWinnerBadge = (itemName: string) => {
      if (!result) return null;
      if (result.summary.best_performance.includes(itemName)) 
        return <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1"><Trophy size={10}/> PERFORMANCE</div>;
      if (result.summary.best_value.includes(itemName)) 
        return <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1"><Wallet size={10}/> BEST VALUE</div>;
      if (result.summary.best_overall.includes(itemName)) 
        return <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1"><ThumbsUp size={10}/> WINNER</div>;
      return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Comparison: {parts[0]?.category}
            </h3>
            {result && <p className="text-xs text-slate-500">{result.comparison_table.items.length} items analyzed</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-100 dark:bg-slate-950">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                    <Loader2 className="animate-spin h-12 w-12 text-brand-500 mb-4"/>
                    <p className="text-lg font-medium text-slate-900 dark:text-white">AI is analyzing specifications...</p>
                    <p className="text-sm text-slate-500">Checking benchmarks, pricing, and technical details</p>
                </div>
            ) : result && (
                <div className="space-y-8">
                    
                    {/* Recommendation Banner */}
                    <div className="bg-gradient-to-r from-brand-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-start gap-4">
                            <div className="bg-white/20 p-3 rounded-full">
                                <Trophy size={24} className="text-yellow-300" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Our Recommendation: {result.recommendation.suggested_choice}</h4>
                                <p className="text-brand-100 text-sm leading-relaxed">{result.recommendation.reasoning}</p>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Grid/Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="w-40 bg-transparent p-2"></th>
                                    {result.comparison_table.items.map((item, idx) => (
                                        <th key={idx} className="min-w-[220px] p-2 align-bottom pb-4">
                                            <div className="relative bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col items-center text-center">
                                                {getWinnerBadge(item.name)}
                                                
                                                <div className="w-20 h-20 mb-3 bg-slate-100 dark:bg-slate-700 rounded-lg p-1 flex items-center justify-center">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain rounded"/>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">No Img</span>
                                                    )}
                                                </div>
                                                
                                                <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 mb-1" title={item.name}>
                                                    {item.name}
                                                </div>
                                                <div className="font-bold text-lg text-brand-600 dark:text-brand-400 mb-2">
                                                    {item.price === 'Unknown' ? 'N/A' : `$${item.price}`}
                                                </div>

                                                <a href="#" className="mt-auto text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full w-full">
                                                    Check Price
                                                </a>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                                {/* Vendor Row */}
                                <tr className="bg-white dark:bg-slate-900">
                                    <td className="p-4 font-bold text-slate-500 uppercase text-xs">Vendor Info</td>
                                    {result.comparison_table.items.map((item, idx) => (
                                        <td key={idx} className="p-4 text-center">
                                            <div className="font-medium">{item.vendor}</div>
                                            {item.phone && item.phone !== 'N/A' && (
                                                <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                                                    <Phone size={10}/> {item.phone}
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>

                                {/* Benchmark Row */}
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <td className="p-4 font-bold text-slate-500 uppercase text-xs">Performance</td>
                                    {result.comparison_table.items.map((item, idx) => (
                                        <td key={idx} className="p-4 text-center">
                                            <div className="font-mono font-bold text-brand-600 dark:text-brand-400">
                                                {item.benchmark || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>

                                {/* Dynamic Specs Rows */}
                                {Object.keys(result.comparison_table.items[0].specs).map((key) => (
                                    <tr key={key} className="bg-white dark:bg-slate-900 even:bg-slate-50 even:dark:bg-slate-800/50">
                                        <td className="p-4 font-bold text-slate-500 uppercase text-xs">{key}</td>
                                        {result.comparison_table.items.map((item, idx) => (
                                            <td key={idx} className="p-4 text-center font-medium text-slate-700 dark:text-slate-200">
                                                {item.specs[key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}

                                {/* Pros Row */}
                                <tr className="bg-green-50/50 dark:bg-green-900/10">
                                    <td className="p-4 font-bold text-green-600 uppercase text-xs align-top">Pros</td>
                                    {result.comparison_table.items.map((item, idx) => (
                                        <td key={idx} className="p-4 align-top">
                                            <ul className="space-y-1 text-left">
                                                {item.pros.map((pro, i) => (
                                                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                                                        <PlusCircle size={12} className="text-green-500 shrink-0 mt-0.5"/>
                                                        <span>{pro}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                    ))}
                                </tr>

                                {/* Cons Row */}
                                <tr className="bg-red-50/50 dark:bg-red-900/10">
                                    <td className="p-4 font-bold text-red-600 uppercase text-xs align-top">Cons</td>
                                    {result.comparison_table.items.map((item, idx) => (
                                        <td key={idx} className="p-4 align-top">
                                            <ul className="space-y-1 text-left">
                                                {item.cons.map((con, i) => (
                                                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                                                        <MinusCircle size={12} className="text-red-500 shrink-0 mt-0.5"/>
                                                        <span>{con}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;