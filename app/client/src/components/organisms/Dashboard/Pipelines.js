"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import ImageAtom from "@/components/atoms/ImageAtom";
import useFetch from "@/hooks/useFetch";
import NOCView from "./NOCView";

const Pipelines = () => {
  // --- State ---
  const [view, setView] = useState("selection"); // 'selection', 'argocd', 'github', 'noc'
  const [pipelines, setPipelines] = useState([]);
  const [filteredPipelines, setFilteredPipelines] = useState([]);
  const [isLoading, setLoading] = useState(true);

  const router = useRouter();

  const { data: pipelineData, error, loading, fetchData } = useFetch("/all_pipelines");

  // --- Logic ---
  useEffect(() => {
    if (!loading) {
      setLoading(false);
      if (pipelineData) {
        setPipelines(pipelineData.available_pipeline || []);
        setFilteredPipelines(pipelineData.available_pipeline || []);
      }
      if (error)
        ErrorToast("Error fetching Pipelines!");
    }
  }, [pipelineData, loading]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleDashboardClick = (pipelineName) => {
    router.push(`/dashboard/pipeline?pipeline=${encodeURIComponent(pipelineName)}`);
  };
  const handleHistoryClick = (pipelineName) => {
    router.push(`pipelineHistory?pipeline=${encodeURIComponent(pipelineName)}`);
  };

  const handleChange = (e) => {
    const search = e.target.value.toLowerCase();
    if (search === "") {
      setFilteredPipelines(pipelines);
    } else {
      const filtered = pipelines.filter(pipeline =>
        pipeline.toLowerCase().startsWith(search)
      );
      setFilteredPipelines(filtered);
    }
  };

  if (view === "noc") {
    return <NOCView onBack={() => setView("selection")} />;
  }

  const renderSelection = () => (
    <div className="w-full max-w-6xl mt-12 px-4 flex flex-col items-center">

      {/* NOC View Entry Button */}
      <div className="w-full flex justify-end mb-8">
        <button
          onClick={() => setView("noc")}
          className="group relative flex items-center gap-3 px-6 py-3 bg-[#0b0c15] border border-blue-500/30 rounded-xl overflow-hidden hover:border-blue-500 transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
        >
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
          <span className="text-xs font-black uppercase tracking-[3px] text-gray-400 group-hover:text-white transition-colors">Neural-Ops Center (NOC)</span>
          <svg className="w-4 h-4 text-blue-500 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* ArgoCD Card */}
        <div
          onClick={() => setView("argocd")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[#0b0c15] border border-purple-500/30 p-8 transition-all duration-500 hover:border-purple-500 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.4)]"
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-600/10 blur-3xl transition-all duration-500 group-hover:bg-purple-600/20"></div>
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-900/20 border border-purple-500/40 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">ArgoCD</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Monitor GitOps deployments, synchronization status, and application health across your clusters.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
              <span className="text-purple-400 bg-purple-900/30 px-3 py-1 rounded border border-purple-500/20">
                {pipelines.length} Active Pipelines
              </span>
            </div>
          </div>
        </div>

        {/* GitHub Actions Card */}
        <div
          onClick={() => setView("github")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[#0b0c15] border border-blue-500/30 p-8 transition-all duration-500 hover:border-blue-500 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)]"
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-600/10 blur-3xl transition-all duration-500 group-hover:bg-blue-600/20"></div>
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-900/20 border border-blue-500/40 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">GitHub Actions</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Track workflow runs, analyze stage performance, and detect failures in real-time across your repositories.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
              <span className="text-blue-400 bg-blue-900/30 px-3 py-1 rounded border border-blue-500/20">
                Observability Pipeline
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center pb-20 px-4 overflow-hidden">

      {/* --- BACKGROUND (Cyber Grid) --- */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-slate-950">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        {/* Subtle permanent lights */}
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-purple-900/10 blur-3xl opacity-50"></div>
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-900/10 blur-3xl opacity-50"></div>
      </div>

      {/* Breadcrumb / Back button if not in selection view */}
      {view !== "selection" && (
        <div className="w-full md:w-[80%] mt-8 flex justify-start">
          <button
            onClick={() => setView("selection")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            <span className="text-sm font-medium uppercase tracking-wider">Back to Selection</span>
          </button>
        </div>
      )}

      {view === "selection" ? renderSelection() : (
        <>
          {/* --- Search Bar --- */}
          {!isLoading && (
            <div className="w-full md:w-[80%] mt-10 mb-12 relative z-20">
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_15px_rgba(168,85,247,0.8)] opacity-100"></div>
              <div className="relative flex items-center bg-[#0f111a] border border-purple-900/50 rounded-t-xl overflow-hidden shadow-[0_0_20px_-5px_rgba(168,85,247,0.15)]">
                <div className="pl-6 text-purple-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input
                  className="w-full bg-transparent px-6 py-5 text-lg text-gray-100 outline-none placeholder-gray-500 font-light tracking-wide"
                  placeholder={`Search ${view} pipelines...`}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* --- Content based on view --- */}
          {view === "argocd" ? (
            <div className="w-full md:w-[80%] mb-16 relative z-10">
              <div className="flex items-center justify-between mb-6 px-2 border-b border-purple-500/20 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-purple-600 rounded-sm shadow-[0_0_10px_rgba(147,51,234,0.5)]"></div>
                  <h2 className="text-3xl font-bold text-gray-100 tracking-tight uppercase">
                    ArgoCD Pipelines
                  </h2>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 w-full bg-gray-900/50 rounded-xl animate-pulse"></div>)}
                </div>
              ) : (
                <table className="w-full border-separate border-spacing-y-4">
                  <tbody>
                    {filteredPipelines.map((pipeline, index) => (
                      <tr key={index} className="relative">
                        <td className="p-0 rounded-xl bg-[#0b0c15] border border-purple-500/40 shadow-[0_0_15px_-3px_rgba(147,51,234,0.2)]">
                          <div className="flex flex-col md:flex-row items-center justify-between p-6 w-full">
                            <div className="flex items-center gap-5 w-full md:w-auto">
                              <div className="h-12 w-12 rounded-lg bg-purple-900/20 flex items-center justify-center border border-purple-500/50 text-purple-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-100">{pipeline}</h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-4 md:mt-0">
                              <button onClick={() => handleDashboardClick(pipeline)} className="px-5 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/40 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10">Dashboard</button>
                              <button onClick={() => handleHistoryClick(pipeline)} className="px-5 py-2.5 rounded-lg bg-blue-500/5 border border-blue-500/40 text-sm font-semibold text-blue-300 hover:bg-blue-500/10">History</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="w-full md:w-[80%] mb-16 relative z-10 flex flex-col items-center justify-center py-20 text-center">
              <div className="h-24 w-24 rounded-full bg-blue-900/20 border border-blue-500/40 flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">GitHub Actions Monitor</h2>
              <p className="text-gray-400 max-w-md">
                Integration active. We are currently fetching your latest workflow runs. Data will appear here shortly.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Pipelines;