import React, { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Minus, Sparkles, Loader2, MessageSquareQuote } from 'lucide-react';
import { ReviewAnalysis } from '../../types';
import { analyzeProductReviews } from '../../services/geminiService';

interface ReviewSummaryProps {
  productName: string;
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({ productName }) => {
  const [data, setData] = useState<ReviewAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await analyzeProductReviews(productName);
        if (result) {
          setData(result);
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productName]);

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mb-3 text-brand-500" size={32} />
        <p className="text-sm font-medium">AI is reading reviews across the web...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm border border-dashed rounded-lg">
        Could not retrieve review data.
      </div>
    );
  }

  const { review_ai } = data;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-purple-500" />
              AI Review Consensus
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Aggregated from Amazon, Reddit, and Tech sites.</p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
             <div className="text-right">
                 <div className="text-[10px] uppercase text-slate-500 font-bold">Consensus</div>
                 <div className="font-bold text-xl leading-none text-slate-900 dark:text-white">{review_ai.average_rating}</div>
             </div>
             <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
             <div className="text-2xl">⭐</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Pros & Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pros */}
          <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-100 dark:border-green-800/50">
            <h4 className="font-bold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
              <ThumbsUp size={16} /> The Good
            </h4>
            <ul className="space-y-2">
              {review_ai.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-green-500 mt-1">•</span> {pro}
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-800/50">
            <h4 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
              <ThumbsDown size={16} /> The Bad
            </h4>
            <ul className="space-y-2">
              {review_ai.cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-red-500 mt-1">•</span> {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Summary Block */}
        <div className="relative bg-slate-50 dark:bg-slate-700/30 p-5 rounded-xl border border-slate-200 dark:border-slate-700 italic text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            <MessageSquareQuote className="absolute top-2 left-2 text-slate-300 dark:text-slate-600 -z-0 opacity-20" size={48} />
            <span className="relative z-10">{review_ai.summary}</span>
        </div>

        {/* Recommendation */}
        <div className="flex items-start gap-3 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-l-4 border-purple-500">
            <div className="min-w-fit mt-0.5">
                <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
                <h5 className="font-bold text-sm text-purple-900 dark:text-purple-100 mb-1">Our Verdict</h5>
                <p className="text-sm text-purple-800 dark:text-purple-200">{review_ai.recommendation}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;