import React, { useEffect, useState } from 'react';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { Part } from '../types';
import { findPartDeals } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const DealsModal: React.FC<{ part: Part; onClose: () => void }> = ({ part, onClose }) => {
  const [data, setData] = useState<{ text: string, grounding?: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await findPartDeals(part.name);
        setData(result);
      } catch (error) {
        setData({ text: "Could not fetch live deals at this time." });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [part]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Deals: {part.name}</h3>
              <p className="text-xs text-slate-500">Powered by Google Search</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Loader2 className="animate-spin h-10 w-10 text-brand-500"/>
                    <p className="text-slate-500">Searching global marketplaces...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Render standard text response */}
                    <div className="prose dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown>{data?.text || ''}</ReactMarkdown>
                    </div>

                    {/* Grounding Sources (Actual Links) */}
                    {data?.grounding?.groundingChunks && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                            <h4 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Found Sources</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {data.grounding.groundingChunks.map((chunk: any, i: number) => {
                                    const web = chunk.web;
                                    if (!web) return null;
                                    return (
                                        <a 
                                            key={i} 
                                            href={web.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:shadow-sm transition-all text-xs"
                                        >
                                            <ExternalLink size={12} className="text-brand-500 shrink-0" />
                                            <span className="truncate text-slate-600 dark:text-slate-300 font-medium" title={web.title}>{web.title}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DealsModal;
