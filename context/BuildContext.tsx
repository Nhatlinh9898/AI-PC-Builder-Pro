import React, { createContext, useContext, useState, useEffect } from 'react';
import { Build, Part, PART_CATEGORY, PC_TYPE, CompatibilityIssue } from '../types';
import { checkCompatibility } from '../utils/compatibility';

interface BuildContextType {
  build: Build;
  setBuildType: (type: PC_TYPE) => void;
  selectPart: (part: Part) => void;
  removePart: (category: PART_CATEGORY) => void;
  setFullBuild: (buildData: Partial<Build>) => void; // New method
  compatibilityIssues: CompatibilityIssue[];
  clearBuild: () => void;
}

const initialBuild: Build = {
  parts: {},
  type: PC_TYPE.GAMING,
  totalPrice: 0,
  totalWattage: 0
};

const BuildContext = createContext<BuildContextType | undefined>(undefined);

export const BuildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [build, setBuild] = useState<Build>(initialBuild);
  const [compatibilityIssues, setCompatibilityIssues] = useState<CompatibilityIssue[]>([]);

  // Recalculate totals and compatibility whenever parts change
  useEffect(() => {
    const parts = Object.values(build.parts) as Part[];
    const totalPrice = parts.reduce((sum, p) => sum + p.price, 0);
    const totalWattage = parts.reduce((sum, p) => sum + (p.specs.wattage || 0), 0);

    // Keep AI reasoning if it exists, don't overwrite it unless explicitly changed
    const updatedBuild = { 
        ...build, 
        totalPrice, 
        totalWattage 
    };
    
    if(totalPrice !== build.totalPrice || totalWattage !== build.totalWattage) {
        setBuild(updatedBuild);
    }
    
    setCompatibilityIssues(checkCompatibility(updatedBuild));
  }, [build.parts, build.type]);

  const setBuildType = (type: PC_TYPE) => {
    setBuild(prev => ({ ...prev, type }));
  };

  const selectPart = (part: Part) => {
    setBuild(prev => ({
      ...prev,
      parts: {
        ...prev.parts,
        [part.category]: part
      }
    }));
  };

  const removePart = (category: PART_CATEGORY) => {
    const newParts = { ...build.parts };
    delete newParts[category];
    setBuild(prev => ({ ...prev, parts: newParts }));
  };

  // Allow setting the entire build at once (for AI Auto-Build)
  const setFullBuild = (buildData: Partial<Build>) => {
      setBuild(prev => ({
          ...prev,
          ...buildData,
          parts: buildData.parts || prev.parts
      }));
  };

  const clearBuild = () => {
    setBuild({ ...initialBuild, type: build.type });
  };

  return (
    <BuildContext.Provider value={{ build, setBuildType, selectPart, removePart, setFullBuild, compatibilityIssues, clearBuild }}>
      {children}
    </BuildContext.Provider>
  );
};

export const useBuild = () => {
  const context = useContext(BuildContext);
  if (!context) throw new Error("useBuild must be used within a BuildProvider");
  return context;
};