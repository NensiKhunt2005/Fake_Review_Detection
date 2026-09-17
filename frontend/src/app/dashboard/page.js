"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import {
    AlertTriangle,
    CheckCircle,
    Gauge,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Star,
    Users
} from "lucide-react";

const COLORS = {
    genuine: "#059669",
    suspicious: "#dc2626",
    warning: "#d97706",
    ink: "#111827"
};

function decodeHashData() {
    const hash = window.location.hash;
    if (!hash.startsWith("#data=")) return null;
    const encodedData = hash.substring(6);
    const decodedData = decodeURIComponent(escape(atob(encodedData)));
    return JSON.parse(decodedData);
}

function scoreTone(score) {
    if (score >= 7.5) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 5) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-red-700 bg-red-50 border-red-200";
}

function confidenceBucket(confidence) {
    const pct = Math.round(confidence * 100);
    if (pct < 60) return "0-59";
    if (pct < 70) return "60-69";
    if (pct < 80) return "70-79";
    if (pct < 90) return "80-89";
    return "90-100";
}

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [minConfidence, setMinConfidence] = useState(0);

    useEffect(() => {
        try {
            const parsedData = decodeHashData();
            if (parsedData) {
                setData(parsedData);
                localStorage.setItem("lastAnalysis", JSON.stringify(parsedData));
                window.history.replaceState(null, "", window.location.pathname);
                return;
            }
            const lastAnalysis = localStorage.getItem("lastAnalysis");
            if (lastAnalysis) setData(JSON.parse(lastAnalysis));
        } catch (err) {
            console.error("Failed to load analysis data:", err);
        }
    }, []);

    const derived = useMemo(() => {
        if (!data) return null;
        const results = data.results || [];
        const filteredResults = results.filter((review) => {
            const matchesFilter = filter === "All" || review.prediction === filter;
            const matchesSearch = review.review_text.toLowerCase().includes(search.toLowerCase());
            const matchesConfidence = review.confidence * 100 >= minConfidence;
            return matchesFilter && matchesSearch && matchesConfidence;
        });

        const confidenceDistribution = ["0-59", "60-69", "70-79", "80-89", "90-100"].map((bucket) => ({
            bucket,
            count: results.filter((review) => confidenceBucket(review.confidence) === bucket).length
        }));

        const reviewTrend = results.map((review, index) => ({
            index: index + 1,
            suspicious: review.prediction === "Fake" ? 1 : 0
        }));

        return {
            results,
            filteredResults,
            pieData: [
                { name: "Genuine", value: data.genuine_percentage || 0 },
                { name: "Suspicious", value: data.suspicious_percentage || 0 }
            ],
            barData: [
                { name: "Genuine", reviews: data.statistics?.genuine_count || 0 },
                { name: "Suspicious", reviews: data.statistics?.suspicious_count || 0 },
                { name: "High Risk", reviews: data.statistics?.high_confidence_suspicious_count || 0 },
                { name: "Low Conf.", reviews: data.statistics?.low_confidence_count || 0 }
            ],
            confidenceDistribution,
            reviewTrend
        };
    }, [data, filter, search, minConfidence]);

    if (!data || !derived) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <section className="text-center max-w-md">
                    <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin mx-auto" />
                    <h1 className="mt-6 text-xl font-bold text-slate-950">Waiting for analysis results</h1>
                    <p className="mt-2 text-sm text-slate-500">Run the Chrome extension on an Amazon or Flipkart product page.</p>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            <ShieldCheck size={14} />
                            {data.site || "Product page"} analysis
                        </div>
                        <h1 className="max-w-4xl text-2xl font-black tracking-tight sm:text-3xl">{data.product_name || "Product"}</h1>
                        <p className="mt-2 max-w-3xl text-sm text-slate-500">{data.overall_recommendation}</p>
                    </div>
                    <div className={`rounded-lg border px-4 py-3 ${scoreTone(data.trust_score)}`}>
                        <p className="text-xs font-bold uppercase tracking-widest">Trust Score</p>
                        <p className="text-4xl font-black">{data.trust_score}<span className="text-base font-bold">/10</span></p>
                    </div>
                </header>

                <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <SummaryMetric icon={Users} label="Reviews" value={data.total_reviews} />
                    <SummaryMetric icon={CheckCircle} label="Genuine" value={`${data.genuine_percentage}%`} tone="text-emerald-700" />
                    <SummaryMetric icon={AlertTriangle} label="Suspicious" value={`${data.suspicious_percentage}%`} tone="text-red-700" />
                    <SummaryMetric icon={Gauge} label="Avg Confidence" value={`${Math.round((data.average_confidence || 0) * 100)}%`} />
                    <SummaryMetric icon={Star} label="Public Rating" value={data.product_rating ? `${data.product_rating}/5` : "N/A"} />
                </section>

                <section className="mb-6 grid gap-4 lg:grid-cols-3">
                    <ChartPanel title="Review Mix">
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={derived.pieData} dataKey="value" innerRadius={62} outerRadius={88} paddingAngle={3}>
                                    <Cell fill={COLORS.genuine} />
                                    <Cell fill={COLORS.suspicious} />
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    <ChartPanel title="Review Statistics">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={derived.barData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="reviews" fill={COLORS.ink} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    <ChartPanel title="Confidence Distribution">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={derived.confidenceDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill={COLORS.genuine} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartPanel>
                </section>

                <section className="mb-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <ChartPanel title="Suspicious Review Trend">
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={derived.reviewTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                                <YAxis ticks={[0, 1]} />
                                <Tooltip />
                                <Line type="monotone" dataKey="suspicious" stroke={COLORS.suspicious} strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    <section className="rounded-lg border border-slate-200 bg-white p-5">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-black">
                            <Sparkles size={18} className="text-amber-600" />
                            Top Risk Indicators
                        </h2>
                        <div className="space-y-2">
                            {(data.risk_indicators || []).map((risk) => (
                                <div key={risk} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                                    {risk}
                                </div>
                            ))}
                        </div>
                    </section>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-black">
                                <SlidersHorizontal size={20} className="text-slate-500" />
                                Review Analysis
                            </h2>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search reviews"
                                        className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 sm:w-64"
                                    />
                                </div>
                                <select
                                    value={filter}
                                    onChange={(event) => setFilter(event.target.value)}
                                    className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-emerald-500"
                                >
                                    <option>All</option>
                                    <option>Genuine</option>
                                    <option>Fake</option>
                                </select>
                                <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600">
                                    Min confidence
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={minConfidence}
                                        onChange={(event) => setMinConfidence(Number(event.target.value))}
                                    />
                                    {minConfidence}%
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px] text-left">
                            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">Review Text</th>
                                    <th className="px-5 py-3">Prediction</th>
                                    <th className="px-5 py-3">Confidence</th>
                                    <th className="px-5 py-3">Explanation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {derived.filteredResults.map((review, index) => (
                                    <tr key={`${review.review_text}-${index}`} className="align-top">
                                        <td className="max-w-xl px-5 py-4 text-sm leading-6 text-slate-700">{review.review_text}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${review.prediction === "Fake" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                                                {review.prediction === "Fake" ? <AlertTriangle size={13} /> : <CheckCircle size={13} />}
                                                {review.prediction === "Fake" ? "Suspicious" : "Genuine"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-mono text-sm font-black">{(review.confidence * 100).toFixed(1)}%</div>
                                            <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={review.prediction === "Fake" ? "h-full bg-red-600" : "h-full bg-emerald-600"}
                                                    style={{ width: `${review.confidence * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="max-w-sm space-y-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(review.highlighted_words || []).slice(0, 6).map((word) => (
                                                        <span key={word} className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{word}</span>
                                                    ))}
                                                </div>
                                                {(review.reasons || []).slice(0, 2).map((reason) => (
                                                    <p key={reason} className="text-xs leading-5 text-slate-500">{reason}</p>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}

function SummaryMetric({ icon: Icon, label, value, tone = "text-slate-950" }) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                <Icon size={18} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
        </section>
    );
}

function ChartPanel({ title, children }) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-black text-slate-800">{title}</h2>
            {children}
        </section>
    );
}
