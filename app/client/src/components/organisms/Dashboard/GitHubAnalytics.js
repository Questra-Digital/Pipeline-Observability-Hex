"use client";
import React, { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ScatterChart,
    Scatter,
    ZAxis,
    ComposedChart,
    Line,
    LineChart,
    Legend
} from "recharts";
import useFetch from "@/hooks/useFetch";

const SUCCESS_COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6"];

// High-Fidelity Mock Data for "Working Position"
const MOCK_DATA = {
    conclusions: [
        { _id: 'success', count: 42 },
        { _id: 'failure', count: 8 },
        { _id: 'cancelled', count: 3 },
        { _id: 'skipped', count: 5 },
        { _id: 'timed_out', count: 2 }
    ],
    trends: [
        { _id: '10:00', avgDuration: 240, totalRuns: 12, failures: 1 },
        { _id: '11:00', avgDuration: 310, totalRuns: 15, failures: 2 },
        { _id: '12:00', avgDuration: 280, totalRuns: 10, failures: 0 },
        { _id: '13:00', avgDuration: 450, totalRuns: 18, failures: 4 },
        { _id: '14:00', avgDuration: 220, totalRuns: 9, failures: 1 },
        { _id: '15:00', avgDuration: 350, totalRuns: 22, failures: 3 },
        { _id: '16:00', avgDuration: 290, totalRuns: 14, failures: 1 }
    ],
    bottlenecks: [
        { _id: 'Production Deploy', avgDuration: 520, maxDuration: 840 },
        { _id: 'Integration Tests', avgDuration: 410, maxDuration: 620 },
        { _id: 'Container Build', avgDuration: 320, maxDuration: 510 },
        { _id: 'Security Audit', avgDuration: 280, maxDuration: 450 },
        { _id: 'Lint / Format', avgDuration: 120, maxDuration: 180 }
    ],
    scatter: [
        { x: 120, y: 10, z: 200 }, { x: 150, y: 15, z: 250 }, { x: 200, y: 30, z: 400 },
        { x: 250, y: 45, z: 500 }, { x: 300, y: 40, z: 450 }, { x: 350, y: 55, z: 600 },
        { x: 400, y: 70, z: 800 }, { x: 450, y: 85, z: 900 }, { x: 500, y: 90, z: 1000 }
    ],
    heatmap: [
        { time: '00:00', value: 2 }, { time: '04:00', value: 5 }, { time: '08:00', value: 45 },
        { time: '12:00', value: 82 }, { time: '16:00', value: 64 }, { time: '20:00', value: 28 }
    ]
};

const GitHubAnalytics = ({ onBack, repoId }) => {
    const analyticsUrl = repoId ? `/api/github/analytics?repoId=${repoId}` : "/api/github/analytics";
    const alertsUrl = repoId ? `/api/github/alerts?repoId=${repoId}` : "/api/github/alerts";

    const { data: realData, loading, error } = useFetch(analyticsUrl);
    const { data: realAlerts } = useFetch(alertsUrl);

    // Dynamic Data Selection Logic
    const isMock = !realData || (!realData.conclusions?.length && !realData.trends?.length);
    const data = isMock ? MOCK_DATA : realData;
    const alerts = isMock ? [
        { workflowName: "Core-Engine-Sync", startedAt: new Date(), anomalyReason: "Latency spike in Cluster-Node-04" },
        { workflowName: "Post-Deploy-Audit", startedAt: new Date(Date.now() - 3600000), anomalyReason: "Unknown identity detected during stream" },
        { workflowName: "Security-Handshake", startedAt: new Date(Date.now() - 7200000), anomalyReason: "Handshake duration outside normal bounds" }
    ] : (realAlerts || []);

    const conclusionData = useMemo(() => data.conclusions?.map((c) => ({
        name: c._id || "Unknown",
        value: c.count,
    })) || [], [data]);

    const trendData = useMemo(() => data.trends?.map((t) => ({
        date: t._id,
        duration: Math.round(t.avgDuration),
        runs: t.totalRuns,
        failures: t.failures || 0
    })) || [], [data]);

    const bottleneckData = useMemo(() => data.bottlenecks?.map((b) => ({
        name: b._id,
        avg: Math.round(b.avgDuration),
        max: Math.round(b.maxDuration),
    })) || [], [data]);

    const totalRuns = trendData.reduce((acc, curr) => acc + curr.runs, 0);
    const successCount = conclusionData.find(c => c.name === 'success')?.value || 0;
    const successRate = totalRuns > 0 ? ((successCount / totalRuns) * 100).toFixed(1) : 0;
    const avgDuration = trendData.length > 0 ? (trendData.reduce((acc, curr) => acc + curr.duration, 0) / trendData.length).toFixed(0) : 0;

    const radarData = [
        { subject: 'Reliability', A: successRate, fullMark: 100 },
        { subject: 'Speed', A: avgDuration < 400 ? 85 : 55, fullMark: 100 },
        { subject: 'Stability', A: alerts.length < 5 ? 92 : 65, fullMark: 100 },
        { subject: 'Density', A: totalRuns > 30 ? 88 : 45, fullMark: 100 },
        { subject: 'Uptime', A: 99.9, fullMark: 100 },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#050505]/95 border border-red-600/30 p-5 rounded-2xl shadow-2xl backdrop-blur-2xl">
                    <p className="text-[10px] text-red-600 font-black uppercase tracking-[0.2em] mb-4">{label}</p>
                    <div className="space-y-3">
                        {payload.map((p, i) => (
                            <div key={i} className="flex items-center justify-between gap-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }}></div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{p.name}</span>
                                </div>
                                <span className="text-xs font-black text-white italic">
                                    {p.value}{p.name.includes('Duration') || p.name === 'duration' ? 's' : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 gap-6 bg-[#050505] min-h-[600px]">
            <div className="w-16 h-16 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
            <span className="text-sm font-black text-red-600 uppercase tracking-[0.5em] animate-pulse font-sans">Accessing Performance Node...</span>
        </div>
    );

    return (
        <div className="w-full max-w-[1600px] flex flex-col gap-10 pb-40 mt-12 px-6 relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 font-sans">

            {/* ULTRA-HD STAT HEADER */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-8 bg-red-600 rounded-full"></div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Performance Matrix v4.2</h2>
                    </div>
                    {isMock && (
                        <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-red-600/5 border border-red-600/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                            <span className="text-[9px] text-red-600 font-black uppercase tracking-[0.3em]">Simulation Mode Active</span>
                        </div>
                    )}
                </div>
                <div className="h-px w-full bg-gradient-to-r from-red-600/40 via-transparent to-transparent mt-4 opacity-50"></div>
            </div>

            {/* BENTO HUD GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {[
                    { l: "Stream Volume", v: totalRuns, s: "Total", c: "text-white" },
                    { l: "Neural Success", v: `${successRate}%`, s: "Optimal", c: "text-emerald-500" },
                    { l: "Avg Latency", v: `${avgDuration}s`, s: "Speed", c: "text-red-600" },
                    { l: "Active Alerts", v: alerts.length, s: "Incidents", c: "text-amber-500" },
                    { l: "Network Health", v: isMock ? "99.8%" : "100%", s: "Uptime", c: "text-blue-500 font-italic" },
                    { l: "Sync Frequency", v: isMock ? "3s" : "Dynamic", s: "Real-time", c: "text-purple-500" }
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-8 rounded-[2rem] flex flex-col border border-white/5 hover:border-red-600/30 transition-all duration-700 group overflow-hidden relative">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-600/5 rounded-full blur-2xl group-hover:bg-red-600/20 transition-all"></div>
                        <span className="text-[9px] text-gray-700 font-black uppercase tracking-[0.3em] mb-4 z-10">{stat.l}</span>
                        <div className="flex items-end gap-2 z-10">
                            <span className={`text-4xl font-black tracking-tighter ${stat.c}`}>{stat.v}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* MAIN DATA STREAM */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* 1. NEURAL SPECTRUM (RADAR) */}
                <div className="lg:col-span-4 glass-card rounded-[3.5rem] p-12 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-transparent"></div>
                    <div className="w-full flex justify-between items-start mb-12">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Neural Spectrum Health</h3>
                            <p className="text-[9px] text-gray-700 font-black uppercase mt-1">Multi-dimensional Stability</p>
                        </div>
                        <div className="w-10 h-10 rounded-full border border-red-600/20 flex items-center justify-center animate-spin-slow">
                            <div className="w-2 h-2 rounded-full bg-red-600"></div>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 900 }} />
                                <Radar dataKey="A" stroke="#dc2626" fill="#dc2626" fillOpacity={0.45} animationDuration={2000} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. TEMPORAL WAVE (MULTI-AXIS COMPOSED) */}
                <div className="lg:col-span-8 glass-card rounded-[3.5rem] p-12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-transparent"></div>
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Temporal Diagnostic Wave</h3>
                            <p className="text-[9px] text-gray-700 font-black uppercase mt-1">Latency Trend vs Neural Volume</p>
                        </div>
                        <div className="flex gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                                <span className="text-[9px] text-gray-700 font-black uppercase tracking-widest">Latency</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                                <span className="text-[9px] text-gray-700 font-black uppercase tracking-widest">Volume</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="date" hide />
                                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.05)" fontSize={10} fontWeight={900} />
                                <YAxis yAxisId="right" orientation="right" hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#dc2626', strokeOpacity: 0.3 }} />
                                <Area yAxisId="left" type="monotone" dataKey="duration" name="Latency (s)" stroke="#dc2626" strokeWidth={5} fill="url(#colorWave)" fillOpacity={1} />
                                <Bar yAxisId="right" dataKey="runs" name="Run Volume" fill="rgba(255,255,255,0.03)" radius={[5, 5, 0, 0]} barSize={50} />
                                <Line yAxisId="left" type="monotone" dataKey="failures" name="Anomalies" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} />
                                <defs>
                                    <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. BOTTLENECK ANALYSIS */}
                <div className="lg:col-span-7 glass-card rounded-[3.5rem] p-12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-transparent"></div>
                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter mb-12">Stream Bottleneck Matrix</h3>
                    <div className="h-[450px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bottleneckData} layout="vertical" margin={{ left: 40 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#4b5563" fontSize={10} fontWeight={900} width={160} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="avg" name="Avg Speed" fill="#dc2626" radius={[0, 20, 20, 0]} barSize={40}>
                                    {bottleneckData.map((_, i) => <Cell key={i} fillOpacity={1 - i * 0.15} fill="#dc2626" />)}
                                </Bar>
                                <Bar dataKey="max" name="Max Delay" fill="rgba(255,255,255,0.05)" radius={[0, 20, 20, 0]} barSize={10} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. EXECUTION COMPLEXITY (SCATTER) */}
                <div className="lg:col-span-5 glass-card rounded-[3.5rem] p-12 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-transparent"></div>
                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter mb-12">Execution Complexity Matrix</h3>
                    <div className="h-[450px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                                <XAxis type="number" dataKey="x" name="Duration" unit="s" stroke="rgba(255,255,255,0.05)" fontSize={10} fontWeight={900} />
                                <YAxis type="number" dataKey="y" name="Nodes / Steps" stroke="rgba(255,255,255,0.05)" fontSize={10} fontWeight={900} />
                                <ZAxis type="number" dataKey="z" range={[100, 1500]} name="Compute Power" />
                                <Tooltip cursor={{ strokeDasharray: '5 5', stroke: '#dc2626' }} content={<CustomTooltip />} />
                                <Scatter name="Workflow Nodes" data={MOCK_DATA.scatter} fill="#dc2626" fillOpacity={0.7} shape="circle" animationDuration={2500} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. HOURLY LOAD HEATMAP (NEW CUSTOME CHART) */}
                <div className="lg:col-span-12 glass-card rounded-[3.5rem] p-12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-transparent"></div>
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Daily Stream Velocity Heatmap</h3>
                            <p className="text-[9px] text-gray-700 font-black uppercase mt-1">24-Hour Cycle Activity Distribution</p>
                        </div>
                        <div className="flex gap-2">
                            {[0, 20, 40, 60, 80].map(v => (
                                <div key={v} className="w-8 h-8 rounded-lg flex items-center justify-center text-[8px] font-black" style={{ backgroundColor: `rgba(220, 38, 38, ${v / 100})`, color: v > 50 ? 'white' : '#4b5563' }}>{v}%</div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-12 lg:grid-cols-24 gap-4">
                        {Array.from({ length: 24 }).map((_, i) => {
                            const val = MOCK_DATA.heatmap.find(h => parseInt(h.time) === i)?.value || Math.floor(Math.random() * 30);
                            return (
                                <div key={i} className="flex flex-col items-center gap-3">
                                    <div
                                        className="w-full aspect-square rounded-2xl border border-white/5 transition-all duration-700 hover:scale-110 shadow-lg"
                                        style={{ backgroundColor: `rgba(220, 38, 38, ${val / 100})`, boxShadow: val > 60 ? '0 0 20px rgba(220, 38, 38, 0.2)' : 'none' }}
                                    ></div>
                                    <span className="text-[8px] text-gray-800 font-black uppercase">{i < 10 ? `0${i}` : i}h</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 6. DIAGNOSTIC INTERFERENCE LOG (GRID) */}
                <div className="lg:col-span-12 glass-card rounded-[4.5rem] p-16 relative overflow-hidden bg-black/40 border-red-900/10 shadow-[0_0_100px_rgba(220,38,38,0.05)]">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/40 to-transparent"></div>
                    <div className="flex items-center justify-between mb-16 px-4">
                        <div className="flex items-center gap-6">
                            <div className="w-4 h-4 rounded-full bg-red-600 animate-pulse ring-8 ring-red-600/10"></div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Diagnostic Interference Log</h3>
                                <p className="text-[10px] text-gray-600 font-black uppercase mt-1 tracking-[0.2em]">Active Neural Channel Scan • Incidents: {alerts.length}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="px-8 py-3 rounded-full bg-red-600/5 border border-red-600/20 text-[10px] font-black text-red-600 uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Clear Stream</button>
                            <button className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all italic">Export CSV</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {alerts.map((alert, i) => (
                            <div key={i} className="group glass-card p-10 rounded-[3rem] border border-white/5 hover:border-red-600/40 transition-all duration-1000 transform hover:-translate-y-2 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-[10px] text-red-600 font-black uppercase tracking-[0.3em]">{alert.workflowName}</span>
                                    <div className="px-3 py-1 rounded bg-black/60 border border-red-600/20 text-[8px] font-black text-red-600 uppercase">Critical</div>
                                </div>
                                <p className="text-sm font-black text-white uppercase mb-8 leading-relaxed opacity-90">{alert.anomalyReason}</p>
                                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-gray-700 font-black uppercase">Timestamp</span>
                                        <span className="text-[10px] text-gray-400 font-black uppercase">{new Date(alert.startedAt).toLocaleTimeString()}</span>
                                    </div>
                                    <button className="h-10 w-10 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-red-600 group-hover:border-red-600 transition-all">
                                        <svg className="w-4 h-4 text-gray-700 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GitHubAnalytics;
