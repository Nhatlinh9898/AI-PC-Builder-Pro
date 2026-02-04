import React, { useState } from 'react';
import { Sparkles, Loader2, X, ArrowRight, ArrowLeft, Wand2, ListChecks, CheckCircle2, Target, Wallet, Cpu } from 'lucide-react';
import Button from './ui/Button';
import { getBuildSuggestion, analyzeUserRequest, generateBuildFromAnalysis } from '../services/geminiService';
import { useBuild } from '../context/BuildContext';
import { MOCK_PARTS } from '../constants';
import { PART_CATEGORY, PC_TYPE, Part, UserRequirementAnalysis } from '../types';

const STEPS = [
  {
    id: 'usage',
    title: 'Primary Usage',
    options: ['Gaming', 'Video Editing', '3D Rendering', 'Office/Coding', 'Streaming']
  },
  {
    id: 'resolution',
    title: 'Target Resolution',
    options: ['1080p', '1440p (2K)', '4K', 'Not Sure/Other']
  },
  {
    id: 'aesthetics',
    title: 'Aesthetics Preference',
    options: ['No Preference', 'RGB Heavy', 'Minimalist Black', 'All White', 'Silent']
  }
];

const AIAdvisor: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { build, selectPart, setFullBuild } = useBuild();
  const [mode, setMode] = useState<'wizard' | 'magic'>('magic'); // Default to Magic mode
  
  // Wizard State
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [budget, setBudget] = useState(1500);

  // Magic State
  const [userPrompt, setUserPrompt] = useState('');
  const [analysis, setAnalysis] = useState<UserRequirementAnalysis | null>(null);

  // Shared State
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>(''); // 'analyzing' | 'building'
  const [suggestion, setSuggestion] = useState<any>(null);

  if (!isOpen) return null;

  const handleAnswer = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (step < STEPS.length) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  // Handler for Wizard Mode
  const handleGenerateWizard = async () => {
    setLoading(true);
    setLoadingStep('building');
    try {
      const detailedReqs = `
        Primary Use: ${answers['usage'] || 'General'};
        Resolution Target: ${answers['resolution'] || '1080p'};
        Aesthetics: ${answers['aesthetics'] || 'None'};
        Standard Requirements: Balanced build, high reliability.
      `;
      const result = await getBuildSuggestion(budget, build.type, detailedReqs);
      setSuggestion({ ...result, type: 'suggestion' });
    } catch (e) {
      alert("Failed to get suggestion.");
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Handler for Magic Mode (Two-Step: Analyze -> Build)
  const handleMagicBuild = async () => {
    if(!userPrompt.trim()) return;
    setLoading(true);
    setAnalysis(null);
    setSuggestion(null);

    try {
        // Step 1: Analyze Requirements
        setLoadingStep('analyzing');
        const analysisResult = await analyzeUserRequest(userPrompt);
        setAnalysis(analysisResult);

        // Step 2: Generate Build
        setLoadingStep('building');
        const buildResult = await generateBuildFromAnalysis(analysisResult);
        setSuggestion({ ...buildResult, type: 'full_build' });

    } catch (e) {
        alert("Failed to generate build. Please try again.");
    } finally {
        setLoading(false);
        setLoadingStep('');
    }
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    
    if (suggestion.type === 'suggestion') {
        // Wizard Logic: Try to match Mock Parts
        suggestion.parts.forEach((sPart: any) => {
            const category = sPart.category.toUpperCase() as PART_CATEGORY;
            const match = MOCK_PARTS.find(p => 
                p.category === category && 
                (p.name.toLowerCase().includes(sPart.name.toLowerCase()) || 
                 (Math.abs(p.price - sPart.estimatedPrice) < 50))
            );
            if (match) selectPart(match);
        });
    } else if (suggestion.type === 'full_build') {
        // Magic Logic: Create objects from AI data even if not in Mock
        const newParts: Partial<Record<PART_CATEGORY, Part>> = {};
        
        suggestion.parts.forEach((aiPart: any) => {
            const cat = aiPart.category as PART_CATEGORY;
            const newPart: Part = {
                id: `ai-${Date.now()}-${Math.random()}`,
                name: aiPart.name,
                category: cat,
                price: aiPart.price,
                brand: aiPart.brand || "Generic",
                image: `https://placehold.co/200x200?text=${cat}`, // Placeholder
                specs: aiPart.specs || {},
                rating: 5,
                vendors: [{ name: "Search Online", url: `https://www.google.com/search?q=${encodeURIComponent(aiPart.name)}`, price: aiPart.price }]
            };
            newParts[cat] = newPart;
        });

        setFullBuild({
            parts: newParts,
            type: suggestion.type as PC_TYPE,
            aiReasoning: suggestion.reasoning
        });
    }

    onClose();
  };

  const reset = () => {
      setStep(0);
      setAnswers({});
      setSuggestion(null);
      setAnalysis(null);
      setUserPrompt('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-brand-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            {mode === 'magic' ? <Wand2 size={24} /> : <ListChecks size={24} />}
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {suggestion ? 'AI Analysis Result' : mode === 'magic' ? 'Auto-Build Architect' : 'Guided Builder'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={24} />
          </button>
        </div>

        {/* Mode Toggle (Only if no result yet) */}
        {!suggestion && !loading && !analysis && (
            <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button 
                    onClick={() => setMode('magic')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'magic' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50 dark:bg-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Wand2 size={16} className="inline mr-2"/> Magic Input
                </button>
                <button 
                    onClick={() => setMode('wizard')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'wizard' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50 dark:bg-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ListChecks size={16} className="inline mr-2"/> Step-by-Step
                </button>
            </div>
        )}

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="animate-spin h-12 w-12 text-brand-500"/>
                <p className="text-lg font-medium animate-pulse text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-600">
                    {loadingStep === 'analyzing' ? 'Parsing your requirements...' : 'Constructing your perfect machine...'}
                </p>
                {analysis && (
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                         <CheckCircle2 size={14} className="text-green-500"/> Analysis Complete
                    </div>
                )}
             </div>
          ) : !suggestion ? (
            /* Input Modes */
            <>
                {mode === 'magic' ? (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-4">
                        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800/30">
                            <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-1">Describe your dream PC</h3>
                            <p className="text-xs text-purple-700 dark:text-purple-300">
                                E.g., "I need a white gaming PC for 1440p COD Warzone, budget $2000" or "Home server with Dual Xeon for AI Model Training".
                            </p>
                        </div>
                        <textarea
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            placeholder="Type your requirements here..."
                            className="w-full h-40 p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none shadow-inner"
                        />
                    </div>
                ) : (
                    /* Wizard Mode */
                    <div className="space-y-6">
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                                className="bg-brand-500 h-full transition-all duration-300" 
                                style={{ width: `${((step) / (STEPS.length + 1)) * 100}%` }}
                            />
                        </div>

                        {step === 0 && (
                            <div className="animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-lg font-semibold mb-4">What is your total budget?</h3>
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-bold text-brand-600">${budget}</span>
                                    <input 
                                        type="range" 
                                        min="500" max="5000" step="100" 
                                        value={budget} 
                                        onChange={(e) => setBudget(Number(e.target.value))}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-brand-500"
                                    />
                                </div>
                            </div>
                        )}

                        {STEPS.map((s, idx) => (
                            step === idx + 1 && (
                                <div key={s.id} className="animate-in fade-in slide-in-from-right-4">
                                    <h3 className="text-lg font-semibold mb-4">{s.title}</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {s.options.map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => handleAnswer(s.id, opt)}
                                                className={`p-3 rounded-lg border text-sm font-medium transition-all
                                                    ${answers[s.id] === opt 
                                                        ? 'bg-brand-100 border-brand-500 text-brand-700 ring-1 ring-brand-500' 
                                                        : 'border-slate-200 hover:bg-slate-50'}
                                                `}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </>
          ) : (
            /* Results Mode */
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              
              {/* Analysis Recap Block */}
              {analysis && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800/50 flex items-center gap-2">
                          <Target size={16} className="text-blue-500"/>
                          <div>
                              <div className="text-[10px] text-slate-500 uppercase font-bold">Type</div>
                              <div className="text-sm font-semibold capitalize">{analysis.machine_type}</div>
                          </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-800/50 flex items-center gap-2">
                          <Wallet size={16} className="text-green-500"/>
                          <div>
                              <div className="text-[10px] text-slate-500 uppercase font-bold">Budget</div>
                              <div className="text-sm font-semibold">
                                  {analysis.budget.amount === 'unknown' ? 'Flexible' : `${analysis.budget.amount} ${analysis.budget.currency}`}
                              </div>
                          </div>
                      </div>
                      <div className="col-span-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                          <Cpu size={16} className="text-slate-500 mt-1"/>
                          <div>
                               <div className="text-[10px] text-slate-500 uppercase font-bold">Focus</div>
                               <div className="text-xs text-slate-700 dark:text-slate-300">
                                   {analysis.usage.slice(0,3).join(', ')} • {analysis.performance_priority.join(', ')}
                               </div>
                          </div>
                      </div>
                  </div>
              )}

              <div className="bg-brand-50 dark:bg-brand-900/30 p-4 rounded-xl border border-brand-100 dark:border-brand-800/50">
                <h3 className="font-semibold text-brand-700 dark:text-brand-300 mb-2 flex items-center gap-2">
                    <Sparkles size={16}/> Architect's Notes
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">"{suggestion.reasoning}"</p>
              </div>
              
              <h4 className="font-bold text-sm uppercase text-slate-500 tracking-wider mt-4">Configuration List</h4>
              <ul className="space-y-2">
                {suggestion.parts.map((p: any, i: number) => (
                    <li key={i} className="flex justify-between items-center text-sm p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                            <span className="font-medium">{p.category}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-slate-900 dark:text-slate-100">{p.name}</div>
                            <div className="text-xs text-slate-500">~${p.estimatedPrice || p.price}</div>
                        </div>
                    </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl flex justify-between items-center">
            {!suggestion ? (
                <>
                    {mode === 'magic' ? (
                         <div className="flex justify-end w-full gap-3">
                             <Button variant="ghost" onClick={onClose}>Cancel</Button>
                             <Button 
                                onClick={handleMagicBuild} 
                                disabled={!userPrompt.trim()}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none"
                             >
                                <Wand2 size={16} className="mr-2"/> Generate Build
                             </Button>
                         </div>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={step === 0 ? onClose : prevStep} disabled={loading}>
                                {step === 0 ? 'Cancel' : <><ArrowLeft size={16} className="mr-1"/> Back</>}
                            </Button>
                            
                            {step < STEPS.length ? (
                                <Button onClick={nextStep} disabled={!answers[STEPS[step-1]?.id] && step !== 0}>
                                    Next <ArrowRight size={16} className="ml-1"/>
                                </Button>
                            ) : (
                                <Button onClick={handleGenerateWizard} className="bg-brand-600 text-white">
                                    <Sparkles size={16} className="mr-2"/> Analyze
                                </Button>
                            )}
                        </>
                    )}
                </>
            ) : (
                <>
                    <Button variant="secondary" onClick={reset}>Start Over</Button>
                    <Button onClick={applySuggestion} className="bg-green-600 hover:bg-green-700 text-white">Apply This Config</Button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;