import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldQuestion, Info } from 'lucide-react';

interface DataStatusBadgeProps {
  confidence: string; // 'High' | 'Medium' | 'Low'
  missingFields: string[];
  fallbackUsed: boolean;
}

const DataStatusBadge: React.FC<DataStatusBadgeProps> = ({ confidence, missingFields, fallbackUsed }) => {
  let color = "bg-slate-100 text-slate-700 border-slate-200";
  let Icon = ShieldQuestion;
  let label = "Unknown Status";

  if (confidence === 'High') {
    color = "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800";
    Icon = ShieldCheck;
    label = "Verified Data";
  } else if (confidence === 'Medium') {
    color = "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800";
    Icon = Info;
    label = "Partial Data";
  } else {
    color = "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800";
    Icon = ShieldAlert;
    label = "Incomplete Data";
  }

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-lg border ${color} text-xs`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                <Icon size={14} /> {label}
            </div>
            {fallbackUsed && (
                <span className="px-1.5 py-0.5 bg-white dark:bg-black/20 rounded border border-current text-[10px]">
                    AI Fallback Used
                </span>
            )}
        </div>
        
        {missingFields.length > 0 && (
            <div className="mt-1 pt-2 border-t border-black/10 dark:border-white/10">
                <p className="font-semibold mb-1 opacity-80">Missing info detected:</p>
                <div className="flex flex-wrap gap-1">
                    {missingFields.map((field, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded">
                            {field.replace(/_/g, ' ')}
                        </span>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default DataStatusBadge;