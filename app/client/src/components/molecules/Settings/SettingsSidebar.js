import { settingsOptions } from "@/constants/settingOptions";

const SettingsSidebar = ({ activeTab, activeOption, onOptionChange }) => {
  const handleOptionClick = (option) => {
    onOptionChange(option);
  };

  const getChildOptions = (state) => {
    const parentOption = settingsOptions.find(option => option.state === state);
    return parentOption ? parentOption.childOptions : [];
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {getChildOptions(activeTab).map((option, index) => (
        <button
          key={index}
          onClick={() => handleOptionClick(option.state)}
          className={`text-start px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${option.state === activeOption
              ? "bg-gradient-to-r from-red-600 to-red-900 text-white shadow-lg shadow-red-950/40"
              : "text-gray-500 hover:text-gray-300 hover:bg-[#111]"
            }`}
        >
          {option.name}
        </button>
      ))}
    </div>
  );
};

export default SettingsSidebar;
