import React, { useEffect, useState } from 'react';
import { useBuild } from '../context/BuildContext';
import { Part } from '../types';
import { analyzePriceTrend, checkPriceDrop } from '../services/geminiService';
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Bell, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Button from '../components/ui/Button';

// Types for Dashboard State
interface ComponentStatus {
  id: string;
  name: string;
  currentPrice: number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
  alert?: string;
  history: { date: string, price: number }[];
  prediction7d: string;
}

const PriceDashboard: React.FC = () => {
  const { build } = useBuild();
  const [data, setData] = useState<ComponentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  // Filter parts from the current build
  const parts = Object.values(build.parts) as Part[];

  const refreshDashboard = async () => {
    if (parts.length === 0) return;
    setLoading(true);
    setData([]);

    const results: ComponentStatus[] = [];

    // Analyze each part in parallel (limit concurrency in real app, but fine here)
    await Promise.all(parts.map(async (part) => {
        try {
            // Run Trend Analysis (Module 3)
            const trendData = await analyzePriceTrend(part.name);
            // Run Price Drop Alert (Module 2)
            const alertData = await checkPriceDrop(part.name, part.price);

            if (trendData && trendData.price_trend_analysis) {
                const analysis = trendData.price_trend_analysis;
                const alert = alertData?.price_drop_alert;

                results.push({
                    id: part.id,
                    name: part.name,
                    currentPrice: part.price, // In real app, update with alertData.new_price
                    trend: analysis.trend,
                    recommendation: analysis.recommendation,
                    alert: alert?.alert_triggered ? `Price dropped by ${alert.drop_percent}!` : undefined,
                    history: analysis.history,
                    prediction7d: analysis.predicted_price_7d
                });
            }
        } catch (e) {
            console.error(`Failed to analyze ${part.name}`, e);
        }
    }));

    setData(results);
    if (results.length > 0) setSelectedPartId(results[0].id);
    setLoading(false);
  };

  useEffect(() => {
    refreshDashboard();
  }, []); // Run once on mount

  const selectedData = data.find(d => d.id === selectedPartId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 flex flex-col">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
            <Link to="/builder" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full">
                <ArrowLeft size={24} />
            </Link>
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    Price Intelligence Dashboard <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded uppercase font-bold">Live</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400">Real-time tracking for your {build.type} Build</p>
            </div>
        </div>
        <Button onClick={refreshDashboard} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            {loading ? 'Analyzing Market...' : 'Refresh Data'}
        </Button>
      </header>

      {parts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl m-4">
              <p className="text-xl font-medium mb-4">No parts selected in your build.</p>
              <Link to="/builder">
                  <Button>Go to Builder</Button>
              </Link>
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            
            {/* Left Col: Part List & Status */}
            <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[80vh]">
                {loading && data.length === 0 && (
                    <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                        <p>AI Agents are scanning global pricing...</p>
                    </div>
                )}
                
                {data.map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => setSelectedPartId(item.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedPartId === item.id 
                            ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 ring-1 ring-brand-500' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-300'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-sm line-clamp-1" title={item.name}>{item.name}</h3>
                            {item.alert && (
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                    <Bell size={10} /> ALERT
                                </span>
                            )}
                        </div>
                        
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="text-2xl font-bold">${item.currentPrice}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                    Trend: 
                                    <span className={`font-bold flex items-center ${
                                        item.trend === 'up' ? 'text-red-500' : item.trend === 'down' ? 'text-green-500' : 'text-slate-500'
                                    }`}>
                                        {item.trend === 'up' && <TrendingUp size={12} className="mr-0.5"/>}
                                        {item.trend === 'down' && <TrendingDown size={12} className="mr-0.5"/>}
                                        {item.trend === 'stable' && <Minus size={12} className="mr-0.5"/>}
                                        {item.trend.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                                item.recommendation.toLowerCase().includes('buy') 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-orange-50 text-orange-700 border-orange-200'
                            }`}>
                                {item.recommendation}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Right Col: Detailed Analysis & Charts */}
            <div className="lg:col-span-2 space-y-6">
                {selectedData ? (
                    <>
                        {/* Prediction Banner */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                 <div className="text-sm text-slate-500 mb-1">Current Price</div>
                                 <div className="text-3xl font-bold">${selectedData.currentPrice}</div>
                             </div>
                             <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-3 opacity-10"><TrendingUp size={64}/></div>
                                 <div className="text-sm text-slate-500 mb-1">7-Day Prediction</div>
                                 <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">{selectedData.prediction7d}</div>
                             </div>
                             <div className={`p-6 rounded-xl border shadow-sm ${
                                 selectedData.trend === 'down' ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-slate-50 border-slate-200 dark:bg-slate-800'
                             }`}>
                                 <div className="text-sm text-slate-500 mb-1">AI Verdict</div>
                                 <div className="text-lg font-bold leading-tight">{selectedData.recommendation}</div>
                             </div>
                        </div>

                        {/* Main Chart */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-96">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <TrendingUp size={20} className="text-brand-500" />
                                6-Month Price History & Trend
                            </h3>
                            
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={selectedData.history}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#64748b" 
                                        tick={{fontSize: 12}}
                                        tickMargin={10}
                                    />
                                    <YAxis 
                                        stroke="#64748b" 
                                        tick={{fontSize: 12}}
                                        tickFormatter={(val) => `$${val}`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                                        itemStyle={{ color: '#38bdf8' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="price" 
                                        stroke="#0ea5e9" 
                                        strokeWidth={3}
                                        dot={{ fill: '#0ea5e9', r: 4 }}
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
                        <p className="text-slate-400">Select a component to view detailed trends</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default PriceDashboard;