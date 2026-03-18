'use client'
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import LinkAtom from "@/components/atoms/LinkAtom";
import { useConfiguredApps } from '@/hooks/useConfiguredApps';
import { fetchAnalytics } from '@/redux/features/analytics/analyticsSlice';

const Home = () => {
  useConfiguredApps();
  const dispatch = useDispatch();
  const { data, runs, loading } = useSelector(state => state.analytics);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    dispatch(fetchAnalytics());

    // Refresh interval every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchAnalytics());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Data processing logic
  const totalBuilds = data?.conclusions?.reduce((acc, curr) => acc + curr.count, 0) || 0;
  const successCount = data?.conclusions?.find(c => c._id === 'success')?.count || 0;
  const successRate = totalBuilds > 0 ? ((successCount / totalBuilds) * 100).toFixed(1) : '0';

  const avgLatency = data?.bottlenecks?.length
    ? (data.bottlenecks.reduce((acc, curr) => acc + (curr.avgDuration || 0), 0) / data.bottlenecks.length).toFixed(0)
    : '0';

  const formatValue = (val) => val.toLocaleString();

  return (
    <div className="w-full min-h-screen bg-[#050505] flex flex-col px-8 py-10 relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(220, 38, 38, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(220, 38, 38, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            animation: 'gridMove 30s linear infinite'
          }}
        />
      </div>

      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Section */}
      <div className={`relative z-10 flex flex-col md:flex-row justify-between items-end mb-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.6)]" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em]">Command Center v2.4.0</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            DASHBOARD <span className="text-red-600">OVERVIEW</span> {loading && <span className="text-xs text-red-900/40 ml-4 animate-pulse uppercase">Syncing...</span>}
          </h1>
        </div>
        <div className="hidden md:flex flex-col items-end text-right">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-none mb-1">Last Sync</p>
          <p className="text-sm font-mono text-gray-400">
            {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            <span className="text-red-900/40 ml-2">GMT+5</span>
          </p>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 relative z-10">
        {[
          { label: 'Total Builds', value: formatValue(totalBuilds), change: '+12%', color: 'red' },
          { label: 'Active Pipelines', value: runs?.length || '0', change: 'Live', color: 'red' },
          { label: 'Success Rate', value: `${successRate}%`, change: '+0.2%', color: 'red' },
          { label: 'Avg Latency', value: `${avgLatency}s`, change: '-4s', color: 'red' }
        ].map((stat, i) => (
          <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-xl hover:border-red-600/30 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="w-12 h-12 bg-red-600 rounded-full" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
              <span className="text-[10px] font-medium text-red-500">{stat.change}</span>
            </div>
            <div className="mt-4 w-full h-1 bg-[#151515] rounded-full overflow-hidden">
              <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: mounted ? '70%' : '0%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 flex-grow">

        {/* Active Pipelines Panel */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl flex flex-col overflow-hidden">
          <div className="p-6 border-b border-[#1a1a1a] flex justify-between items-center bg-[#0d0d0d]">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
              <span className="w-2 h-4 bg-red-600 rounded-sm" />
              Active Monitoring
            </h3>
            <LinkAtom link="/integrations" text="View All" properties="text-[10px] uppercase font-bold text-red-600 hover:text-red-500 transition-colors" />
          </div>
          <div className="p-6 space-y-6 flex-grow overflow-y-auto max-h-[500px] scrollbar-hide">
            {runs && runs.length > 0 ? runs.slice(0, 5).map((run, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[#0d0d0d] border border-[#151515] group hover:border-red-900/40 transition-all">
                <div className="w-10 h-10 rounded-lg bg-[#151515] flex items-center justify-center border border-[#222]">
                  <div className={`w-3 h-3 rounded-full ${run.status === 'in_progress' ? 'bg-red-600 animate-pulse' : run.conclusion === 'success' ? 'bg-green-600' : 'bg-red-900'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-gray-200 truncate max-w-[200px] uppercase">{run.workflowName}</h4>
                    <span className="text-[10px] font-mono text-gray-500">#{run.runId}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-900 to-red-600" style={{ width: run.status === 'in_progress' ? '65%' : '100%' }} />
                    </div>
                    <span className="text-[10px] font-bold text-red-500 uppercase">{run.status}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 py-10">
                <p className="text-xs uppercase tracking-widest">No Active Pipelines found</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Utils */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#1a1a1a] bg-[#0d0d0d]">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Rapid Command</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-[#0d0d0d] border border-[#151515] hover:border-red-600/40 hover:bg-red-600/5 transition-all group">
                <div className="w-8 h-8 rounded bg-red-600/10 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-10h-9l1-8z" /></svg>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Trigger Build</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-[#0d0d0d] border border-[#151515] hover:border-red-600/40 hover:bg-red-600/5 transition-all group">
                <div className="w-8 h-8 rounded bg-red-600/10 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">View Logs</span>
              </button>
            </div>
          </div>

          {/* System Health Status */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-2xl rounded-full" />
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">System Health</h3>
              <div className="flex items-center gap-1.5 underline-offset-4 decoration-red-600/20 underline">
                <span className="text-[10px] font-bold text-red-500">99%</span>
              </div>
            </div>
            <div className="space-y-4">
              {['API Core', 'Worker Cluster', 'DB Relay'].map((service, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{service}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(j => (
                      <div key={j} className={`w-1.5 h-1.5 rounded-sm ${j === 5 && i === 1 ? 'bg-red-900 animate-pulse' : 'bg-red-600'}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Branding */}
      <div className="mt-12 pt-8 border-t border-[#1a1a1a] flex justify-between items-center text-[10px] font-bold text-gray-700 uppercase tracking-[0.3em]">
        <span>© 2026 VIZOPS INTEL</span>
        <div className="flex gap-8">
          <span className="text-red-900/60">Status: Nominal</span>
          <span className="hover:text-red-500 cursor-pointer transition-colors">Documentation</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
      `}</style>
    </div>
  );
};

export default Home;