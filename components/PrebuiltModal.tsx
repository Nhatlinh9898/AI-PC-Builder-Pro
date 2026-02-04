import React from 'react';
import { X, CheckCircle, Cpu, Zap, DollarSign } from 'lucide-react';
import { PREBUILT_CONFIGS, MOCK_PARTS } from '../constants';
import { useBuild } from '../context/BuildContext';
import { PrebuiltConfig } from '../types';
import Button from './ui/Button';

interface PrebuiltModalProps {
  onClose: () => void;
}

const PrebuiltModal: React.FC<PrebuiltModalProps> = ({ onClose }) => {
  const { selectPart, clearBuild, setBuildType } = useBuild();

  const handleSelectBuild = (config: PrebuiltConfig) => {
    // 1. Clear current build
    clearBuild();
    
    // 2. Set Type
    setBuildType(config.type);

    // 3. Find and select parts
    config.partIds.forEach(id => {
      const part = MOCK_PARTS.find(p => p.id === id);
      if (part) {
        selectPart(part);
      }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Market Ready Configs</h2>
             <p className="text-slate-500 text-sm">Pre-optimized builds for every budget and need.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PREBUILT_CONFIGS.map((config) => (
            <div key={config.id} className="group relative bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-brand-500 transition-all hover:shadow-lg">
              <div className="aspect-video bg-slate-200 dark:bg-slate-800 relative">
                <img src={config.image} alt={config.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                   {config.type}
                </div>
              </div>
              
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{config.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10 line-clamp-2">{config.description}</p>
                
                <div className="flex items-center justify-between text-sm mb-4 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                        <DollarSign size={14} className="text-green-500"/>
                        <span className="font-bold">${config.totalPriceEstimate}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                        <Cpu size={14} />
                        <span>{config.partIds.length} Parts</span>
                    </div>
                </div>

                <Button onClick={() => handleSelectBuild(config)} className="w-full">
                    Load This Build
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrebuiltModal;
