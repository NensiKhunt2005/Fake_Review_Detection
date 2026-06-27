"use client";

import React, { useState } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Search,
  Info,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDetect = async () => {
    if (!review.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/api/predict', {
        review_text: review
      });
      setResult(response.data);
    } catch (err) {
      setError('Failed to connect to the backend server. Make sure it is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans text-gray-900">
      <div className="max-w-2xl w-full">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 mb-6"
          >
            <ShieldCheck color="white" size={32} />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-4">Fake Review Detector</h1>
          <p className="text-lg text-gray-500 font-medium">Empower your shopping with AI-driven credibility analysis.</p>
        </header>

        <main className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 ml-1">Manual Analysis</label>
              <textarea
                placeholder="Paste a product review here to analyze its authenticity..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={6}
                className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all text-gray-700 placeholder:text-gray-300"
              />
            </div>

            <button
              onClick={handleDetect}
              disabled={loading || !review.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all ${loading || !review.trim() ? 'bg-gray-200 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-100'}`}
            >
              {loading ? 'Analyzing Neural Patterns...' : 'Analyze Authenticity'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <AlertTriangle size={16} />
              {error}
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mt-8 p-8 rounded-3xl border-2 ${result.prediction === 'Fake' ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}
            >
              <div className="flex items-center gap-3 mb-6">
                {result.prediction === 'Fake' ? (
                  <div className="bg-red-500 p-1.5 rounded-lg"><AlertTriangle color="white" size={20} /></div>
                ) : (
                  <div className="bg-emerald-500 p-1.5 rounded-lg"><CheckCircle color="white" size={20} /></div>
                )}
                <h2 className={`text-xl font-bold ${result.prediction === 'Fake' ? 'text-red-700' : 'text-emerald-700'}`}>
                  {result.prediction === 'Fake' ? 'Suspicious Review' : 'Genuine Review'}
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">AI Confidence</span>
                  <span className="text-2xl font-black">{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-white/50 rounded-full border border-gray-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidence * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${result.prediction === 'Fake' ? 'bg-red-500' : 'bg-emerald-500'}`}
                  ></motion.div>
                </div>
              </div>

              {result.explanation && (
                <div className="mt-8 pt-8 border-t border-gray-200/50">
                  <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 mb-4">
                    <Info size={12} /> Probabilistic Influence
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.explanation).map(([word, score]) => (
                      <span key={word} className={`px-3 py-1 rounded-full text-xs font-bold border transition-all hover:scale-110 cursor-default ${score > 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </main>

        <footer className="mt-12 text-center text-gray-300 text-xs font-bold uppercase tracking-widest">
          &copy; 2026 Fake Review Detection Intelligence
        </footer>
      </div>
    </div>
  );
}
