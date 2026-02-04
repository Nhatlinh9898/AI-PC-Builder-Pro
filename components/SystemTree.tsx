import React, { useState } from 'react';
import { PART_CATEGORY, Part } from '../types';
import { useBuild } from '../context/BuildContext';
import { Cpu, HardDrive, Monitor, Box, Zap, CircuitBoard, Snowflake, Layers, Network } from 'lucide-react';
import PartDetailModal from './PartDetailModal';

// Helper to get icon for category
const getIcon = (cat: PART_CATEGORY) => {
    switch(cat) {
        case PART_CATEGORY.CPU: return <Cpu size={20} />;
        case PART_CATEGORY.GPU: return <Layers size={20} />;
        case PART_CATEGORY.MAINBOARD: return <CircuitBoard size={20} />;
        case PART_CATEGORY.RAM: return <div className="font-mono font-bold text-xs border border-current px-1 rounded">RAM</div>;
        case PART_CATEGORY.STORAGE: return <HardDrive size={20} />;
        case PART_CATEGORY.PSU: return <Zap size={20} />;
        case PART_CATEGORY.CASE: return <Box size={20} />;
        case PART_CATEGORY.COOLER: return <Snowflake size={20} />;
        case PART_CATEGORY.MONITOR: return <Monitor size={20} />;
        case PART_CATEGORY.NIC: return <Network size={20} />;
        default: return <Box size={20} />;
    }
};

const Node: React.FC<{ 
    label: string, 
    category?: PART_CATEGORY, 
    part?: Part, 
    children?: React.ReactNode,
    isRoot?: boolean
}> = ({ label, category, part, children, isRoot }) => {
    const [showDetail, setShowDetail] = useState(false);

    // Determines style based on if a part is actually selected for this slot
    const hasPart = !!part;
    const statusColor = hasPart 
        ? "border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-md" 
        : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 border-dashed";

    return (
        <div className="flex flex-col items-center">
            <div 
                className={`
                    relative z-10 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer hover:scale-105 w-40
                    ${statusColor}
                    ${isRoot ? 'w-48 border-4 border-slate-800 dark:border-slate-200' : ''}
                `}
                onClick={() => setShowDetail(true)}
            >
                <div className={`mb-2 ${hasPart ? 'text-brand-600 dark:text-brand-400' : ''}`}>
                    {category ? getIcon(category) : <Box />}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider mb-1">{label}</span>
                {part ? (
                    <span className="text-[10px] text-center leading-tight line-clamp-2 font-medium">{part.name}</span>
                ) : (
                    <span className="text-[10px] italic opacity-70">Empty Slot</span>
                )}
                {part && <span className="mt-1 text-xs font-bold text-green-600">${part.price}</span>}
            </div>

            {/* Connector Line */}
            {children && (
                <div className="flex flex-col items-center w-full">
                    <div className="h-6 w-0.5 bg-slate-300 dark:bg-slate-700"></div>
                    <div className="flex justify-center gap-4 relative pt-6 border-t-2 border-slate-300 dark:border-slate-700 w-full px-4">
                         {/* Vertical connectors for children (using absolute positioning logic implicitly via flex alignment) */}
                         {React.Children.map(children, (child) => (
                             <div className="flex flex-col items-center relative -top-6 pt-6">
                                {child}
                             </div>
                         ))}
                    </div>
                </div>
            )}

            <PartDetailModal 
                part={part || null} 
                categoryName={category}
                onClose={() => setShowDetail(false)} 
            />
        </div>
    );
};

const SystemTree: React.FC = () => {
    const { build } = useBuild();
    const p = build.parts;

    return (
        <div className="w-full overflow-x-auto p-10 flex justify-center bg-slate-100 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 min-h-[600px]">
            {/* Tree Structure Definition */}
            
            {/* Root: CASE */}
            <Node label="Chassis (Case)" category={PART_CATEGORY.CASE} part={p[PART_CATEGORY.CASE]} isRoot>
                
                {/* Branch 1: Power */}
                <Node label="Power Supply" category={PART_CATEGORY.PSU} part={p[PART_CATEGORY.PSU]} />

                {/* Branch 2: Motherboard (Hub) */}
                <Node label="Motherboard" category={PART_CATEGORY.MAINBOARD} part={p[PART_CATEGORY.MAINBOARD]}>
                    
                    {/* CPU Sub-tree */}
                    <Node label="CPU" category={PART_CATEGORY.CPU} part={p[PART_CATEGORY.CPU]}>
                         <Node label="Cooler" category={PART_CATEGORY.COOLER} part={p[PART_CATEGORY.COOLER]} />
                    </Node>

                    {/* RAM */}
                    <Node label="RAM" category={PART_CATEGORY.RAM} part={p[PART_CATEGORY.RAM]} />

                    {/* GPU */}
                    <Node label="Graphics Card" category={PART_CATEGORY.GPU} part={p[PART_CATEGORY.GPU]}>
                         <Node label="Monitor" category={PART_CATEGORY.MONITOR} part={p[PART_CATEGORY.MONITOR]} />
                    </Node>

                    {/* Storage */}
                    <Node label="Storage" category={PART_CATEGORY.STORAGE} part={p[PART_CATEGORY.STORAGE]} />

                    {/* Network (If Server) */}
                    {(build.type === 'Server' || p[PART_CATEGORY.NIC]) && (
                        <Node label="Network Card" category={PART_CATEGORY.NIC} part={p[PART_CATEGORY.NIC]} />
                    )}

                </Node>
            </Node>
        </div>
    );
};

export default SystemTree;
