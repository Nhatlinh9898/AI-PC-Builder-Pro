import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PC_TYPE } from '../types';
import { useBuild } from '../context/BuildContext';
import { Monitor, Gamepad2, Briefcase, Server, Network } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { setBuildType, clearBuild } = useBuild();

  const handleSelect = (type: PC_TYPE) => {
    clearBuild();
    setBuildType(type);
    navigate('/builder');
  };

  const cards = [
    { type: PC_TYPE.OFFICE, icon: Monitor, desc: "Efficient, budget-friendly builds for productivity.", color: "bg-blue-500" },
    { type: PC_TYPE.GAMING, icon: Gamepad2, desc: "High performance for AAA titles and high refresh rates.", color: "bg-purple-600" },
    { type: PC_TYPE.WORKSTATION, icon: Briefcase, desc: "Power for rendering, AI training, and editing.", color: "bg-orange-500" },
    { type: PC_TYPE.SERVER, icon: Server, desc: "Reliable 24/7 operation, ECC memory, and storage focus.", color: "bg-green-600" }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600">
          Build Your Dream Machine
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Select your purpose. Let AI optimize compatibility and price.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-12">
        {cards.map((card) => (
          <button
            key={card.type}
            onClick={() => handleSelect(card.type)}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-8 text-left shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl border border-slate-200 dark:border-slate-800"
          >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
               <card.icon size={120} />
            </div>
            
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${card.color} text-white mb-6 shadow-lg`}>
              <card.icon size={24} />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{card.type}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {card.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Admin / Architect Link */}
      <button 
        onClick={() => navigate('/architect')}
        className="flex items-center gap-2 text-slate-500 hover:text-brand-600 transition-colors bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm"
      >
          <Network size={16} /> Open Product Architect Tool
      </button>
    </div>
  );
};

export default Home;