import React, { useState, useEffect } from 'react';
import { Layers, ShieldCheck, Sparkles, Database, ArrowRight, Activity, Trash2, GitMerge } from 'lucide-react';
import { fuseProductData, scoreDataConfidence, cleanProductData } from '../../services/geminiService';
import { DataFusionResult, ConfidenceScoreResult, DataCleaningResult } from '../../types';

interface DataPipelineVisualizerProps {
  productName: string;
}

const DataPipelineVisualizer: React.FC<DataPipelineVisualizerProps> = ({ productName }) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [fusion, setFusion] = useState<DataFusionResult | null>(null);
  const [cleaning, setCleaning] = useState<DataCleaningResult | null>(null);
  const [scoring, setScoring] = useState<ConfidenceScoreResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runPipeline = async () => {
      setLoading(true);
      try {
        // Run all 3 modules in parallel for speed in this demo
        const [fRes, cRes, sRes] = await Promise.all([
          fuseProductData(productName),
          cleanProductData(productName),
          scoreDataConfidence(productName)
        ]);
        setFusion(fRes);
        setCleaning(cRes);
        setScoring(sRes);
      } catch (error) {
        console.error("Pipeline Error", error);
      } finally {
        setLoading(false);
      }
    };
    if (productName) runPipeline();
  }, [productName]);

  if (loading) {
    return (
      <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center animate-pulse">
        <Activity className="text-brand-500 animate-spin mb-4" size={32} />
        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Processing Data Pipeline...</div>
        <div className="text-xs text-slate-500 mt-2 flex gap-2">
            <span>Fusion...</span>
            <span>Cleaning...</span>
            <span>Scoring...</span>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, name: 'Data Fusion', icon: GitMerge, color: 'text-blue-500' },
    { id: 2, name: 'Data Cleaning', icon: Sparkles, color: 'text-purple-500' },
    { id: 3, name: 'Confidence Score', icon: ShieldCheck, color: 'text-green-500' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header Pipeline Nav */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-x-auto">
         <div className="flex gap-2">
             {steps.map((step, idx) => (
                 <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                        ${activeStep === step.id 
                            ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white' 
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}
                    `}
                 >
                     <step.icon size={16} className={step.color} />
                     {step.name}
                 </button>
             ))}
         </div>
         <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
             <Database size={12}/> AI Data Pipeline Active
         </div>
      </div>

      {/* Content Area */}
      <div className="p-6 min-h-[300px]">
          
          {/* STEP 1: FUSION */}
          {activeStep === 1 && fusion && (
              <div className="animate-in fade-in slide-in-from-right-4">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <GitMerge className="text-blue-500"/> Multi-Source Data Fusion
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                              <h5 className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400 mb-2">Source Map</h5>
                              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                  <li className="flex justify-between"><span>Specs Source:</span> <span className="font-mono bg-white dark:bg-black/20 px-1 rounded">{fusion.data_fusion.source_map.specs}</span></li>
                                  <li className="flex justify-between"><span>Images Source:</span> <span className="font-mono bg-white dark:bg-black/20 px-1 rounded">{fusion.data_fusion.source_map.images}</span></li>
                                  <li className="flex justify-between"><span>Pricing Source:</span> <span className="font-mono bg-white dark:bg-black/20 px-1 rounded">{fusion.data_fusion.source_map.prices}</span></li>
                              </ul>
                          </div>
                      </div>
                      <div className="space-y-4">
                          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                              <h5 className="text-xs font-bold uppercase text-slate-500 mb-2">Unified Vendors Detected</h5>
                              <div className="flex flex-wrap gap-2">
                                  {fusion.data_fusion.merged_data.vendors.map((v, i) => (
                                      <span key={i} className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-medium">
                                          {v.name}
                                      </span>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* STEP 2: CLEANING */}
          {activeStep === 2 && cleaning && (
              <div className="animate-in fade-in slide-in-from-right-4">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Sparkles className="text-purple-500"/> Data Cleaning & Normalization
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-800">
                          <h5 className="text-xs font-bold uppercase text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                              <Trash2 size={12}/> Garbage Removed
                          </h5>
                          {cleaning.data_cleaning.removed_items.length > 0 ? (
                              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                  {cleaning.data_cleaning.removed_items.map((item, i) => (
                                      <li key={i}>{item}</li>
                                  ))}
                              </ul>
                          ) : (
                              <p className="text-sm italic text-slate-500">No garbage data found.</p>
                          )}
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                          <h5 className="text-xs font-bold uppercase text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2">
                              <ArrowRight size={12}/> Rules Applied
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                              {cleaning.data_cleaning.normalization_rules_applied.map((rule, i) => (
                                  <li key={i}>{rule}</li>
                              ))}
                          </ul>
                      </div>
                  </div>
              </div>
          )}

          {/* STEP 3: SCORING */}
          {activeStep === 3 && scoring && (
              <div className="animate-in fade-in slide-in-from-right-4 text-center">
                  <h4 className="font-bold text-lg mb-6 flex items-center justify-center gap-2">
                      <ShieldCheck className="text-green-500"/> Reliability Assessment
                  </h4>

                  <div className="flex flex-col items-center mb-8">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                              <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-800" />
                              <circle 
                                cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                className={`${scoring.confidence_score.overall_score > 80 ? 'text-green-500' : scoring.confidence_score.overall_score > 50 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                                strokeDasharray={377}
                                strokeDashoffset={377 - (377 * scoring.confidence_score.overall_score) / 100}
                              />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                              <span className="text-3xl font-bold">{scoring.confidence_score.overall_score}</span>
                              <span className="text-xs uppercase font-bold text-slate-500">Score</span>
                          </div>
                      </div>
                      <div className={`mt-2 px-3 py-1 rounded-full text-sm font-bold uppercase ${
                          scoring.confidence_score.label === 'high' ? 'bg-green-100 text-green-700' :
                          scoring.confidence_score.label === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                      }`}>
                          {scoring.confidence_score.label} Confidence
                      </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                       {Object.entries(scoring.confidence_score.scores).map(([key, val]) => (
                           <div key={key} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                               <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">{key}</div>
                               <div className="font-mono font-bold">{val}</div>
                           </div>
                       ))}
                  </div>
                  
                  <div className="mt-6 text-sm text-slate-500 italic max-w-lg mx-auto">
                      "{scoring.confidence_score.reasoning}"
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default DataPipelineVisualizer;