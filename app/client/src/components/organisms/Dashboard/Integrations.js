"use client";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { allApps } from "@/constants/integrations";
import ImageAtom from "@/components/atoms/ImageAtom";
import { useConfiguredApps } from "@/hooks/useConfiguredApps";

const Integrations = () => {
  const apps = useSelector((state) => state.apps.apps);
  const [openApp, setOpenApp] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useConfiguredApps();

  const isConfigured = (appName) =>
    apps.some((app) => app.name === appName && app.status === true);

  const openConfigModal = (app) => {
    setOpenApp(app);
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setOpenApp(null);
  };

  // small UI-only descriptions map (purely presentational — does NOT affect backend)
  const descriptions = {
    "argocd": "Monitor GitOps deployments with ArgoCD",
    "slack": "Send alerts and notifications to Slack channels",
    "email": "Forward alerts to email addresses",
    "gitlab": "Connect GitLab CI/CD pipelines",
    "jenkins": "Integrate Jenkins pipelines and jobs",
    "drone ci": "Connect Drone CI pipelines",
  };

  return (
    <div className="w-full min-h-screen bg-[#050505] flex flex-col px-8 py-10 relative overflow-hidden font-Ubuntu">
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
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.6)]" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em]">Module :: Integrations</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            SERVICE <span className="text-red-600">HUB</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-md">
            Deploy, monitor, and manage your external pipeline services from a unified oversight center.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end text-right">
          <div className="px-4 py-2 rounded-lg bg-red-600/10 border border-red-600/20 backdrop-blur-md">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none">
              {allApps.filter((a) => isConfigured(a.name)).length} Systems Linked
            </span>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="relative z-10 space-y-12">
        {/* Configured Section */}
        {allApps.some(a => isConfigured(a.name)) && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-[1px] bg-red-600/50" />
              <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Configured Engines</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allApps.map((app, idx) =>
                isConfigured(app.name) ? (
                  <div
                    key={idx}
                    className="group relative bg-[#0a0a0a] border border-red-600/30 rounded-xl p-6 transition-all duration-300 overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.05)]"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-20 transition-all duration-500 transform scale-125">
                      {app.Icon ? <app.Icon size={80} /> : <span className="text-8xl">🔗</span>}
                    </div>

                    <div className="flex items-start gap-5 relative z-10">
                      <div className="w-14 h-14 rounded-lg bg-[#111] flex items-center justify-center border border-red-600/40 shadow-inner">
                        {app.Icon ? (
                          <app.Icon size={32} className="text-red-500" />
                        ) : (
                          <ImageAtom src={app.image} alt={app.alt} width={32} height={32} className="opacity-100" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-lg font-bold text-red-500 capitalize tracking-tight">{app.name}</h3>
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">
                          {descriptions[app.name.toLowerCase()] ?? `Core integration for ${app.name} orchestration and telemetry.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4 relative z-10">
                      <button
                        onClick={() => openConfigModal(app)}
                        className="flex-1 py-2 rounded-lg bg-red-600 border border-red-600/30 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-red-700 transition-all duration-300"
                      >
                        Settings
                      </button>
                      <div className="flex items-center px-3 py-2 rounded-lg bg-red-600/5 border border-red-600/20 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                        Active
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </section>
        )}

        {/* Available Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-[1px] bg-gray-800" />
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Available Integration Points</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allApps.map((app, idx) =>
              !isConfigured(app.name) ? (
                <div
                  key={idx}
                  className="group relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 transition-all duration-300 hover:border-gray-700/50 overflow-hidden grayscale hover:grayscale-0"
                >
                  <div className="flex items-start gap-5 relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-lg bg-[#111] flex items-center justify-center border border-[#1a1a1a] shadow-inner font-bold text-gray-500 text-xl group-hover:text-white group-hover:border-gray-500">
                      {app.Icon ? (
                        <app.Icon size={32} />
                      ) : (
                        <ImageAtom src={app.image} alt={app.alt} width={32} height={32} className="opacity-40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-400 capitalize tracking-tight group-hover:text-white transition-colors">{app.name}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed mb-4">
                        {descriptions[app.name.toLowerCase()] ?? `Connect ${app.name} to expand your monitoring capabilities.`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => openConfigModal(app)}
                    className="w-full mt-4 py-2.5 rounded-lg bg-[#0d0d0d] border border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-800 hover:text-white transition-all duration-300 relative z-10"
                  >
                    Establish Connection
                  </button>
                </div>
              ) : null
            )}
          </div>
        </section>
      </div>

      {/* Configuration Modal */}
      {openModal && openApp && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0a0a0a] border border-red-900/30 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] red-glow overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-red-600/10 flex items-center justify-center border border-red-600/20">
                  {openApp.Icon ? <openApp.Icon size={24} className="text-red-500" /> : <span className="text-xl">⚙️</span>}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Configure {openApp.name}</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Interface Setup</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#111] text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="relative z-10">
              {openApp.component ? (
                <openApp.component closeModal={closeModal} />
              ) : (
                <div className="p-12 rounded-xl bg-[#0d0d0d] border border-dashed border-[#222] text-center">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-[0.2em]">Adapter Pending Development</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
      `}</style>
    </div>
  );
};

export default Integrations;
