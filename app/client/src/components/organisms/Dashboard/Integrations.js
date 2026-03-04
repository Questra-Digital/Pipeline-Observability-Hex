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
    <div className="w-full p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center text-white text-xl">
            {/* small logo/icon placeholder */}
            🔗
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white">
              Integration Settings
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Connect and manage external services
            </p>
          </div>
        </div>
        {/* right-side can hold an action or help text if needed */}
        <div className="text-sm text-gray-400 hidden md:block">Manage integrations</div>
      </div>

      {/* Configured Apps */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Configured Apps</h2>
          <span className="text-sm text-gray-400">
            {allApps.filter((a) => isConfigured(a.name)).length} Connected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allApps.map((app, idx) =>
            isConfigured(app.name) ? (
              <div
                key={idx}
                className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-5 hover:border-[#3a3a3a] hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-300"
              >
                {/* Top Section */}
                <div className="flex items-center gap-5">
                  {/* Logo Box */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-[#252525] flex items-center justify-center border border-[#303030]">
                    <ImageAtom
                      src={app.image}
                      alt={app.alt}
                      width={45}
                      height={45}
                      className="opacity-90"
                    />
                  </div>

                  {/* Title + Description + Tag */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-base font-semibold text-gray-100 capitalize">
                      {app.name}
                    </h3>

                    <p className="text-sm text-gray-400 mt-1">
                      {descriptions[app.name.toLowerCase()] ??
                        `Manage and integrate your ${app.name} workflows.`}
                    </p>

                    {/* Status Tag */}
                    <span
                      className={`
          mt-2 w-fit px-3 py-1 rounded-full text-xs font-medium border
          ${isConfigured(app.name)
                          ? "text-[#2ECC71] border-[#2ECC71]/40 bg-[#2ECC71]/10"
                          : "text-[#BDC3C7] border-[#444] bg-[#2C2C2C]"
                        }
        `}
                    >
                      {isConfigured(app.name) ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>

                {/* Full-Width Bottom Button */}
                <button
                  onClick={() => openConfigModal(app)}
                  className={`
      w-full py-2.5 rounded-lg text-sm font-semibold tracking-wide text-white
      transition-all duration-200
      ${isConfigured(app.name)
                      ? "bg-[#2ECC71] hover:bg-[#27AE60]"
                      : "bg-[#3498DB] hover:bg-[#2C81BA]"
                    }
    `}
                >
                  {isConfigured(app.name) ? "Configured" : "Configure"}
                </button>
              </div>


            ) : null
          )}
        </div>
      </section>

      {/* Available Apps */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Available Apps</h2>
          <span className="text-sm text-gray-400">
            {allApps.filter((a) => !isConfigured(a.name)).length} Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allApps.map((app, idx) =>
            !isConfigured(app.name) ? (
              <div
                key={idx}
                className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-5 hover:border-[#3a3a3a] hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-300"
              >
                {/* Top Section */}
                <div className="flex items-center gap-5">
                  {/* Logo Box */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-[#252525] flex items-center justify-center border border-[#303030]">
                    <ImageAtom
                      src={app.image}
                      alt={app.alt}
                      width={45}
                      height={45}
                      className="opacity-90"
                    />
                  </div>

                  {/* Title + Description + Tag */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-base font-semibold text-gray-100 capitalize">
                      {app.name}
                    </h3>

                    <p className="text-sm text-gray-400 mt-1">
                      {descriptions[app.name.toLowerCase()] ??
                        `Manage and integrate your ${app.name} workflows.`}
                    </p>

                    {/* Status Tag */}
                    <span
                      className={`
          mt-2 w-fit px-3 py-1 rounded-full text-xs font-medium border
          ${isConfigured(app.name)
                          ? "text-[#2ECC71] border-[#2ECC71]/40 bg-[#2ECC71]/10"
                          : "text-[#BDC3C7] border-[#444] bg-[#2C2C2C]"
                        }
        `}
                    >
                      {isConfigured(app.name) ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>

                {/* Full-Width Bottom Button */}
                <button
                  onClick={() => openConfigModal(app)}
                  className={`
      w-full py-2.5 rounded-lg text-sm font-semibold tracking-wide text-white
      transition-all duration-200
      ${isConfigured(app.name)
                      ? "bg-[#2ECC71] hover:bg-[#27AE60]"
                      : "bg-[#3498DB] hover:bg-[#2C81BA]"
                    }
    `}
                >
                  {isConfigured(app.name) ? "Configured" : "Configure"}
                </button>
              </div>


            ) : null
          )}
        </div>
      </section>

      {/* Modal (popup) */}
      {openModal && openApp && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60">
          <div className="w-[480px] max-w-[40%] rounded-xl bg-[#0b0b0c] border border-[#232425] px-6 pb-6 shadow-2xl">
            <div className="flex items-center justify-end mb-2">

              <button
                onClick={closeModal}
                className="text-gray-300 hover:text-red-400 text-lg mt-2"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-1">
              {openApp.component ? (
                // render the existing configuration component (no changes to logic)
                <openApp.component closeModal={closeModal} />
              ) : (
                <div className="text-gray-300 p-4 border border-dashed border-gray-700 rounded">
                  No configuration form available for this integration.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
