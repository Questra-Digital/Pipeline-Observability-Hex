"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import ImageAtom from "@/components/atoms/ImageAtom";
import useFetch from "@/hooks/useFetch";

// --- Decryption Helper Functions (Client-Side) ---
async function importKey(base64Key) {
  const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

async function decryptToken(encryptedTokenBase64, ivBase64, key) {
  const encryptedToken = Uint8Array.from(atob(encryptedTokenBase64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedToken
  );
  
  return new TextDecoder().decode(decrypted);
}
// --------------------------------------------------

const Pipelines = () => {
  // --- Existing State ---
  const [pipelines, setPipelines] = useState([]);
  const [filteredPipelines, setFilteredPipelines] = useState([]);
  const [isLoading, setLoading] = useState(true);
  
  // --- New State for GitHub ---
  const [githubRepos, setGithubRepos] = useState([]);
  const [githubLoading, setGithubLoading] = useState(false);

  const router = useRouter();

  const { data: pipelineData, error, loading, fetchData } = useFetch("/all_pipelines");

  // --- Existing Logic (Unchanged) ---
  useEffect(() => {
    if (!loading) {
      setLoading(false);
      if (pipelineData) {
        setPipelines(pipelineData.available_pipeline);
        setFilteredPipelines(pipelineData.available_pipeline);
      }
      if(error)
        ErrorToast("Error fetching Pipelines!");
    }
  }, [pipelineData, loading]);

  useEffect(() => {
    fetchData();
  }, []);

  // --- New Logic: Fetch GitHub Pipelines ---
  useEffect(() => {
    const fetchGithubPipelines = async () => {
      const storedData = localStorage.getItem("github_token_data");
      const storedKey = localStorage.getItem("github_encryption_key");

      if (!storedData || !storedKey) return; 

      setGithubLoading(true);
      try {
        const { encryptedToken, iv } = JSON.parse(storedData);
        
        // 1. Decrypt Token
        const key = await importKey(storedKey);
        const token = await decryptToken(encryptedToken, iv, key);

        // 2. Fetch User Repositories
        const reposRes = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
          headers: { Authorization: `token ${token}` },
        });
        
        if (!reposRes.ok) throw new Error("Failed to fetch GitHub Repos");
        const repos = await reposRes.json();

        // 3. Filter Repos that have Workflows
        const workflowPromises = repos.map(async (repo) => {
          try {
            const workflowRes = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/actions/workflows`, {
               headers: { Authorization: `token ${token}` },
            });
            if(workflowRes.ok) {
              const data = await workflowRes.json();
              if (data.total_count > 0) return repo;
            }
          } catch (err) {
            return null;
          }
          return null;
        });

        const results = await Promise.all(workflowPromises);
        const activeRepos = results.filter((r) => r !== null);
        
        setGithubRepos(activeRepos);

      } catch (err) {
        console.error("GitHub Fetch Error:", err);
      } finally {
        setGithubLoading(false);
      }
    };

    fetchGithubPipelines();
  }, []);

  // --- EXISTING Handlers (For Local Pipelines - UNCHANGED) ---
  const handleDashboardClick = (pipelineName) => {
    router.push(`/dashboard/pipeline?pipeline=${encodeURIComponent(pipelineName)}`);
  };
  const handleHistoryClick = (pipelineName) => {
    router.push(`pipelineHistory?pipeline=${encodeURIComponent(pipelineName)}`);
  };

  // --- NEW Handlers (For GitHub Pipelines - UPDATED) ---
  const handleGithubDashboardClick = (repoName) => {
    WarningToast("GitHub Dashboard integration is coming soon!");
  };
  
  const handleGithubHistoryClick = (repoName) => {
    WarningToast("GitHub History integration is coming soon!");
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

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center pb-20 px-4 overflow-hidden">
      
      {/* --- BACKGROUND (Cyber Grid) --- */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-slate-950">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        {/* Subtle permanent lights */}
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-purple-900/10 blur-3xl opacity-50"></div>
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-900/10 blur-3xl opacity-50"></div>
      </div>

      {/* --- Search Bar (Always Active) --- */}
      {!isLoading && (
        <div className="w-full md:w-[80%] mt-10 mb-12 relative z-20">
          {/* Permanent Glow Line */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_15px_rgba(168,85,247,0.8)] opacity-100"></div>
          
          <div className="relative flex items-center bg-[#0f111a] border border-purple-900/50 rounded-t-xl overflow-hidden shadow-[0_0_20px_-5px_rgba(168,85,247,0.15)]">
            <div className="pl-6 text-purple-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              className="w-full bg-transparent px-6 py-5 text-lg text-gray-100 outline-none placeholder-gray-500 font-light tracking-wide" 
              placeholder="Search pipelines..." 
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {/* --- Section 1: Local Pipelines (Always Purple) --- */}
      <div className="w-full md:w-[80%] mb-16 relative z-10">
        <div className="flex items-center justify-between mb-6 px-2 border-b border-purple-500/20 pb-2">
           <div className="flex items-center gap-3">
             <div className="w-2 h-8 bg-purple-600 rounded-sm shadow-[0_0_10px_rgba(147,51,234,0.5)]"></div>
             <h2 className="text-3xl font-bold text-gray-100 tracking-tight uppercase">
               ArgoCD Pipelines
             </h2>
           </div>
           <span className="text-xs font-mono text-purple-300 uppercase tracking-widest bg-purple-900/30 px-3 py-1 rounded border border-purple-500/30 shadow-[0_0_10px_rgba(147,51,234,0.2)]">
             System Protocols
           </span>
        </div>

        {loading && (
          <div className="flex flex-col gap-4">
             {[1,2,3].map(i => <div key={i} className="h-20 w-full bg-gray-900/50 rounded-xl animate-pulse"></div>)}
          </div>
        )}

        {!loading && (
          <table className="w-full border-separate border-spacing-y-4">
            <tbody>
              {filteredPipelines.map((pipeline, index) => (
                <tr key={index} className="relative">
                  {/* PERMANENT STYLES: Border color, Shadow, Background */}
                  <td className="p-0 rounded-xl bg-[#0b0c15] border border-purple-500/40 shadow-[0_0_15px_-3px_rgba(147,51,234,0.2)]">
                    <div className="flex flex-col md:flex-row items-center justify-between p-6 w-full">
                        
                        {/* Name Section */}
                        <div className="flex items-center gap-5 w-full md:w-auto">
                            {/* Always colored Icon */}
                            <div className="h-12 w-12 rounded-lg bg-purple-900/20 flex items-center justify-center border border-purple-500/50 text-purple-400 shadow-[inset_0_0_10px_rgba(147,51,234,0.2)]">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-100">{pipeline}</h3>
                                <div className="text-xs text-purple-400/80 mt-1 font-mono">ID: {index + 1000}</div>
                            </div>
                        </div>

                        {/* Actions Section - Always Visible Colors */}
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                            <button
                                onClick={() => handleDashboardClick(pipeline)}
                                className="px-5 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/40 text-sm font-semibold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:bg-emerald-500/10 transition-colors"
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => handleHistoryClick(pipeline)}
                                className="px-5 py-2.5 rounded-lg bg-blue-500/5 border border-blue-500/40 text-sm font-semibold text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:bg-blue-500/10 transition-colors"
                            >
                                History
                            </button>
                        </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- Section 2: Github Actions (Always Cyan) --- */}
      <div className="w-full md:w-[80%] relative z-10">
         <div className="flex items-center justify-between mb-6 px-2 border-b border-cyan-500/20 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-cyan-600 rounded-sm shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
              <h2 className="text-3xl font-bold text-gray-100 tracking-tight uppercase">
                GitHub Pipelines
              </h2>
            </div>
           
           <div className="flex items-center gap-2">
              {githubLoading && <div className="h-2 w-2 bg-cyan-500 rounded-full animate-ping"></div>}
              <span className="text-xs font-mono text-cyan-300 uppercase tracking-widest bg-cyan-900/30 px-3 py-1 rounded border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                Remote Workflows
              </span>
           </div>
         </div>
         
         {!githubLoading && githubRepos.length === 0 && (
            <div className="p-10 rounded-xl border border-dashed border-gray-800 bg-[#0b0c15] text-gray-500 text-center flex flex-col items-center gap-2">
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>No connected repositories found.</span>
            </div>
         )}

         {!githubLoading && githubRepos.length > 0 && (
          <table className="w-full border-separate border-spacing-y-4">
            <tbody>
              {githubRepos.map((repo) => (
                <tr key={repo.id} className="relative">
                  {/* PERMANENT STYLES: Border color, Shadow, Background */}
                  <td className="p-0 rounded-xl bg-[#0b0c15] border border-cyan-500/40 shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)]">
                    <div className="flex flex-col md:flex-row items-center justify-between p-6 w-full">
                        
                        {/* Repo Info */}
                        <div className="flex items-center gap-5 w-full md:w-auto">
                           {/* Always colored Icon */}
                           <div className="h-12 w-12 rounded-lg bg-cyan-900/20 flex items-center justify-center border border-cyan-500/50 text-cyan-400 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-100">{repo.name}</h3>
                                <span className="text-xs text-cyan-400/80 font-mono">{repo.full_name}</span>
                            </div>
                        </div>

                        {/* Actions - Always Visible Colors */}
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                             <button
                                onClick={() => handleGithubDashboardClick(repo.name)}
                                className="px-5 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/40 text-sm font-semibold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:bg-emerald-500/10 transition-colors"
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => handleGithubHistoryClick(repo.name)}
                                className="px-5 py-2.5 rounded-lg bg-blue-500/5 border border-blue-500/40 text-sm font-semibold text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:bg-blue-500/10 transition-colors"
                            >
                                History
                            </button>
                        </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
         )}
      </div>

    </div>
  );
};

export default Pipelines;