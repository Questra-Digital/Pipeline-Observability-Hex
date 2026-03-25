"use client";
import React, { useMemo, useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart, Line, ScatterChart, Scatter, ZAxis
} from "recharts";
import useFetch from "@/hooks/useFetch";

/* ─────────────── Constants ─────────────── */
const PIE_PALETTE = ["#10b981", "#ef4444", "#f59e0b", "#6366f1", "#8b5cf6", "#ec4899"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ─────────────── Utilities ─────────────── */
const fmtSec = (s) => {
    if (!s || s === 0) return "0s";
    if (s < 60) return `${Math.round(s)}s`;
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.round(s % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${sec}s`;
};
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return ""; } };
const pct = (n, d) => d > 0 ? ((n / d) * 100).toFixed(1) : "0.0";

/* ─────────────── Shared Tooltip ─────────────── */
const GlassTooltip = ({ active, payload, label, suffix = "" }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-black/90 border border-white/10 p-4 rounded-2xl shadow-2xl text-xs backdrop-blur-xl min-w-[160px]">
            {label && <p className="text-gray-500 font-bold uppercase tracking-[0.2em] mb-3">{label}</p>}
            {payload.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-0.5">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full block shrink-0" style={{ background: p.color || p.fill || "#dc2626" }} />
                        <span className="text-gray-400 font-semibold">{p.name}</span>
                    </div>
                    <span className="text-white font-black">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}{suffix}</span>
                </div>
            ))}
        </div>
    );
};

/* ─────────────── KPI Card with animated border ─────────────── */
const KpiCard = ({ label, value, sub, color = "text-white", accent = "#dc2626", trend, trendLabel, icon }) => (
    <div className="relative rounded-2xl p-[1px] overflow-hidden group cursor-default"
        style={{ background: `linear-gradient(135deg, ${accent}30, transparent 60%)` }}>
        <div className="bg-[#0a0a0a] rounded-2xl p-5 h-full flex flex-col gap-2 hover:bg-[#111] transition-colors">
            <div className="flex items-start justify-between">
                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.25em]">{label}</span>
                {icon && <span className="text-base opacity-70">{icon}</span>}
            </div>
            <span className={`text-2xl font-black tracking-tighter ${color} leading-none`}>{value}</span>
            {sub && <span className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">{sub}</span>}
            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${trend > 0 ? "text-red-500" : "text-emerald-500"}`}>
                    <span>{trend > 0 ? "▲" : "▼"}</span>
                    <span>{Math.abs(trend).toFixed(1)}% {trendLabel}</span>
                </div>
            )}
        </div>
    </div>
);

/* ─────────────── Section wrapper ─────────────── */
const Section = ({ title, sub, badge, children, accent = "#dc2626" }) => (
    <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-[#0a0a0a] group">
        <div className="absolute top-0 left-0 w-full h-[1px]"
            style={{ background: `linear-gradient(90deg,transparent,${accent}60,transparent)` }} />
        <div className="p-7">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">{title}</h3>
                        {badge && (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border"
                                style={{ color: accent, borderColor: `${accent}40`, background: `${accent}10` }}>{badge}</span>
                        )}
                    </div>
                    {sub && <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">{sub}</p>}
                </div>
            </div>
            {children}
        </div>
    </div>
);

/* ═══════════════════════════ MAIN COMPONENT ═══════════════════════════ */
const GitHubAnalytics = ({ repoId }) => {
    const qp = repoId ? `?repoId=${repoId}` : "";

    const { data: rawData, loading: loadingA, fetchData: fetchAnalytics } = useFetch(`/api/github/analytics${qp}`);
    const { data: rawAlerts, fetchData: fetchAlerts } = useFetch(`/api/github/alerts${qp}`);
    const { data: rawInsights, fetchData: fetchInsights } = useFetch(`/api/github/insights${qp}`);

    useEffect(() => {
        fetchAnalytics();
        fetchAlerts();
        fetchInsights();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repoId]);

    const hasData = rawData && (
        rawData.conclusions?.length > 0 || rawData.trends?.length > 0 || rawData.bottlenecks?.length > 0
    );

    /* ── Derived analytics ── */
    const a = useMemo(() => {
        if (!hasData) return null;
        const conclusions = rawData.conclusions || [];
        const trends = rawData.trends || [];
        const bottlenecks = rawData.bottlenecks || [];
        const failures = rawData.failures || [];

        const total = conclusions.reduce((s, c) => s + (c.count || 0), 0);
        const successCount = conclusions.find(c => c._id === "success")?.count || 0;
        const failureCount = conclusions.find(c => c._id === "failure")?.count || 0;
        const successRate = pct(successCount, total);
        const failureRate = pct(failureCount, total);

        const totalRuns = trends.reduce((s, t) => s + (t.totalRuns || 0), 0);
        const buildsPerDay = trends.length > 0 ? (totalRuns / trends.length).toFixed(1) : "0";

        const avgDuration = bottlenecks.length > 0
            ? bottlenecks.reduce((s, b) => s + (b.avgDuration || 0), 0) / bottlenecks.length : 0;

        const flakyWorkflows = (() => {
            const failSet = new Set((failures || []).map(f => f._id));
            return bottlenecks.filter(b => failSet.has(b._id));
        })();

        const healthScore = Math.min(100, Math.round(
            parseFloat(successRate) * 0.5 +
            (avgDuration < 300 ? 30 : avgDuration < 600 ? 15 : 0) +
            ((rawAlerts?.length || 0) === 0 ? 20 : (rawAlerts?.length || 0) < 3 ? 10 : 0)
        ));

        const radarData = [
            { subject: "Success Rate", A: Math.min(100, parseFloat(successRate)) },
            { subject: "Speed", A: avgDuration < 180 ? 100 : avgDuration < 360 ? 70 : avgDuration < 600 ? 40 : 20 },
            { subject: "Alert-Free", A: (rawAlerts?.length || 0) === 0 ? 100 : Math.max(0, 100 - (rawAlerts?.length || 0) * 15) },
            { subject: "Frequency", A: Math.min(100, parseFloat(buildsPerDay) * 10) },
            { subject: "Stability", A: flakyWorkflows.length === 0 ? 100 : Math.max(0, 100 - flakyWorkflows.length * 20) },
        ];

        return {
            total, successCount, failureCount, successRate, failureRate,
            buildsPerDay, avgDuration, flakyWorkflows, healthScore, radarData,
            conclusionData: conclusions.map(c => ({ name: c._id || "unknown", value: c.count })),
            trendData: trends.map(t => ({
                date: fmtDate(t._id),
                duration: Math.round(t.avgDuration || 0),
                runs: t.totalRuns || 0,
                failures: t.failures || 0,
            })),
            bottleneckData: bottlenecks.slice(0, 8).map(b => ({
                name: (b._id || "unknown").length > 20 ? b._id.slice(0, 20) + "…" : b._id,
                avg: Math.round(b.avgDuration || 0),
                max: Math.round(b.maxDuration || 0),
            })),
            failureData: failures.slice(0, 6).map(f => ({
                name: (f._id || "unknown").length > 22 ? f._id.slice(0, 22) + "…" : f._id,
                count: f.failureCount || 0,
            })),
        };
    }, [rawData, rawAlerts, hasData]);

    /* ── Insights ── */
    const ins = rawInsights || {};
    const regression = ins.regression || {};
    const mttrList = (ins.mttr || []).slice(0, 5);
    const heatmap = ins.heatmap || [];
    const costUSD = (ins.costEstimateUSD || 0).toFixed(2);
    const totalMins = Math.round(ins.totalMinutes || 0);
    const overallMTTR = ins.overallMTTR || 0;

    /* ── Loading ── */
    if (loadingA) return (
        <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="relative">
                <div className="w-14 h-14 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
                <div className="absolute inset-2 border-2 border-white/5 border-b-white/20 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
            </div>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] animate-pulse">Loading Analytics</span>
        </div>
    );

    /* ── Empty ── */
    if (!hasData) return (
        <div className="flex flex-col items-center justify-center py-28 gap-5 border-2 border-dashed border-white/5 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">📊</div>
            <div className="text-center">
                <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No analytics data yet</p>
                <p className="text-gray-700 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto">
                    Enable monitoring for at least one repository and wait for the sync service to collect run data.
                </p>
            </div>
        </div>
    );

    const healthColor = a.healthScore >= 85 ? "#10b981" : a.healthScore >= 60 ? "#f59e0b" : "#ef4444";
    const healthLabel = a.healthScore >= 85 ? "Healthy" : a.healthScore >= 60 ? "Degraded" : "Critical";

    return (
        <div className="w-full flex flex-col gap-7 pb-20 animate-in fade-in duration-700">

            {/* ── Top Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Pipeline Intelligence</h2>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">
                        {a.total} runs analysed · autonomous insights active
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all"
                    style={{ borderColor: `${healthColor}30`, background: `${healthColor}08` }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: healthColor }} />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: healthColor }}>
                        {healthLabel} · {a.healthScore}/100
                    </span>
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <KpiCard icon="✅" label="Success Rate" value={`${a.successRate}%`}
                    color={parseFloat(a.successRate) >= 80 ? "text-emerald-400" : "text-red-500"} accent="#10b981" />
                <KpiCard icon="❌" label="Failure Rate" value={`${a.failureRate}%`}
                    color={parseFloat(a.failureRate) > 20 ? "text-red-500" : "text-gray-300"} accent="#ef4444" />
                <KpiCard icon="⏱️" label="Avg Build Time" value={fmtSec(a.avgDuration)} sub="per workflow" accent="#3b82f6" />
                <KpiCard icon="📦" label="Builds / Day" value={a.buildsPerDay} color="text-blue-400" sub="avg frequency" accent="#3b82f6" />
                <KpiCard icon="💰" label="Est. Cost" value={`$${costUSD}`} sub={`${totalMins} build mins`} color="text-amber-400" accent="#f59e0b" />
                <KpiCard icon="🔄" label="Avg MTTR" value={overallMTTR > 0 ? fmtSec(overallMTTR) : "—"}
                    sub="mean time to recovery" color={overallMTTR > 3600 ? "text-red-400" : overallMTTR > 0 ? "text-amber-400" : "text-emerald-400"} accent="#8b5cf6" />
            </div>

            {/* ── Row 1: Outcome Donut + Radar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Run Outcome Distribution" sub="Breakdown by conclusion status">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="h-52 w-full sm:w-52 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={a.conclusionData} cx="50%" cy="50%" outerRadius={90} innerRadius={55}
                                        dataKey="value" paddingAngle={3} animationBegin={0} animationDuration={1200}>
                                        {a.conclusionData.map((_, i) => (
                                            <Cell key={i} fill={PIE_PALETTE[i]} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<GlassTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                            {a.conclusionData.map((c, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_PALETTE[i] }} />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{c.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${pct(c.value, a.total)}%`, background: PIE_PALETTE[i] }} />
                                        </div>
                                        <span className="text-xs font-black text-white w-8 text-right">{c.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Section>

                <Section title="Pipeline Health Radar" sub="Multi-dimensional reliability score">
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={a.radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.04)" />
                                <PolarAngleAxis dataKey="subject"
                                    tick={{ fill: "#4b5563", fontSize: 9, fontWeight: 700 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <defs>
                                    <linearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#dc2626" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                                <Radar dataKey="A" stroke="url(#radarGrad)" strokeWidth={2}
                                    fill="url(#radarGrad)" fillOpacity={0.25} animationDuration={1500} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Section>
            </div>

            {/* ── Row 2: Build Timeline ── */}
            <Section title="Build Timeline" sub="Daily run volume · avg duration · failures" accent="#3b82f6">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={a.trendData} margin={{ left: 0, right: 0 }}>
                            <defs>
                                <linearGradient id="durGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="runGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 8" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.05)" tick={{ fill: "#374151", fontSize: 9, fontWeight: 700 }} />
                            <YAxis yAxisId="l" stroke="rgba(255,255,255,0.03)" tick={{ fill: "#374151", fontSize: 9 }} />
                            <YAxis yAxisId="r" orientation="right" hide />
                            <Tooltip content={<GlassTooltip />} cursor={{ stroke: "#dc2626", strokeOpacity: 0.15, strokeWidth: 1 }} />
                            <Area yAxisId="l" type="monotone" dataKey="duration" name="Avg Duration (s)"
                                stroke="#dc2626" strokeWidth={2.5} fill="url(#durGrad)" />
                            <Bar yAxisId="r" dataKey="runs" name="Run Volume"
                                fill="rgba(59,130,246,0.12)" radius={[3, 3, 0, 0]} barSize={24} />
                            <Line yAxisId="r" type="monotone" dataKey="failures" name="Failures"
                                stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                                activeDot={{ r: 5 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 mt-3 flex-wrap">
                    {[{ color: "#dc2626", label: "Avg Duration" }, { color: "rgba(59,130,246,0.5)", label: "Run Volume" }, { color: "#f59e0b", label: "Failures" }].map((l, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{l.label}</span>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── Row 3: Bottleneck + Failure Breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Slowest Workflows" sub="Average vs peak execution time (seconds)">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={a.bottleneckData} layout="vertical" margin={{ left: 8 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={130}
                                    tick={{ fill: "#4b5563", fontSize: 9, fontWeight: 700 }} />
                                <Tooltip content={<GlassTooltip suffix="s" />} />
                                {a.bottleneckData.map((_, i) => (
                                    <defs key={i}>
                                        <linearGradient id={`bGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#dc2626" stopOpacity={1 - i * 0.08} />
                                            <stop offset="100%" stopColor="#7f1d1d" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                ))}
                                <Bar dataKey="avg" name="Avg (s)" radius={[0, 6, 6, 0]} barSize={16}>
                                    {a.bottleneckData.map((_, i) => <Cell key={i} fill={`url(#bGrad${i})`} />)}
                                </Bar>
                                <Bar dataKey="max" name="Max (s)" fill="rgba(255,255,255,0.06)"
                                    radius={[0, 4, 4, 0]} barSize={6} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Section>

                <Section title="Top Failing Workflows" sub="Most frequent failure sources" accent="#ef4444">
                    {a.failureData.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl">🎉</div>
                            <p className="text-emerald-400 font-black text-xs uppercase tracking-widest">No failures recorded</p>
                        </div>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={a.failureData} layout="vertical" margin={{ left: 8 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={130}
                                        tick={{ fill: "#4b5563", fontSize: 9, fontWeight: 700 }} />
                                    <Tooltip content={<GlassTooltip />} />
                                    <Bar dataKey="count" name="Failures" fill="#ef4444"
                                        radius={[0, 6, 6, 0]} barSize={16} fillOpacity={0.85} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Section>
            </div>

            {/* ════════════ INTELLIGENT AUTONOMOUS FEATURES ════════════ */}
            <div className="pt-2">
                <div className="flex items-center gap-3 mb-5">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
                    <span className="text-[9px] font-black text-red-600 uppercase tracking-[0.4em] px-2">
                        Autonomous Intelligence Engine
                    </span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ── Feature 1: Build Cost Estimator ── */}
                    <Section title="Build Cost Estimator" sub="GitHub Actions Linux runner · $0.008/min" badge="LIVE" accent="#f59e0b">
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            {[
                                { l: "Total Minutes", v: `${totalMins}m`, color: "text-white" },
                                { l: "Est. Cost", v: `$${costUSD}`, color: "text-amber-400" },
                                { l: "Runs Tracked", v: a.total, color: "text-blue-400" },
                            ].map((s, i) => (
                                <div key={i} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-center hover:border-amber-500/20 transition-all">
                                    <div className={`text-lg font-black ${s.color}`}>{s.v}</div>
                                    <div className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-1">{s.l}</div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15">
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                Based on actual collected build durations. Assumes GitHub-hosted Linux runners at standard rate.
                                Upgrade to a private runner to reduce cost significantly.
                            </p>
                        </div>
                        <div className="mt-4 h-16">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={a.trendData.map(t => ({ ...t, cost: ((t.duration * t.runs) / 60 * 0.008).toFixed(3) }))}>
                                    <defs>
                                        <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="cost" name="Daily Cost ($)" stroke="#f59e0b"
                                        strokeWidth={2} fill="url(#costGrad)" />
                                    <Tooltip content={<GlassTooltip suffix="$" />} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Section>

                    {/* ── Feature 2: MTTR Engine ── */}
                    <Section title="Mean Time to Recovery" sub="Per workflow: failure → next success duration" badge="MTTR" accent="#8b5cf6">
                        {mttrList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">✅</div>
                                <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">No recoveries needed</p>
                                <p className="text-gray-700 text-[9px] font-bold uppercase text-center">All workflows are passing consistently</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-5 p-4 bg-purple-500/5 border border-purple-500/15 rounded-2xl">
                                    <div className="text-3xl font-black text-purple-400">{fmtSec(overallMTTR)}</div>
                                    <div>
                                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Overall Avg MTTR</div>
                                        <div className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${overallMTTR < 1800 ? "text-emerald-500" : overallMTTR < 7200 ? "text-amber-500" : "text-red-500"}`}>
                                            {overallMTTR < 1800 ? "🟢 Excellent recovery speed" : overallMTTR < 7200 ? "🟡 Acceptable — room to improve" : "🔴 High — review failing workflows"}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {mttrList.map((m, i) => {
                                        const pctBar = Math.min(100, (m.avgMttr / (overallMTTR * 2)) * 100);
                                        return (
                                            <div key={i} className="flex items-center gap-3 group/m p-2 rounded-xl hover:bg-white/[0.03] transition-all">
                                                <div className="w-24 shrink-0">
                                                    <p className="text-[10px] font-bold text-gray-400 truncate" title={m.workflow}>{m.workflow}</p>
                                                    <p className="text-[8px] text-gray-700 font-bold">{m.count} event{m.count > 1 ? "s" : ""}</p>
                                                </div>
                                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-700"
                                                        style={{ width: `${pctBar}%`, background: `linear-gradient(90deg, #8b5cf6, #ec4899)` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-purple-400 shrink-0 w-14 text-right">
                                                    {fmtSec(m.avgMttr)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </Section>

                    {/* ── Feature 3: Day-of-Week Failure Heatmap ── */}
                    <Section title="Failure Heatmap" sub="Which days have the most pipeline failures" badge="Pattern" accent="#ec4899">
                        {heatmap.length === 0 ? (
                            <div className="py-10 text-center text-gray-700 font-bold text-xs uppercase tracking-widest">No pattern data yet</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {DAYS.map(d => (
                                        <div key={d} className="text-center text-[8px] text-gray-600 font-black uppercase">{d}</div>
                                    ))}
                                    {DAYS.map(day => {
                                        const entry = heatmap.find(h => h.day === day);
                                        const failRate = entry ? (entry.failures / Math.max(entry.total, 1)) : 0;
                                        const intensity = Math.round(failRate * 9);
                                        const colors = ["#1a1a1a", "#1f0a0a", "#2d0808", "#450808", "#5e0a0a", "#7a0c0c", "#982020", "#b83232", "#d44444", "#ef4444"];
                                        return (
                                            <div key={day} className="aspect-square rounded-xl border border-white/5 flex flex-col items-center justify-center cursor-default group/day relative transition-transform hover:scale-105"
                                                style={{ background: colors[intensity] }}
                                                title={entry ? `${day}: ${entry.failures} failures / ${entry.total} runs` : `${day}: no data`}>
                                                {entry && (
                                                    <div className="opacity-0 group-hover/day:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 px-2 py-1 rounded-lg text-[8px] font-bold text-white whitespace-nowrap z-10 pointer-events-none transition-opacity">
                                                        {entry.failures}/{entry.total} failed
                                                    </div>
                                                )}
                                                <span className="text-[8px] font-black" style={{ color: intensity > 4 ? "#fca5a5" : "#6b7280" }}>
                                                    {entry ? entry.failures : "—"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] text-gray-700 font-bold uppercase">Low failure rate</span>
                                    <div className="flex gap-1">
                                        {["#1a1a1a", "#2d0808", "#5e0a0a", "#982020", "#ef4444"].map((c, i) => (
                                            <div key={i} className="w-4 h-2 rounded-sm" style={{ background: c }} />
                                        ))}
                                    </div>
                                    <span className="text-[8px] text-gray-700 font-bold uppercase">High failure rate</span>
                                </div>
                                <div className="mt-4 h-28">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={heatmap} margin={{ left: 0, right: 0, bottom: 0, top: 0 }}>
                                            <XAxis dataKey="day" tick={{ fill: "#4b5563", fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<GlassTooltip />} />
                                            <Bar dataKey="total" name="Total" fill="rgba(255,255,255,0.07)" radius={[3, 3, 0, 0]} barSize={24} />
                                            <Bar dataKey="failures" name="Failures" fill="#ec4899" radius={[3, 3, 0, 0]} barSize={12} fillOpacity={0.85} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}
                    </Section>

                    {/* ── Feature 4: Build Time Regression Detector ── */}
                    <Section title="Build Time Regression Detector" sub="Last 7 days vs prior 7 days average duration" badge="Auto-detect" accent="#10b981">
                        {!regression.recentAvg && !regression.priorAvg ? (
                            <div className="py-10 text-center text-gray-700 font-bold text-xs uppercase tracking-widest">Need 14+ days of data</div>
                        ) : (
                            <>
                                <div className={`p-5 rounded-2xl border mb-5 flex items-center gap-4 ${regression.isRegression
                                    ? "bg-red-600/5 border-red-600/20" : "bg-emerald-500/5 border-emerald-500/20"}`}>
                                    <div className={`text-3xl font-black ${regression.isRegression ? "text-red-400" : "text-emerald-400"}`}>
                                        {regression.isRegression ? "⚠️" : "✅"}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-black uppercase tracking-tight ${regression.isRegression ? "text-red-400" : "text-emerald-400"}`}>
                                            {regression.isRegression ? "Regression Detected" : "No Regression"}
                                        </p>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                            {regression.isRegression
                                                ? `Builds are ${regression.changePercent?.toFixed(1)}% slower than last week — investigate recent commits`
                                                : "Build performance is stable or improving"}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    {[
                                        { l: "Recent Avg (7d)", v: fmtSec(regression.recentAvg), n: regression.recentCount, color: regression.isRegression ? "text-red-400" : "text-white" },
                                        { l: "Prior Avg (7–14d)", v: fmtSec(regression.priorAvg), n: regression.priorCount, color: "text-gray-400" },
                                    ].map((s, i) => (
                                        <div key={i} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                            <div className={`text-xl font-black ${s.color}`}>{s.v}</div>
                                            <div className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-1">{s.l}</div>
                                            <div className="text-[8px] text-gray-700 font-bold mt-0.5">{s.n || 0} runs</div>
                                        </div>
                                    ))}
                                </div>
                                {regression.changePercent !== undefined && (
                                    <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                        <div className={`text-lg font-black ${regression.changePercent > 0 ? "text-red-400" : "text-emerald-400"}`}>
                                            {regression.changePercent > 0 ? "▲" : "▼"} {Math.abs(regression.changePercent).toFixed(1)}%
                                        </div>
                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${Math.min(100, Math.abs(regression.changePercent))}%`,
                                                    background: regression.changePercent > 0 ? "#ef4444" : "#10b981"
                                                }} />
                                        </div>
                                        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">vs last week</span>
                                    </div>
                                )}
                            </>
                        )}
                    </Section>
                </div>
            </div>

            {/* ── Anomaly Incidents ── */}
            {(rawAlerts?.length > 0) && (
                <Section title="Anomaly Incidents" sub={`${rawAlerts.length} run(s) flagged by automated detection`} badge="LIVE" accent="#ef4444">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rawAlerts.map((alert, i) => (
                            <div key={i} className="p-5 bg-red-600/5 border border-red-600/15 rounded-2xl hover:border-red-600/35 transition-all group/a">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[9px] text-red-400 font-black uppercase tracking-widest truncate flex-1">{alert.workflowName}</span>
                                    <span className="text-[8px] text-red-600 border border-red-600/30 rounded px-1.5 py-0.5 font-black uppercase ml-2 shrink-0">
                                        {((alert.anomalyScore || 0) * 10).toFixed(0)}/10
                                    </span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-300 leading-relaxed mb-3">{alert.anomalyReason}</p>
                                <p className="text-[8px] text-gray-700 font-bold">{new Date(alert.startedAt).toLocaleString()}</p>
                                {alert.duration > 0 && (
                                    <p className="text-[8px] text-amber-500 font-black mt-1">⏱ {fmtSec(alert.duration)}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ── Flaky Workflow Detector ── */}
            <Section title="Flaky Workflow Detector" sub="Workflows with mixed pass/fail outcomes — non-deterministic" badge="Intelligent" accent="#f59e0b">
                {a.flakyWorkflows.length === 0 ? (
                    <div className="flex items-center gap-4 p-5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">✅</div>
                        <div>
                            <p className="text-emerald-400 font-black text-xs uppercase tracking-widest">All workflows deterministic</p>
                            <p className="text-gray-700 text-[9px] font-bold uppercase tracking-widest mt-0.5">No flakiness detected across {a.total} runs</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {a.flakyWorkflows.map((w, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl hover:border-amber-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                    <span className="text-[10px] font-bold text-gray-300 truncate max-w-[180px]">{w.name || w._id}</span>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <span className="text-[8px] font-black text-emerald-400 border border-emerald-400/30 rounded px-1.5 py-0.5">passes</span>
                                    <span className="text-[8px] font-black text-red-400 border border-red-400/30 rounded px-1.5 py-0.5">fails</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

        </div>
    );
};

export default GitHubAnalytics;
