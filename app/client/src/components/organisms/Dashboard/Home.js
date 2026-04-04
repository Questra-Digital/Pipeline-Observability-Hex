'use client';
import { useEffect, useState, useMemo } from 'react';
import useFetch from '@/hooks/useFetch';

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmtTime = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

/* ─── Animated live clock ──────────────────────────────────────── */
const LiveClock = () => {
    const [t, setT] = useState('');
    useEffect(() => { setT(fmtTime()); const id = setInterval(() => setT(fmtTime()), 1000); return () => clearInterval(id); }, []);
    return <span className="font-mono text-white font-black text-sm">{t}</span>;
};

/* ─── Micro bar spark ─────────────────────────────────────────── */
const Spark = ({ accent }) => (
    <div className="flex items-end gap-0.5 h-5 mt-3">
        {[0.3, 0.7, 0.5, 1, 0.6, 0.8, 0.4, 0.9, 0.5, 0.7, 0.3, 0.6].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm opacity-40 transition-all duration-700"
                style={{ height: `${h * 100}%`, background: accent }} />
        ))}
    </div>
);

/* ─── KPI card ─────────────────────────────────────────────────── */
const KPICard = ({ label, value, sub, icon, accent, loading, index }) => (
    <div
        className="relative rounded-3xl overflow-hidden border border-white/[0.06] bg-[#0a0a0a] hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] group cursor-default"
        style={{ animationDelay: `${index * 80}ms` }}
    >
        {/* top accent line */}
        <div className="absolute top-0 left-0 w-full h-[1px]"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}70, transparent)` }} />
        {/* subtle glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: accent + '12' }} />

        <div className="p-6 relative">
            <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-white/5"
                    style={{ background: accent + '12' }}>
                    {icon}
                </div>
                <div className="text-right">
                    <span className="text-[7px] text-gray-800 font-black uppercase tracking-widest block">sensor</span>
                    <span className="text-[9px] font-mono text-gray-700">0x{String(index).padStart(2, '0')}</span>
                </div>
            </div>
            <div className="mb-1">
                <span className="text-4xl font-black tracking-tighter leading-none" style={{ color: loading ? '#1f1f1f' : accent }}>
                    {loading ? '—' : value}
                </span>
            </div>
            <p className="text-[10px] font-black text-white uppercase tracking-widest">{label}</p>
            <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest mt-0.5">{sub}</p>
            <Spark accent={accent} />
        </div>
    </div>
);

/* ─── System node indicator ────────────────────────────────────── */
const Node = ({ label, status, color }) => (
    <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-all">
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full`} style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{status}</span>
        </div>
    </div>
);

/* ─── Anomaly item ─────────────────────────────────────────────── */
const AnomalyItem = ({ a, index }) => (
    <div className="flex gap-4 p-4 bg-[#0a0a0a] rounded-2xl border border-red-600/10 hover:border-red-600/20 transition-all duration-300"
        style={{ animationDelay: `${index * 100}ms` }}>
        <div className="w-7 h-7 rounded-lg bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
            <span className="text-[10px]">⚡</span>
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">{a.workflowName}</p>
            <p className="text-[9px] text-gray-600 font-mono mt-0.5 truncate">{a.anomalyReason}</p>
        </div>
        <span className="text-[8px] text-gray-800 font-mono shrink-0 self-end">
            {a.startedAt ? new Date(a.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
    </div>
);

/* ─── Root component ───────────────────────────────────────────── */
const Home = () => {
    const { data: stats, loading, fetchData } = useFetch('/api/dashboard/stats');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchData();
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const kpis = useMemo(() => [
        { label: 'Connected Pipelines', value: (stats?.totalGitHubRepos || 0) + (stats?.totalArgoCDPipelines || 0), sub: 'Monitoring Streams', icon: '🚀', accent: '#dc2626' },
        { label: 'Active Integrations', value: stats?.totalIntegrations || 0, sub: 'Authenticated Connectors', icon: '🔌', accent: '#f59e0b' },
        { label: 'GitHub Repos', value: stats?.totalGitHubRepos || 0, sub: 'Repository Syncs', icon: '📦', accent: '#3b82f6' },
        { label: 'ArgoCD Apps', value: stats?.totalArgoCDPipelines || 0, sub: 'Application Clusters', icon: '☸️', accent: '#10b981' },
    ], [stats]);

    const health = stats?.globalSuccessRate ?? 0;
    const healthColor = health >= 90 ? '#10b981' : health >= 70 ? '#f59e0b' : '#dc2626';

    const anomalies = stats?.recentAnomalies || [];

    return (
        <div className="min-h-screen bg-[#060606] text-white">

            {/* ── PAGE HEADER ──────────────────────────────────────── */}
            <div className="px-8 pt-10 pb-8 border-b border-white/[0.04]">
                <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_#dc2626]" />
                            <span className="text-[9px] font-black text-red-600/60 uppercase tracking-[0.4em]">Neural Intelligence Hub · Active</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-white">
                            Ops<br />
                            <span className="text-red-600">Command</span>
                        </h1>
                        <p className="text-[10px] text-gray-700 font-mono uppercase tracking-widest mt-3">
                            {fmtDate()}
                        </p>
                    </div>

                    <div className="flex items-end gap-4">
                        {/* Live time */}
                        <div className="flex flex-col items-end bg-[#0a0a0a] border border-white/[0.06] rounded-2xl px-6 py-4">
                            <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest mb-1">System Time</span>
                            {mounted ? <LiveClock /> : <span className="font-mono text-gray-700 text-sm">--:--:--</span>}
                            <span className="text-[8px] text-gray-800 font-mono mt-0.5">GMT+5</span>
                        </div>

                        {/* Global health pill */}
                        <div className="flex flex-col items-center bg-[#0a0a0a] border border-white/[0.06] rounded-2xl px-6 py-4">
                            <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest mb-1">Global Health</span>
                            <span className="text-2xl font-black" style={{ color: healthColor }}>
                                {stats ? `${health.toFixed(0)}%` : '—'}
                            </span>
                            <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${health}%`, background: healthColor }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KPI GRID ────────────────────────────────────────── */}
            <div className="px-8 py-8">
                <div className="flex items-center gap-3 mb-5">
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Telemetry</span>
                    <div className="flex-1 h-[1px] bg-white/[0.04]" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map((k, i) => (
                        <KPICard key={i} index={i} loading={loading && !stats} {...k} />
                    ))}
                </div>
            </div>

            {/* ── BOTTOM SECTION ──────────────────────────────────── */}
            <div className="px-8 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Throughput Panel ─────────────────────────────── */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/[0.06] rounded-3xl overflow-hidden">
                    {/* panel header */}
                    <div className="px-7 py-5 border-b border-white/[0.04] flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Operations Center</p>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">Global Ops Pulse</h3>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
                        </div>
                    </div>

                    {/* metrics */}
                    <div className="p-7 space-y-5">
                        {/* 24h throughput */}
                        <div className="flex items-center justify-between p-5 bg-[#070707] rounded-2xl border border-white/[0.04] group hover:border-white/[0.08] transition-all">
                            <div>
                                <span className="text-[9px] text-gray-700 font-black uppercase tracking-widest block mb-2">Build Throughput (24h)</span>
                                <span className="text-4xl font-black text-white tracking-tighter">{stats?.totalBuilds24h ?? 0}</span>
                                <span className="text-xs text-gray-700 font-black uppercase ml-3">pipelines</span>
                            </div>
                            <div className="opacity-30 group-hover:opacity-60 transition-opacity">
                                <svg width="80" height="36" viewBox="0 0 80 36">
                                    <polyline points="0,28 10,20 20,24 30,10 40,18 50,8 60,14 70,4 80,10"
                                        fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {/* Health bar */}
                        <div className="p-5 bg-[#070707] rounded-2xl border border-white/[0.04]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[9px] text-gray-700 font-black uppercase tracking-widest">Network Health Score</span>
                                <span className="text-xl font-black" style={{ color: healthColor }}>{health.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${health}%`, background: `linear-gradient(90deg, #dc2626, ${healthColor})` }} />
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className="text-[8px] font-mono text-gray-800">0%</span>
                                <span className="text-[8px] font-mono text-gray-800">100%</span>
                            </div>
                        </div>

                        {/* System nodes */}
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest block mb-3">System Nodes</span>
                            <Node label="GitHub Actions Sync" status="Active" color="#10b981" />
                            <Node label="AI Analysis Engine" status="Standby" color="#f59e0b" />
                            <Node label="Webhook Agent" status="Ready" color="#10b981" />
                            <Node label="Failure Watchdog" status="Monitoring" color="#3b82f6" />
                        </div>
                    </div>
                </div>

                {/* ── Live Anomaly Feed ─────────────────────────────── */}
                <div className="flex flex-col bg-[#0a0a0a] border border-white/[0.06] rounded-3xl overflow-hidden">
                    <div className="px-7 py-5 border-b border-white/[0.04] flex items-center justify-between shrink-0">
                        <div>
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Threat Detection</p>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">Live Anomalies</h3>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-[8px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                            {anomalies.length} alert{anomalies.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="flex-1 p-5 space-y-2 overflow-y-auto custom-scrollbar">
                        {anomalies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                                <span className="text-5xl mb-4">🛡️</span>
                                <p className="text-[9px] font-black uppercase tracking-widest">No anomalies</p>
                                <p className="text-[8px] text-gray-600 mt-1 uppercase tracking-widest">Perimeter nominal</p>
                            </div>
                        ) : anomalies.map((a, i) => <AnomalyItem key={i} a={a} index={i} />)}
                    </div>

                    <div className="px-5 py-4 border-t border-white/[0.04] shrink-0">
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] text-gray-700 font-bold uppercase tracking-widest">Neural Link</span>
                            <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Synced</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FOOTER STATUS BAR ───────────────────────────────── */}
            <div className="mx-8 mb-6 px-6 py-3 bg-[#080808] border border-white/[0.04] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest">VizOps · Terminal N01</span>
                    <div className="w-px h-3 bg-white/10" />
                    <span className="text-[8px] font-mono text-gray-800">NEXT_VIZ_R3</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">All Systems Nominal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
