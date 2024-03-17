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
    <div className="w-full px-5 h-full flex flex-col">
      <div className="rounded-lg w-full mt-3 border border-gray-500 py-2 px-2 flex gap-3">
        {settingsOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => handleTabChange(option.state)}
            className={`w-fit px-3 py-[6px] rounded-md ${
              activeTab === option.state
                ? "text-white bg-purple-600"
                : "text-gray-400"
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>
      <div className="w-full h-full flex mt-5 gap-3">
        <div className="w-[20%] h-fit bg-gray-700 flex rounded-lg p-2">
          <SettingsSidebar
            activeTab={activeTab}
            activeOption={activeOption}
            onOptionChange={handleOptionChange}
          />
        </div>
        <div className="w-full h-[90%] flex justify-center items-center border border-gray-800 rounded-lg">
          {settingsOptions
            .find(option => option.state === activeTab)
            ?.childOptions
            .filter(option => option.state === activeOption)
            .map((option, index) => (
              <option.component key={index} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
