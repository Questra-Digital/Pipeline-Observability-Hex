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
          className={`text-start px-3 rounded-lg py-2 text-sm ${
            option.state === activeOption ? "bg-[#6376A8]" : "text-gray-400"
          }`}
        >
          {option.name}
        </button>
      ))}
    </div>
  );
};

export default SettingsSidebar;
