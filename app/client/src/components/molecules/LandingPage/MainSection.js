"use client";
import React, { useState, useEffect } from "react";
import {
  VizOpsLogo,
  GitHubIcon,
  ArgoCDIcon,
  SlackIcon,
  GmailIcon,
  GitLabIcon,
  DashboardIcon
} from "@/components/atoms/AppIcons";
import LinkAtom from "@/components/atoms/LinkAtom";

const MainSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-red-600/30 font-Ubuntu relative overflow-x-hidden">

      {/* SOLID BACKGROUND - Landing Page Only */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#020202]"></div>

      {/* 1. HERO SECTION */}
      <section className="relative pt-48 pb-32 px-8 flex flex-col items-center text-center z-10">
        <div className={`transition-all duration-1000 transform ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-950/20 border border-red-600/20 mb-10">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">System Online • Protocol 1.0</span>
          </div>

          <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] mb-8">
            The Future of <br />
            <span className="text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.4)]">Observability</span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-500 text-lg md:text-xl font-medium tracking-tight mb-12">
            Experience high-fidelity CI/CD orchestration. Monitor, analyze, and automate your entire deployment stream with a unified neural interface.
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            <LinkAtom link="/login?form=signup">
              <button className="bg-red-600 hover:bg-red-500 text-white px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(220,38,38,0.2)] active:scale-95">
                Initialize Account
              </button>
            </LinkAtom>
            <button className="bg-black/40 border border-white/10 hover:border-white/30 text-white px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all group active:scale-95 backdrop-blur-sm">
              Documentation <span className="text-red-600 group-hover:translate-x-1 inline-block transition-transform ml-2">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. INTEGRATIONS NEURAL NETWORK (THE VEINS) */}
      <section className="relative py-32 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-4">Neural Data Connections</h2>
            <p className="text-gray-600 text-xs font-black uppercase tracking-[0.4em]">Seamless stream integration across your stack</p>
          </div>

          <div className="relative h-[650px] w-full flex items-center justify-center">

            {/* Main SVG Veins (The Connections) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 600" fill="none">
              {/* Veins from Left (Inputs) */}
              <path d="M100 150 Q 300 150 500 300" stroke="url(#veinGradient)" strokeWidth="1.5" className="animate-line-draw opacity-20" />
              <path d="M100 300 Q 300 300 500 300" stroke="url(#veinGradient)" strokeWidth="1.5" className="animate-line-draw opacity-40" />
              <path d="M100 450 Q 300 450 500 300" stroke="url(#veinGradient)" strokeWidth="1.5" className="animate-line-draw opacity-20" />

              {/* PRIMARY ARGO TO GMAIL PATH - Redesigned for elegance */}
              <path d="M100 300 Q 500 250 900 300" stroke="url(#veinGradient)" strokeWidth="2" className="animate-line-draw opacity-60" />

              {/* Veins to Right (Outputs) */}
              <path d="M500 300 Q 700 150 900 150" stroke="url(#veinGradient)" strokeWidth="1.5" className="animate-line-draw opacity-20" />
              <path d="M500 300 Q 700 300 900 300" stroke="url(#veinGradient)" strokeWidth="1.5" className="animate-line-draw opacity-40" />
              <path d="M500 300 Q 700 450 900 450" stroke="url(#veinGradient)" strokeWidth="1.5" className="animate-line-draw opacity-20" />

              {/* DATA PACKETS */}
              <circle r="3" fill="#ef4444" className="shadow-[0_0_10px_#ef4444]">
                <animateMotion dur="4s" repeatCount="indefinite" path="M100 150 Q 300 150 500 300" />
              </circle>

              {/* PRIMARY ARGO TO GMAIL FLOW (Sync with new elegant path) */}
              <circle r="4" fill="#60a5fa" className="shadow-[0_0_15px_#60a5fa]">
                <animateMotion
                  dur="5s"
                  repeatCount="indefinite"
                  path="M100 300 Q 500 250 900 300"
                />
              </circle>
              <circle r="4" fill="#ef4444" className="shadow-[0_0_15px_#ef4444]">
                <animateMotion
                  dur="5s"
                  repeatCount="indefinite"
                  path="M100 300 Q 500 250 900 300"
                  begin="2.5s"
                />
              </circle>

              <circle r="3" fill="#ffffff" className="shadow-[0_0_10px_#ffffff]">
                <animateMotion dur="8s" repeatCount="indefinite" path="M100 450 Q 300 450 500 300" begin="2.5s" />
              </circle>

              <circle r="3" fill="#ef4444" className="shadow-[0_0_10px_#ef4444]">
                <animateMotion dur="4.5s" repeatCount="indefinite" path="M500 300 Q 700 150 900 150" begin="0.5s" />
              </circle>

              <circle r="4" fill="#a855f7" className="shadow-[0_0_10px_#a855f7]">
                <animateMotion dur="5.5s" repeatCount="indefinite" path="M500 300 Q 700 450 900 450" begin="2s" />
              </circle>
              <defs>
                <linearGradient id="veinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity="0" />
                  <stop offset="50%" stopColor="#ef4444" stopOpacity="0.8">
                    <animate attributeName="stop-opacity" values="0.4;0.9;0.4" dur="3s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Central Node: VIZOPS */}
            <div className="relative z-10 w-48 h-48 rounded-full bg-[#050505] border-2 border-red-600/30 flex items-center justify-center shadow-[0_0_100px_rgba(220,38,38,0.3)] group cursor-pointer transition-transform duration-700 hover:scale-110">
              <div className="absolute inset-[-20px] rounded-full border border-red-600/10 animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute inset-[-40px] rounded-full border border-red-600/5 animate-[spin_20s_linear_infinite_reverse]"></div>
              <div className="absolute inset-0 rounded-full animate-ping bg-red-600/5 duration-[4s]"></div>
              <VizOpsLogo size={80} className="text-red-600 drop-shadow-[0_0_25px_rgba(220,38,38,0.7)]" />
            </div>

            {/* Input Nodes (Left side) */}
            <div className="absolute left-[20px] top-[100px] w-40 flex flex-col items-center gap-3 group">
              <div className="w-20 h-20 rounded-2xl bg-[#080808] border border-white/10 flex items-center justify-center group-hover:border-white/50 transition-all duration-500 shadow-2xl group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] relative">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                <GitHubIcon size={40} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors text-center">GitHub Actions</span>
            </div>

            <div className="absolute left-[20px] top-[260px] w-40 flex flex-col items-center gap-3 group">
              <div className="w-20 h-20 rounded-2xl bg-[#080808] border border-blue-500/20 flex items-center justify-center group-hover:border-blue-500/60 transition-all duration-500 shadow-2xl group-hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] relative">
                <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                <ArgoCDIcon size={40} className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-400 transition-colors text-center">ArgoCD</span>
            </div>

            <div className="absolute left-[20px] top-[420px] w-40 flex flex-col items-center gap-3 group">
              <div className="w-20 h-20 rounded-2xl bg-[#080808] border border-orange-500/20 flex items-center justify-center group-hover:border-orange-500/60 transition-all duration-500 shadow-2xl group-hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] relative">
                <div className="absolute inset-0 bg-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                <GitLabIcon size={40} className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-orange-400 transition-colors text-center">GitLab</span>
            </div>

            {/* Output Nodes (Right side) */}
            <div className="absolute right-[20px] top-[100px] w-40 flex flex-col items-center gap-3 group">
              <div className="w-20 h-20 rounded-2xl bg-[#080808] border border-purple-500/20 flex items-center justify-center group-hover:border-purple-500/60 transition-all duration-500 shadow-2xl group-hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] relative">
                <div className="absolute inset-0 bg-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                <SlackIcon size={40} className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-purple-400 transition-colors text-center">Slack</span>
            </div>

            <div className="absolute right-[20px] top-[260px] w-40 flex flex-col items-center gap-3 group">
              <div className="w-20 h-20 rounded-2xl bg-[#080808] border border-red-400/20 flex items-center justify-center group-hover:border-red-400/60 transition-all duration-500 shadow-2xl group-hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] relative">
                <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                <GmailIcon size={40} className="text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-red-400 transition-colors text-center">Gmail</span>
            </div>

            <div className="absolute right-[20px] top-[420px] w-40 flex flex-col items-center gap-3 group">
              <div className="w-20 h-20 rounded-2xl bg-[#080808] border border-white/10 flex items-center justify-center group-hover:border-white/50 transition-all duration-500 shadow-2xl group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] relative">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                <svg className="w-10 h-10 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 group-hover:text-white transition-colors text-center">Webhooks</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DASHBOARD SHOWCASE */}
      <section className="relative py-32 px-8 bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-8">
              <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
                Elite <span className="text-red-600">VizOps</span> <br />Dashboard suite
              </h3>
              <p className="text-gray-500 leading-relaxed max-w-md">
                Monitor your entire infrastructure from a single pane of glass. High-resolution telemetry, real-time status updates, and predictive analytics at your fingertips.
              </p>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { title: "Global Sync", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
                  { title: "Anomaly Detection", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944" },
                  { title: "Enterprise Security", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-600/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-red-950/20 flex items-center justify-center text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 relative group">
              {/* Dashboard Mockup */}
              <div className="relative z-10 p-2 bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-700">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
                <div className="w-full aspect-video bg-[#050505] rounded-[2rem] p-8 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-600 opacity-20"></div>
                      <div className="w-3 h-3 rounded-full bg-red-600 opacity-40"></div>
                      <div className="w-3 h-3 rounded-full bg-red-600 opacity-60"></div>
                    </div>
                    <div className="w-24 h-4 bg-white/5 rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 h-full">
                    <div className="col-span-2 bg-red-950/10 border border-red-600/10 rounded-3xl p-6 flex flex-col gap-4">
                      <div className="w-1/2 h-4 bg-red-600/20 rounded-full"></div>
                      <div className="flex-1 flex items-end gap-2">
                        {[30, 60, 45, 80, 55, 90, 40].map((h, i) => (
                          <div key={i} className="flex-1 bg-red-600/40 rounded-t-lg" style={{ height: `${h}%` }}></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex-1 bg-white/5 rounded-3xl p-4 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-red-600/40 border-t-red-600 animate-spin"></div>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-3xl"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -inset-10 bg-red-600/5 blur-3xl rounded-full -z-10 group-hover:bg-red-600/10 transition-colors"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="py-20 px-8 border-t border-white/5 text-center relative z-10">
        <div className="mb-10 flex flex-col items-center gap-4">
          <VizOpsLogo size={40} className="text-red-600 opacity-60" />
          <h4 className="text-xl font-black tracking-tighter uppercase italic text-gray-400">VIZOPS SYSTEMS</h4>
        </div>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.6em]">Design and engineering by vizops corp • all rights reserved</p>
      </footer>

    </div>
  );
};

export default MainSection;