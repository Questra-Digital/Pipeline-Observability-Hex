'use client'
import { useEffect, useState, useMemo } from 'react';
import useFetch from '@/hooks/useFetch';

const Home = () => {
  const { data: stats, loading, fetchData } = useFetch('/api/dashboard/stats');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
    // Refresh interval every 30 seconds for live feel
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = useMemo(() => [
    {
      label: 'Connected Pipelines',
      value: (stats?.totalGitHubRepos || 0) + (stats?.totalArgoCDPipelines || 0),
      sub: 'Global Monitoring Streams',
      icon: '🚀',
      color: 'text-red-500',
      accent: '#dc2626'
    },
    {
      label: 'Active Integrations',
      value: stats?.totalIntegrations || 0,
      sub: 'Authenticated Connectors',
      icon: '🔌',
      color: 'text-amber-500',
      accent: '#f59e0b'
    },
    {
      label: 'GitHub Repos',
      value: stats?.totalGitHubRepos || 0,
      sub: 'Repository Syncs',
      icon: '📦',
      color: 'text-blue-500',
      accent: '#3b82f6'
    },
    {
      label: 'ArgoCD Apps',
      value: stats?.totalArgoCDPipelines || 0,
      sub: 'Application Clusters',
      icon: '☸️',
      color: 'text-emerald-500',
      accent: '#10b981'
    }
  ], [stats]);

  return (
    <div className="w-full min-h-screen bg-[#050505] flex flex-col px-8 py-12 relative overflow-hidden font-sans scroll-smooth">
      {/* ── LUXURY BACKGROUND ── */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(220, 38, 38, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(220, 38, 38, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
      </div>

      {/* Animated Scan Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-red-600/30 blur-md animate-[scan_10s_linear_infinite] pointer-events-none" />

      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[150px] pointer-events-none" />

      {/* ── HEADER ── */}
      <div className={`relative z-10 flex flex-col md:flex-row justify-between items-end mb-16 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="px-2 py-0.5 rounded bg-red-600/10 border border-red-600/20 text-[8px] font-black text-red-600 uppercase tracking-[0.4em]">Integrated Intelligence Mode</div>
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_12px_rgba(255,0,0,0.8)]" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none italic uppercase">
            VIZOPS <span className="text-red-600">COMMAND</span>
          </h1>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.5em] mt-3">Advanced Pipeline Observability Terminal</p>
        </div>
        <div className="hidden md:flex flex-col items-end text-right">
          <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
            <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest block mb-1">Last Telemetry Refresh</span>
            <span className="text-xs font-mono text-white font-bold">
              {mounted ? new Date().toLocaleTimeString() : '--:--:--'}
              {' '}<span className="text-red-900/40">GMT+5</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN KPI ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
        {kpis.map((stat, i) => (
          <div key={i} className="relative group overflow-hidden rounded-3xl p-[1px] transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 bg-gradient-to-br transition-opacity duration-500"
              style={{ background: `linear-gradient(135deg, ${stat.accent}40, transparent 70%)` }} />
            <div className="bg-[#0a0a0a] backdrop-blur-2xl p-8 rounded-[23px] relative h-full flex flex-col justify-between border border-white/5">
              <div className="flex justify-between items-start mb-6">
                <span className="text-3xl opacity-80 group-hover:rotate-12 transition-transform duration-500">{stat.icon}</span>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-gray-700 font-black uppercase">Sensor</span>
                  <span className="text-[10px] text-white/40 font-bold lowercase">0x{i}AF</span>
                </div>
              </div>
              <div>
                <h3 className={`text-5xl font-black tracking-tighter ${stat.color} mb-1 animate-in slide-in-from-left duration-700 delay-${i * 100}`}>
                  {!stats && loading ? '...' : stat.value}
                </h3>
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">{stat.sub}</p>
              </div>
              {/* Micro-sparkline decoration */}
              <div className="mt-8 flex gap-1 items-end h-3 group-hover:h-5 transition-all duration-500">
                {[0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.2, 0.6, 0.4, 0.9].map((h, j) => (
                  <div key={j} className="flex-1 bg-white/10 rounded-t-sm group-hover:bg-red-600/20 transition-colors" style={{ height: `${h * 100}%` }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── SMART INSIGHTS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

        {/* Global Health Monitor */}
        <div className="lg:col-span-2 bg-[#080808] border border-white/5 rounded-[40px] p-12 relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-red-600/5 blur-[120px] rounded-full group-hover:bg-red-600/10 transition-all duration-1000" />

          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-[20px] bg-red-600/5 border border-red-600/20 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.1)]">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-red-600"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" /></svg>
              </div>
              <div>
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">GLOBAL OPS PULSE</h4>
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em] mt-1 italic">Real-time throughput analysis</p>
              </div>
            </div>
            <div className="px-6 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full flex gap-3 items-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Analytics Online</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group/p relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-600 opacity-40 group-hover:w-full group-hover:opacity-5 transition-all duration-500" />
                <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest block mb-4">Total Build Throughput (24h)</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-white tracking-tighter">{stats?.totalBuilds24h || 0}</span>
                  <span className="text-xs text-red-600 font-black uppercase tracking-widest">Pipelines</span>
                </div>
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl relative overflow-hidden">
                <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest block mb-4">Global Network Health Score</span>
                <div className="flex items-center gap-6">
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-600 to-emerald-500 transition-all duration-1000"
                      style={{ width: `${stats?.globalSuccessRate || 0}%` }} />
                  </div>
                  <span className="text-2xl font-black text-white">{stats?.globalSuccessRate?.toFixed(1) || '0.0'}%</span>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center aspect-square md:aspect-auto md:h-64 bg-white/[0.01] border border-white/5 rounded-[30px] overflow-hidden">
              {/* High-tech Gauge Mockup */}
              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <div className="w-48 h-48 rounded-full border border-red-600/10 flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full border-2 border-dashed border-red-600/20 animate-[spin_20s_linear_infinite]" />
                  <div className="absolute text-[8px] font-black text-red-600/40 uppercase tracking-tighter transform translate-y-24">Telemetry Active</div>
                </div>
                <div className="absolute text-7xl font-black text-white/5 tracking-tighter select-none">INTELLIGENCE</div>
              </div>
              {/* Pulse Line */}
              <svg className="w-full h-full px-10 overflow-visible" viewBox="0 0 200 100">
                <path d="M0,50 L30,50 L40,20 L55,80 L70,50 L100,50 L110,10 L125,90 L140,50 L200,50"
                  fill="none" stroke="#dc2626" strokeWidth="1" strokeDasharray="500" strokeDashoffset="500" className="animate-[dash_4s_linear_infinite]" />
              </svg>
            </div>
          </div>
        </div>

        {/* Live Anomaly Feed */}
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10 group hover:border-red-600/20 transition-all duration-500 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-[12px] font-black text-white uppercase tracking-[0.4em]">LIVE ANOMALIES</h4>
              <span className="px-2 py-0.5 rounded bg-red-600/10 text-[8px] font-black text-red-600 animate-pulse tracking-widest">THREAT DETECT</span>
            </div>

            <div className="space-y-4 flex-1">
              {(!stats?.recentAnomalies || stats.recentAnomalies.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-30">
                  <div className="text-5xl mb-4">🛡️</div>
                  <p className="text-[9px] font-black uppercase tracking-widest">No anomlies detected</p>
                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-2">Security perimeter nominal</p>
                </div>
              ) : (
                stats.recentAnomalies.map((a, i) => (
                  <div key={i} className="p-5 bg-red-600/5 border border-red-600/10 rounded-3xl hover:bg-red-600/10 transition-colors animate-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter truncate max-w-[150px]">{a.workflowName}</span>
                      <span className="text-[8px] bg-red-600 text-white px-1.5 rounded font-black">!</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed mb-3 line-clamp-2">{a.anomalyReason}</p>
                    <div className="flex justify-between items-center text-[8px] font-black text-gray-700 uppercase tracking-widest">
                      <span>#{a.runId}</span>
                      <span>{new Date(a.startedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex justify-between items-center px-4 py-3 bg-white/[0.02] rounded-2xl border border-white/5">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Neural Link Sync</span>
                <span className="text-[9px] text-emerald-500 font-black uppercase">Established</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="mt-auto pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="text-[11px] font-black text-gray-800 uppercase tracking-[0.8em] flex items-center gap-4">
          <div className="w-4 h-[1px] bg-gray-800" />
          VIZOPS · TERMINAL N01
          <div className="w-4 h-[1px] bg-gray-800" />
        </div>
        <div className="flex gap-12">
          <div className="flex flex-col items-start">
            <span className="text-[7px] text-gray-700 font-black uppercase mb-1">Architecture</span>
            <span className="text-[10px] text-gray-400 font-bold">NEXT_VIZ_R3</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[7px] text-gray-700 font-black uppercase mb-1">Gateway</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">STITCH_REDUX_RELAY</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[7px] text-gray-700 font-black uppercase mb-1">Deployment</span>
            <span className="text-[10px] text-emerald-600 font-black">STABLE_CLUSTER_04</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-50px); opacity: 0; }
          40% { opacity: 0.8; }
          60% { opacity: 0.8; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        @keyframes dash {
            to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default Home;