"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import useFetch from "@/hooks/useFetch";
import GitHubAnalytics from "./GitHubAnalytics";
import RCAPanel from "./RCAPanel";
import LogViewer from "./LogViewer";
import instance from "@/axios/axios";

const Pipelines = () => {
  // --- State ---
  const [view, setView] = useState("selection"); // 'selection', 'argocd', 'github', 'github_details'
  const [detailTab, setDetailTab] = useState("runs"); // 'runs', 'status', 'monitoring', 'analytics'
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [rcaTarget, setRcaTarget] = useState(null); // { run, owner, repo }
  const [pipelines, setPipelines] = useState([]);
  const [filteredPipelines, setFilteredPipelines] = useState([]);
  const [ghSearchQuery, setGhSearchQuery] = useState("");
  const [activeLogJob, setActiveLogJob] = useState(null); // {id, name, repo, owner}
  const [logUrl, setLogUrl] = useState(null);
  const [logData, setLogData] = useState(null);
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [localSyncInterval, setLocalSyncInterval] = useState(3);
  const [isSavingSync, setIsSavingSync] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const router = useRouter();

  const { data: argoData, error: argoErr, loading: argoLoading, fetchData: fetchArgo } = useFetch("/all_pipelines");
  const { data: githubRepos, loading: reposLoading, fetchData: fetchRepos } = useFetch("/api/github/repos");
  const { data: ghRuns, error: ghErr, loading: ghLoading, fetchData: fetchGhRuns } = useFetch("/api/github/runs");
  const { data: analytics, fetchData: fetchAnalytics } = useFetch(`/api/github/analytics?repoId=${selectedRepo?.repoId || ''}`);
  const { data: correlations, fetchData: fetchCorrelations } = useFetch("/api/github/correlations");

  // --- Logic ---
  useEffect(() => {
    fetchArgo();
    fetchRepos();
    fetchGhRuns();
    fetchCorrelations();
    if (selectedRepo) fetchAnalytics();
    const interval = setInterval(() => {
      fetchGhRuns();
      fetchCorrelations();
      if (selectedRepo) fetchAnalytics();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedRepo]);

  useEffect(() => {
    if (selectedRepo && githubRepos) {
      const account = githubRepos.find(acc => acc.id === selectedRepo.accountId);
      if (account) setLocalSyncInterval(account.syncInterval || 3);
    }
  }, [selectedRepo, githubRepos]);

  useEffect(() => {
    if (!argoLoading) {
      if (argoData) {
        setPipelines(argoData.available_pipeline || []);
        if (view === "argocd") setFilteredPipelines(argoData.available_pipeline || []);
      }
      if (argoErr) ErrorToast("Error fetching ArgoCD Pipelines!");
    }
  }, [argoData, argoLoading, argoErr, view]);

  const handleDashboardClick = (pipelineName) => {
    router.push(`/dashboard/pipeline?pipeline=${encodeURIComponent(pipelineName)}`);
  };
  const handleHistoryClick = (pipelineName) => {
    router.push(`pipelineHistory?pipeline=${encodeURIComponent(pipelineName)}`);
  };

  const handleChange = (e) => {
    const search = e.target.value.toLowerCase();
    if (view === "argocd") {
      const filtered = pipelines.filter(p => p.toLowerCase().startsWith(search));
      setFilteredPipelines(filtered);
    }
  };

  const fetchLogs = async (job) => {
    setActiveLogJob(job);
    setShowLogViewer(true);
    setLogData(null);
    setLogsLoading(true);

    try {
      const token = JSON.parse(localStorage.getItem("userData"))?.token || "";
      const resp = await instance.get(`/api/github/logs?owner=${job.owner}&repo=${job.repo}&jobId=${job.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resp.status === 200) {
        setLogUrl(resp.data.url);
        if (resp.data.logs) {
          setLogData(resp.data.logs);
        }
      }
    } catch (err) {
      console.error("Log fetch error:", err);
      const errorMessage = err.response?.data?.error || "Logs not found on GitHub";
      setLogData(`[SYSTEM ERROR] Failed to fetch logs from GitHub.\n\nStatus: ${err.response?.status || 'Unknown'}\nReason: ${errorMessage}\n\n💡 TIP: GitHub Actions logs are typically purged after 90 days. If this run is older, the logs have likely been deleted by GitHub.`);
      const ErrorToastModule = await import("@/components/atoms/toastUtils/Toast");
      ErrorToastModule.ErrorToast("GitHub returned 404/500 for logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const getProgress = (run) => {
    if (run.status !== 'in_progress') return null;
    const avg = analytics?.bottlenecks?.find(b => b._id === run.workflowName)?.avgDuration || 120; // Default 2min if no data
    const elapsed = (new Date() - new Date(run.startedAt)) / 1000;
    const pct = Math.min(100, Math.round((elapsed / avg) * 100));
    const isAnomalous = elapsed > (avg * 1.5);
    const isHung = elapsed > (avg * 2.5);
    return { pct, isAnomalous, isHung, elapsed, avg };
  };

  const handleLogClick = (job) => {
    setActiveLogJob(job);
    setLogUrl(null);
    fetchLogs(job);
  };

  // --- Sub-renderers (Inside component to access state) ---

  const renderSelection = () => (
    <div className="w-full max-w-5xl mt-8 px-4 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12 text-center relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic mb-3">Neural Control Center</h1>
        <p className="text-red-600 font-mono text-[10px] tracking-[0.6em] uppercase opacity-80">Select Monitoring Stream</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">
        {/* ArgoCD Card */}
        <div
          onClick={() => { setView("argocd"); setFilteredPipelines(pipelines); }}
          className="group relative cursor-pointer rounded-[2.5rem] p-[2px] transition-all duration-700 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
        >
          {/* Animated Border Gradient */}
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_60%,#dc2626_100%)] animate-border-rotate opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative glass-card h-full rounded-[2rem] p-8 overflow-hidden flex flex-col items-center text-center">
            {/* Holographic Scanline */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-600/5 to-transparent h-20 w-full -translate-y-full group-hover:animate-scanline pointer-events-none"></div>

            {/* Background Neural Node Decor */}
            <div className="absolute -right-12 -top-12 opacity-5 animate-neural-pulse pointer-events-none group-hover:opacity-10 transition-opacity">
              <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="0.5"><circle cx="12" cy="12" r="10" /><path d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8Z" /><path d="M12 6a6 6 0 1 0 6 6a6 6 0 0 0-6-6Zm0 10a4 4 0 1 1 4-4a4 4 0 0 1-4 4Z" /></svg>
            </div>

            <div className="relative mb-8">
              {/* Outer Glow Handle */}
              <div className="absolute inset-x-0 -bottom-3 h-1 w-16 mx-auto bg-red-600 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-red-950/20 border border-red-600/30 inner-glow-red shadow-2xl group-hover:scale-110 group-hover:border-red-500 transition-all duration-700">
                <svg className="w-10 h-10 text-red-500 drop-shadow-[0_0_12px_rgba(220,38,38,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              </div>
            </div>

            <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase italic group-hover:text-red-500 transition-colors">ArgoCD</h2>
            <p className="text-gray-500 text-xs leading-relaxed mb-8 max-w-[240px] px-2">
              Neural GitOps orchestration. Monitor cluster application state and synchronization telemetry with precision.
            </p>
            <div className="flex items-center gap-3 bg-red-950/20 px-6 py-2.5 rounded-2xl border border-red-600/20 group-hover:border-red-600/40 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
              <span className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">
                {pipelines.length} Active Modules
              </span>
            </div>
          </div>
        </div>

        {/* GitHub Actions Card */}
        <div
          onClick={() => setView("github")}
          className="group relative cursor-pointer rounded-[2rem] p-[1.5px] transition-all duration-700 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
        >
          {/* Animated Border Gradient */}
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_60%,#dc2626_100%)] animate-border-rotate opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75"></div>

          <div className="relative glass-card h-full rounded-[2rem] p-8 overflow-hidden flex flex-col items-center text-center">
            {/* Holographic Scanline */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-600/5 to-transparent h-20 w-full -translate-y-full group-hover:animate-scanline pointer-events-none delay-75"></div>

            {/* Background Neural Node Decor */}
            <div className="absolute -left-12 -bottom-12 opacity-5 animate-neural-pulse pointer-events-none group-hover:opacity-10 transition-opacity">
              <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="0.5"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
            </div>

            <div className="relative mb-8">
              {/* Outer Glow Handle */}
              <div className="absolute inset-x-0 -bottom-3 h-1 w-16 mx-auto bg-red-600 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-red-950/20 border border-red-600/30 inner-glow-red shadow-2xl group-hover:scale-110 group-hover:border-red-500 transition-all duration-700">
                <svg className="w-10 h-10 text-red-500 drop-shadow-[0_0_12px_rgba(220,38,38,0.5)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
              </div>
            </div>

            <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase italic group-hover:text-red-500 transition-colors">GitHub Actions</h2>
            <p className="text-gray-500 text-xs leading-relaxed mb-8 max-w-[240px] px-2">
              Global workflow telemetry. Analyze run performance, identifies anomalies, and scales with your development stream.
            </p>
            <div className="flex items-center gap-3 bg-red-950/20 px-6 py-2.5 rounded-2xl border border-red-600/20 group-hover:border-red-600/40 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
              <span className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">
                {githubRepos?.flatMap(acc => acc.repositories?.filter(r => r.enabled) || []).length || 0} Managed Repos
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderArgoCD = () => (
    <div className="w-full md:w-[80%] mb-16 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8 px-2 border-b border-red-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-red-600 rounded-sm shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
          <h2 className="text-3xl font-black text-gray-100 tracking-tight uppercase italic">Argo Environment Sync</h2>
        </div>
        <button
          onClick={() => setView("selection")}
          className="px-4 py-2 bg-red-950/20 border border-red-600/30 rounded-lg text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-600 hover:text-white transition-all"
        >
          ← Exit Stream
        </button>
      </div>

      {/* Search for ArgoCD */}
      <div className="mb-10 relative">
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>
        <div className="relative flex items-center bg-[#0d0d0d] border border-red-900/30 rounded-xl overflow-hidden shadow-lg shadow-black/50">
          <div className="pl-6 text-red-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            className="w-full bg-transparent px-6 py-4 text-lg text-gray-100 outline-none placeholder-gray-700 font-medium tracking-tight"
            placeholder="Search managed pipelines..."
            onChange={handleChange}
          />
        </div>
      </div>

      {argoLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 w-full bg-[#0a0a0a] border border-white/5 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPipelines.map((pipeline, index) => (
            <div key={index} className="group relative bg-[#0a0a0a] border border-red-900/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between transition-all hover:border-red-600/30 hover:shadow-[0_0_30px_-5px_rgba(220,38,38,0.1)]">
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="h-14 w-14 rounded-xl bg-red-950/20 flex items-center justify-center border border-red-600/20 text-red-500 group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-100 tracking-tight">{pipeline}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Stable Sync Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6 md:mt-0">
                <button
                  onClick={() => handleDashboardClick(pipeline)}
                  className="px-6 py-3 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-600/10 active:scale-95"
                >
                  Control Room
                </button>
                <button
                  onClick={() => handleHistoryClick(pipeline)}
                  className="px-6 py-3 rounded-xl bg-black border border-white/10 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-white/30 transition-all active:scale-95"
                >
                  Timeline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGitHubRepos = () => {
    const enabledRepos = githubRepos?.flatMap(acc =>
      acc.repositories?.filter(r => r.enabled).map(r => ({ ...r, accountOwner: acc.owner }))
    ) || [];

    const filteredRepos = enabledRepos.filter(repo =>
      repo.name.toLowerCase().includes(ghSearchQuery.toLowerCase()) ||
      repo.accountOwner.toLowerCase().includes(ghSearchQuery.toLowerCase())
    );

    const failingCount = filteredRepos.filter(r => {
      const run = ghRuns?.find(run => run.repoId === r.repoId);
      return run?.conclusion === 'failure';
    }).length;

    return (
      <div className="w-full max-w-7xl px-4 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">

        {/* Systemic Outage Alert (Feature 9) */}
        {correlations?.filter(c => c.isSystemic).map((event, i) => (
          <div key={i} className="w-full mb-10 p-6 bg-red-600/10 border border-red-600/30 rounded-3xl animate-in zoom-in-95 duration-700 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl -mr-10 -mt-10 animate-pulse" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.4)]">
                <span className="text-3xl">⚠️</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Systemic Outage Detected</h3>
                  <span className="px-2 py-0.5 rounded bg-red-600/20 text-[8px] font-black text-red-500 uppercase tracking-widest border border-red-600/30">CROSS-REPO IMPACT</span>
                </div>
                <p className="text-gray-300 text-sm font-medium max-w-2xl leading-relaxed">
                  Detected <span className="text-red-400 font-bold">{event.category}</span> failures across <span className="text-red-400 font-bold">{event.repos.join(', ')}</span>.
                  This indicates a shared infrastructure or dependency issue that requires immediate attention.
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* COMMAND CENTER HEADER */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_15px_#dc2626]"></div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Stream Distribution Hub</h2>
            </div>
            <p className="text-red-600 font-mono text-[10px] tracking-[0.6em] uppercase opacity-70">Unified GitHub Action Telemetry</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-4 p-1.5 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-xl">
              <div className="flex flex-col items-center px-6 py-2 rounded-xl bg-red-950/20 border border-red-600/10">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Streams</span>
                <span className="text-2xl font-black text-white leading-none">{enabledRepos.length}</span>
              </div>
              <div className="flex flex-col items-center px-6 py-2 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Anomalies</span>
                <span className={`text-2xl font-black leading-none ${failingCount > 0 ? "text-red-600" : "text-emerald-500"}`}>{failingCount}</span>
              </div>
            </div>
            <button
              onClick={() => setView("selection")}
              className="group h-14 w-14 rounded-2xl bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 active:scale-90"
            >
              <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>
        </div>

        {/* SEARCH BAR REDESIGN */}
        <div className="w-full max-w-2xl mb-12 relative group">
          <div className="absolute inset-0 bg-red-600/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden focus-within:border-red-600/40 transition-all shadow-2xl">
            <div className="pl-6 text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              className="w-full bg-transparent px-6 py-5 text-sm text-white outline-none placeholder-gray-800 font-black uppercase tracking-widest"
              placeholder="Filter active neural streams..."
              value={ghSearchQuery}
              onChange={(e) => setGhSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {reposLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 w-full bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
              </div>
            ))}
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-24 h-24 rounded-full bg-red-950/10 border-2 border-dashed border-red-900/30 flex items-center justify-center mx-auto mb-8 animate-pulse text-red-900">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-500 uppercase tracking-widest">No Signals Intercepted</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {filteredRepos.map((repo) => {
              const repoRuns = ghRuns?.filter(run => run.repoId === repo.repoId) || [];
              const latestRun = repoRuns[0];
              const status = latestRun ? (latestRun.conclusion || latestRun.status) : "inactive";
              const isFailing = status === "failure";

              return (
                <div
                  key={repo.repoId}
                  onClick={() => { setSelectedRepo(repo); setView("github_details"); }}
                  className="group relative cursor-pointer rounded-[3rem] p-[1.5px] transition-all duration-700 hover:scale-[1.03] active:scale-95"
                >
                  {/* Animated Border Glow */}
                  <div className={`absolute inset-0 rounded-[3rem] bg-[conic-gradient(from_0deg,transparent_60%,#dc2626_100%)] animate-border-rotate opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ${isFailing ? "opacity-30" : ""}`}></div>

                  <div className="relative h-64 bg-[#0a0a0a] rounded-[3rem] p-10 overflow-hidden flex flex-col justify-between shadow-2xl">
                    {/* Status Gradient Strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${status === "success" ? "bg-emerald-500 shadow-[0_0_20px_#10b981]" : isFailing ? "bg-red-600 animate-pulse shadow-[0_0_25px_#dc2626]" : "bg-gray-800"}`}></div>

                    {/* Background ID decor */}
                    <span className="absolute -right-4 -top-4 text-[120px] font-black text-white/5 italic select-none pointer-events-none group-hover:text-red-600/5 transition-colors duration-700 leading-none">
                      {repo.repoId.toString().slice(-2)}
                    </span>

                    <div className="relative z-10 w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-red-600 font-black uppercase tracking-[0.4em] opacity-60 truncate max-w-[150px]">{repo.accountOwner}</span>
                        {latestRun?.anomalyScore > 0.5 && (
                          <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping"></div>
                        )}
                      </div>
                      <h3 className="text-3xl font-black text-white leading-tight tracking-tighter group-hover:text-red-500 transition-colors uppercase italic truncate underline-offset-8 decoration-red-600/30 underline decoration-2">{repo.name}</h3>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-6 pt-8 border-t border-white/5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-gray-700 font-black uppercase tracking-widest">Stream Status</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-black uppercase tracking-tighter ${status === "success" ? "text-emerald-500" : isFailing ? "text-red-600" : "text-gray-500"}`}>
                            {status === "success" ? "Stable" : isFailing ? "Critical" : status}
                          </span>
                          {isFailing && <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#dc2626]"></div>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-[9px] text-gray-700 font-black uppercase tracking-widest">Telemetry</span>
                        <span className="text-xs font-black text-white group-hover:text-red-500 transition-colors">{repoRuns.length} Tracks</span>
                      </div>
                    </div>

                    {/* Activity Micro-Sparkline (Visual only for aesthetic) */}
                    <div className="absolute bottom-10 right-10 flex items-end gap-1 h-8 opacity-20 group-hover:opacity-60 transition-opacity">
                      {[40, 70, 30, 90, 50, 80, 20].map((h, i) => (
                        <div key={i} className={`w-1 rounded-full ${isFailing && i === 5 ? "bg-red-600" : "bg-white"}`} style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  const renderGitHubSettings = () => {
    if (!selectedRepo) return null;
    const account = githubRepos?.find(acc => acc.id === selectedRepo.accountId);

    const handleSaveSync = async () => {
      setIsSavingSync(true);
      try {
        const token = JSON.parse(localStorage.getItem("userData"))?.token || "";
        const resp = await instance.post("/api/github/account/sync",
          { accountId: selectedRepo.accountId, interval: parseInt(localSyncInterval) },
          { headers: { "Authorization": `Bearer ${token}` } }
        );
        if (resp.status === 200) {
          const SuccessToastModule = await import("@/components/atoms/toastUtils/Toast");
          SuccessToastModule.SuccessToast("Sync Interval Update Propagated to Microservice");
          fetchRepos(); // Refresh to get updated interval
        } else {
          const ErrorToastModule = await import("@/components/atoms/toastUtils/Toast");
          ErrorToastModule.ErrorToast("Transmission Failed");
        }
      } catch (err) {
        const ErrorToastModule = await import("@/components/atoms/toastUtils/Toast");
        ErrorToastModule.ErrorToast("Neural Link Offset Error");
      } finally {
        setIsSavingSync(false);
      }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="glass-card rounded-[3.5rem] p-16 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/40 to-transparent"></div>
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-red-600/5 blur-[120px] rounded-full group-hover:bg-red-600/10 transition-colors duration-1000"></div>

          <div className="relative z-10 mb-12">
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Sync Deviation Control</h3>
            <p className="text-[11px] text-gray-500 font-black uppercase tracking-[0.3em] leading-relaxed">
              Adjust the real-time telemetry frequency for the {account?.name || 'GitHub'} node.
              Lower values provide higher resolution but increase API load.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <label className="text-[10px] text-red-600 font-black uppercase tracking-[0.4em] px-2 italic">Current Offset (Seconds)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="3600"
                  value={localSyncInterval}
                  onChange={(e) => setLocalSyncInterval(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-6 px-8 text-3xl font-black text-white outline-none focus:border-red-600 transition-all placeholder:text-gray-900"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-800 font-black italic uppercase text-xs tracking-widest pointer-events-none">SEC</div>
              </div>
            </div>

            <button
              onClick={handleSaveSync}
              disabled={isSavingSync}
              className={`w-full py-6 rounded-2xl bg-red-600 text-white font-black uppercase tracking-[0.4em] italic text-[11px] transition-all hover:bg-red-700 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] active:scale-95 ${isSavingSync ? 'opacity-50 animate-pulse' : ''}`}
            >
              {isSavingSync ? "Syncing Logic..." : "Deploy Configuration"}
            </button>

            <div className="flex items-center gap-4 px-2">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
              <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest">Changes propagate across all shards in ~100ms</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-[3.5rem] p-16 relative overflow-hidden flex flex-col justify-center border-dashed border-white/5 opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex flex-col items-center text-center gap-8">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase italic tracking-tighter mb-2">Neural Security Override</h4>
              <p className="text-[9px] text-gray-700 font-black uppercase leading-relaxed tracking-widest">Additional nodal controls like shard isolation and logic pruning are currently locked under security protocol 7.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };



  const renderGitHubRunDetails = () => {
    if (!selectedRepo) return null;
    const repoRuns = ghRuns?.filter(run => run.repoId === selectedRepo.repoId) || [];

    // Status tab computed values
    const total = repoRuns.length;
    const successes = repoRuns.filter(r => r.conclusion === 'success').length;
    const failures = repoRuns.filter(r => r.conclusion === 'failure').length;
    const successRate = total > 0 ? ((successes / total) * 100).toFixed(1) : null;
    const avgDurSec = total > 0 ? Math.round(repoRuns.reduce((s, r) => s + (r.duration || 0), 0) / total) : 0;
    const fmtDur = (s) => { if (!s) return '—'; const m = Math.floor(s / 60), sec = s % 60; return m > 0 ? `${m}m ${sec}s` : `${sec}s`; };
    const latestRun = repoRuns[0];
    const statusColor = successRate >= 80 ? 'text-emerald-500' : successRate >= 50 ? 'text-amber-500' : 'text-red-500';

    return (
      <div className="w-full max-w-7xl px-4 mb-24 relative z-10 flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 overflow-hidden">

        {/* DETAIL NAVIGATION HEADER */}
        <div className="flex flex-col gap-6 pb-10 border-b border-red-900/20">
          <div className="flex items-center gap-6 min-w-0 flex-1">
            <button
              onClick={() => { setView("github"); setSelectedRepo(null); }}
              className="group h-14 w-14 rounded-2xl bg-black/40 border border-white/10 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-90 shrink-0"
            >
              <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">GitHub Actions</span>
                <span className="text-[10px] text-gray-700 font-black">/</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">{selectedRepo.accountOwner}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none truncate" title={selectedRepo.name}>{selectedRepo.name}</h2>
            </div>
          </div>

          <div className="flex items-center bg-[#050505] p-1.5 rounded-2xl border border-white/5 backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar w-full">
            {[
              { id: 'runs', label: 'Run History' },
              { id: 'status', label: 'Status' },
              { id: 'monitoring', label: 'Job Trace' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'settings', label: 'Settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${detailTab === tab.id ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]" : "text-gray-600 hover:text-gray-300"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {detailTab === 'analytics' ? (
          <GitHubAnalytics onBack={() => setDetailTab('runs')} repoId={selectedRepo.repoId} />
        ) : detailTab === 'settings' ? (
          renderGitHubSettings()
        ) : detailTab === 'monitoring' ? (
          <div className="grid grid-cols-1 gap-8">
            <div className="glass-card rounded-[2rem] p-8 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/40 to-transparent"></div>

              <div className="relative z-10 mb-8 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Job Trace — Latest Run</h3>
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Step-by-step execution breakdown for the most recent workflow run</p>
                </div>
                {repoRuns[0] && (
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Run #{String(repoRuns[0].runId).slice(-6)}</span>
                  </div>
                )}
              </div>

              {repoRuns[0] ? (
                <div className="relative z-10 flex flex-col gap-6">
                  {repoRuns[0].jobs?.map((job, jIdx) => (
                    <div key={job.id} className="relative">
                      {jIdx < repoRuns[0].jobs.length - 1 && (
                        <div className="absolute left-7 top-full h-6 w-[2px] bg-gradient-to-b from-red-600/20 to-transparent"></div>
                      )}
                      <div className="p-6 bg-black/40 rounded-2xl border border-white/5 hover:border-red-600/20 transition-all duration-300 group/job">
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base border transition-all ${job.conclusion === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-red-600/5 border-red-600/30 text-red-600'}`}>
                              {job.conclusion === 'success' ? '✓' : '!'}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover/job:text-red-400 transition-colors">{job.name}</h4>
                              <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Job {jIdx + 1} · {job.conclusion || 'running'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {job.conclusion === 'failure' && (
                              <button
                                onClick={() => setRcaTarget({ run: repoRuns[0], owner: selectedRepo.accountOwner, repo: selectedRepo.name })}
                                className="px-4 py-2 bg-red-950/40 border border-red-600/40 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-600/20 transition-all"
                              >
                                🧠 Diagnose
                              </button>
                            )}
                            <button
                              onClick={() => handleLogClick({ id: job.id, name: job.name, repo: selectedRepo.name, owner: selectedRepo.accountOwner })}
                              className="px-4 py-2 bg-black/60 border border-white/5 hover:border-red-600/30 text-gray-400 hover:text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                              Terminal
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                          {job.steps?.map((step, sIdx) => (
                            <div key={sIdx} className="bg-[#050505] p-3 rounded-xl border border-white/5 hover:border-red-600/20 transition-all group/step relative overflow-hidden">
                              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${step.conclusion === 'success' ? 'bg-emerald-500' : step.conclusion === 'failure' ? 'bg-red-600' : 'bg-gray-700'}`}></div>
                              <span className="text-[8px] text-gray-700 font-bold block mb-1">Step {step.number}</span>
                              <p className="text-[10px] font-bold text-gray-400 group-hover/step:text-white transition-colors truncate" title={step.name}>{step.name}</p>
                              <span className={`text-[8px] font-black uppercase mt-1 block ${step.conclusion === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{step.conclusion || 'pending'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center bg-black/20 rounded-2xl border-2 border-dashed border-white/5">
                  <p className="text-gray-700 font-bold text-sm uppercase tracking-widest">No run data available</p>
                  <p className="text-gray-800 text-xs font-bold uppercase tracking-widest mt-2">Enable monitoring and wait for runs to sync</p>
                </div>
              )}
            </div>
          </div>
        ) : detailTab === 'status' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight mb-6">Repository Status Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded-2xl border border-white/5 relative">
                  <svg className="w-40 h-40 -rotate-90">
                    <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                    <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="10" fill="transparent"
                      strokeDasharray={427} strokeDashoffset={total > 0 ? 427 * (1 - successes / total) : 427}
                      className={successRate >= 80 ? 'text-emerald-500' : successRate >= 50 ? 'text-amber-500' : 'text-red-500'} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black ${statusColor}`}>{successRate !== null ? `${successRate}%` : '—'}</span>
                    <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest mt-1">Success Rate</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { l: 'Total Runs', v: total || '—', c: 'text-white' },
                    { l: 'Successful', v: successes || '—', c: 'text-emerald-500' },
                    { l: 'Failed', v: failures || '—', c: failures > 0 ? 'text-red-500' : 'text-gray-500' },
                    { l: 'Avg Build Time', v: fmtDur(avgDurSec), c: 'text-blue-400' },
                    { l: 'Latest Status', v: latestRun?.conclusion?.toUpperCase() || '—', c: latestRun?.conclusion === 'success' ? 'text-emerald-500' : 'text-red-500' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{item.l}</span>
                      <span className={`text-xs font-black ${item.c}`}>{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-8 flex flex-col gap-4">
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Recent Activity</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {repoRuns.slice(0, 10).map((run, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${run.conclusion === 'success' ? 'bg-emerald-500' : run.conclusion === 'failure' ? 'bg-red-500' : 'bg-gray-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-300 truncate">{run.workflowName}</p>
                      <p className="text-[8px] text-gray-700 font-bold">{new Date(run.startedAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[8px] font-black text-gray-500 shrink-0">{Math.round(run.duration || 0)}s</span>
                  </div>
                ))}
                {repoRuns.length === 0 && (
                  <p className="text-gray-700 text-xs font-bold uppercase tracking-widest text-center py-8">No runs yet</p>
                )}
              </div>
            </div>
          </div>


        ) : (
          /* RUN HISTORY */
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-red-600 font-black uppercase tracking-widest">Workflow Run History</span>
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{repoRuns.length} runs</span>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {repoRuns.map((run) => {
                const isFailing = run.conclusion === 'failure';
                return (
                  <div key={run.runId} className="group glass-card rounded-3xl overflow-hidden hover:border-red-600/40 transition-all duration-500 shadow-2xl">
                    <div className="p-8 flex flex-col lg:flex-row items-center justify-between gap-10">
                      <div className="flex items-center gap-10 w-full lg:w-auto">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl border-2 transition-all duration-700 ${run.conclusion === "success" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : isFailing ? "bg-red-600/5 border-red-600/40 text-red-600 shadow-[0_0_30px_rgba(220,38,38,0.2)]" : "bg-gray-800/20 border-gray-800/40 text-gray-600"}`}>
                          {run.conclusion === "success" ? "✓" : isFailing ? "✕" : "○"}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[9px] text-red-600 font-black uppercase tracking-[0.4em] opacity-60 truncate max-w-[200px]">{run.workflowName}</span>
                            {run.anomalyScore > 0.5 && <div className="px-2 py-0.5 rounded-full bg-red-600 text-[8px] font-black text-white uppercase animate-pulse">Anomaly</div>}
                            {run.status === 'in_progress' && (
                              <div className="px-2 py-0.5 rounded-full bg-blue-500 text-[8px] font-black text-white uppercase animate-pulse">Live Pulse</div>
                            )}
                          </div>
                          <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic truncate">Stream #{run.runId.toString().slice(-6)}</h3>

                          {/* Predictive Pulse Progress Bar (Feature 8) */}
                          {(() => {
                            const prog = getProgress(run);
                            if (!prog) return null;
                            return (
                              <div className="flex items-center gap-4 mt-3 mb-1">
                                <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                  <div
                                    className={`h-full transition-all duration-1000 ${prog.isHung ? 'bg-red-500 glow-red' : prog.isAnomalous ? 'bg-amber-500' : 'bg-blue-500'}`}
                                    style={{ width: `${prog.pct}%` }}
                                  />
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${prog.isHung ? 'text-red-500' : prog.isAnomalous ? 'text-amber-500' : 'text-blue-400'}`}>
                                  {prog.isHung ? '🚨 CRITICAL DELAY' : prog.isAnomalous ? '🕒 SLOWING DOWN' : `PROGRESS: ${prog.pct}% · ETA: ${Math.max(0, Math.round(prog.avg - prog.elapsed))}s`}
                                </span>
                              </div>
                            );
                          })()}
                          <div className="flex items-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-800"></div>
                              <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{new Date(run.startedAt).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-900/40"></div>
                              <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{Math.round(run.duration)}s Duration</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 flex-wrap">
                        {isFailing && (
                          <button
                            onClick={() => setRcaTarget({ run, owner: selectedRepo.accountOwner, repo: selectedRepo.name })}
                            className="flex-1 lg:flex-none px-6 py-3 bg-red-950/40 border border-red-600/40 text-red-400 hover:bg-red-600/20 hover:text-red-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                          >
                            🧠 Diagnose
                          </button>
                        )}
                        <button
                          onClick={() => handleLogClick({ id: run.runId, name: run.workflowName, repo: selectedRepo.name, owner: selectedRepo.accountOwner })}
                          className="flex-1 lg:flex-none px-6 py-3 bg-black/60 border border-white/5 hover:border-red-600/30 text-gray-500 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          View Logs
                        </button>
                        <a
                          href={run.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 lg:flex-none px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-600/10 active:scale-95 text-center"
                        >
                          Open on GitHub
                        </a>
                      </div>
                    </div>

                    {/* Quick Jobs/Steps preview at bottom of card */}
                    {run.jobs && run.jobs.length > 0 && (
                      <div className="px-8 py-5 bg-black/40 border-t border-white/5 flex flex-wrap gap-4 items-center">
                        <span className="text-[8px] text-gray-700 font-black uppercase tracking-[0.3em]">Job Pipeline:</span>
                        {run.jobs.map(job => (
                          <button
                            key={job.id}
                            onClick={() => handleLogClick({ id: job.id, name: job.name, repo: selectedRepo.name, owner: selectedRepo.accountOwner })}
                            className="flex items-center gap-2 px-2 py-1 bg-[#0a0a0a] border border-white/5 rounded-lg hover:border-red-600/40 transition-all group/jobpill"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${job.conclusion === 'success' ? 'bg-emerald-500' : 'bg-red-600 opacity-60'}`}></div>
                            <span className="text-[9px] text-gray-500 font-bold uppercase group-hover/jobpill:text-gray-300">{job.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white font-sans overflow-x-hidden pt-12">
      {/* Premium background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden h-full w-full">
        {/* Animated Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff11 1px, transparent 1px), linear-gradient(to bottom, #ffffff11 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 85%)'
          }}
        ></div>
        {/* Ambient Glows */}
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-red-900/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center pb-20">
        {view === "selection" && renderSelection()}
        {view === "argocd" && renderArgoCD()}
        {view === "github" && renderGitHubRepos()}
        {view === "github_details" && renderGitHubRunDetails()}
      </div>

      {/* Integrated Log Viewer Modal */}
      {showLogViewer && (
        <LogViewer
          logs={logData}
          loading={logsLoading}
          jobName={activeLogJob?.name}
          onClose={() => {
            setShowLogViewer(false);
            setLogData(null);
            setActiveLogJob(null);
          }}
        />
      )}

      {/* Root Cause Analysis Panel */}
      {rcaTarget && (
        <RCAPanel
          run={rcaTarget.run}
          owner={rcaTarget.owner}
          repo={rcaTarget.repo}
          onClose={() => setRcaTarget(null)}
          onViewLogs={() => {
            const failingJob = rcaTarget.run.jobs?.find(j => j.conclusion === 'failure') || rcaTarget.run.jobs?.[0];
            if (failingJob) {
              handleLogClick({ id: failingJob.id, name: failingJob.name, repo: rcaTarget.repo, owner: rcaTarget.owner });
            }
          }}
        />
      )}
    </div>
  );
};

export default Pipelines;
