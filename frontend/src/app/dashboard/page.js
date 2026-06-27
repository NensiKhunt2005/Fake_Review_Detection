"use client";

import React, { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
    ShieldCheck,
    AlertTriangle,
    Info,
    Filter,
    ArrowLeft,
    TrendingUp,
    Users
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        // 1. Check URL hash for data (passed from extension)
        const hash = window.location.hash;
        if (hash.startsWith('#data=')) {
            try {
                const encodedData = hash.substring(6);
                const decodedData = decodeURIComponent(escape(atob(encodedData)));
                const parsedData = JSON.parse(decodedData);
                setData(parsedData);
                // Save to localStorage for persistence on refresh
                localStorage.setItem('lastAnalysis', decodedData);
                // Clear hash for clean URL
                window.history.replaceState(null, '', window.location.pathname);
                return;
            } catch (err) {
                console.error("Failed to parse hash data:", err);
            }
        }

        // 2. Fallback to localStorage
        const lastAnalysis = localStorage.getItem('lastAnalysis');
        if (lastAnalysis) {
            setData(JSON.parse(lastAnalysis));
        }
    }, []);

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Waiting for analysis results...</p>
                    <p className="text-sm text-gray-400 mt-2">Run the detector on a product page first.</p>
                </div>
            </div>
        );
    }

    const COLORS = ['#10b981', '#ef4444'];
    const pieData = [
        { name: 'Genuine', value: data.genuine_percentage },
        { name: 'Suspicious', value: data.suspicious_percentage }
    ];

    const filteredResults = data.results.filter(res => {
        if (filter === 'All') return true;
        return res.prediction === filter;
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-900">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Analysis Dashboard</h1>
                    <p className="text-gray-500 mt-1">Detailed review credibility report</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                        <Users className="text-indigo-500" size={18} />
                        <span className="font-semibold">{data.total_reviews}</span>
                        <span className="text-gray-400 text-sm">Analyzed</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Trust Score Hero Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-1 bg-white rounded-3xl p-8 shadow-xl shadow-indigo-100/50 border border-indigo-50 flex flex-col items-center justify-center text-center"
                >
                    <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-6">Product Trust Score</h3>
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <div className={`absolute inset-0 rounded-full border-[12px] ${data.trust_score >= 7 ? 'border-emerald-500' : data.trust_score >= 4 ? 'border-amber-500' : 'border-red-500'} opacity-10`}></div>
                        <div className="text-center">
                            <span className="text-6xl font-black block leading-none">{data.trust_score}</span>
                            <span className="text-gray-400 font-bold uppercase text-sm">/ 10</span>
                        </div>
                    </div>
                    <div className={`mt-6 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${data.trust_score >= 7 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {data.trust_score >= 7 ? 'Reliable Product' : 'Caution Advised'}
                    </div>
                </motion.div>

                {/* Distribution Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-500" />
                            Review Distribution
                        </h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Analysis Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="max-w-7xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-indigo-500" />
                        Detailed Analysis
                    </h3>
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
                        {['All', 'Genuine', 'Fake'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === type ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Review Preview</th>
                                <th className="px-6 py-4">AI Prediction</th>
                                <th className="px-6 py-4 text-right">Confidence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredResults.map((res, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 max-w-lg">
                                        <div className="text-sm font-medium text-gray-900 mb-2">
                                            "{res.review_text.substring(0, 160)}..."
                                        </div>
                                        {res.explanation && (
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(res.explanation).slice(0, 5).map(([word, score]) => (
                                                    <span key={word} className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${score > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${res.prediction === 'Fake' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {res.prediction === 'Fake' ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                                            {res.prediction}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-sm font-mono font-bold">{(res.confidence * 100).toFixed(1)}%</div>
                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-2 ml-auto overflow-hidden">
                                            <div className={`h-full ${res.prediction === 'Fake' ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${res.confidence * 100}%` }}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
