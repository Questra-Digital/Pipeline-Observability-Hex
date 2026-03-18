"use client";
import { useState, useEffect } from "react";
import SettingsSidebar from "../../molecules/Settings/SettingsSidebar";
import { settingsOptions } from "@/constants/settingOptions";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("user");
  const [activeOption, setActiveOption] = useState("");

  useEffect(() => {
    const defaultOption = settingsOptions.find(option => option.state === activeTab)?.childOptions[0]?.state;
    setActiveOption(defaultOption || "");
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleOptionChange = (option) => {
    setActiveOption(option);
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

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.6)]" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em]">Module :: System Settings</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            CONTROL <span className="text-red-600">PANEL</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2">Configure account preferences and core system parameters.</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] p-1.5 mb-10 shadow-2xl overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {settingsOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleTabChange(option.state)}
                className={`
                  relative px-6 py-3 rounded-lg font-bold text-[10px] uppercase tracking-[0.2em]
                  transition-all duration-300 ease-in-out
                  ${activeTab === option.state
                    ? "text-white bg-red-600 shadow-[0_4px_15px_rgba(220,38,38,0.3)]"
                    : "text-gray-500 hover:text-gray-300 hover:bg-[#111]"
                  }
                `}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-[#1a1a1a] bg-[#0d0d0d]">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Section Map</h2>
              </div>
              <div className="p-3">
                <SettingsSidebar
                  activeTab={activeTab}
                  activeOption={activeOption}
                  onOptionChange={handleOptionChange}
                />
              </div>
            </div>
          </div>

          {/* Content Panel */}
          <div className="flex-1 min-h-[500px]">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-md rounded-2xl border border-[#1a1a1a] p-8 lg:p-12 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              {settingsOptions
                .find(option => option.state === activeTab)
                ?.childOptions
                .filter(option => option.state === activeOption)
                .map((option, index) => (
                  <div key={index} className="relative z-10 transition-all duration-500">
                    <option.component />
                  </div>
                ))}
            </div>
          </div>
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

export default Settings;