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
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Settings</h1>
          <p className="text-gray-500 text-sm">Manage your account preferences and configurations</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#1c1c1c] rounded-lg border border-gray-800 p-1.5 mb-6">
          <div className="flex flex-wrap gap-2">
            {settingsOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleTabChange(option.state)}
                className={`
                  relative px-5 py-2.5 rounded-md font-medium text-sm
                  transition-all duration-200 ease-in-out
                  ${
                    activeTab === option.state
                      ? "text-white bg-purple-600"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                  }
                `}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-[#1c1c1c] rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-gray-200">Options</h2>
              </div>
              <div className="p-2">
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
            <div className="bg-[#1c1c1c] rounded-lg border border-gray-800 p-6 lg:p-8">
              {settingsOptions
                .find(option => option.state === activeTab)
                ?.childOptions
                .filter(option => option.state === activeOption)
                .map((option, index) => (
                  <div key={index}>
                    <option.component />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;