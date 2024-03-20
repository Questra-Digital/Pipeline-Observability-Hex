import { useState } from "react";
import SettingsText from "@/components/atoms/SettingsText";

const ToggleSlackNotification = () => {
  const [slackNotifications, setSlackNotifications] = useState(false);
  return (
    <div className="flex w-full flex-col p-2">
      <div className="self-end">
        <button className="bg-purple-600 h-fit px-3 py-1 rounded-md">
          Save
        </button>
      </div>
      <div className="flex w-full flex-col md:w-[60%] border border-gray-800 self-center shadow shadow-blue-950 p-2 xs:p-10 rounded-lg">
        <SettingsText
          Heading={"Slack Notifications"}
          Description={
            "Empower your communication flow: Stay synced across platforms by enabling Slack Notifications, empowering your team with synchronized communication channels for efficient collaboration."
          }
        />
        <div className="w-[100%] flex flex-col xs:flex-row items-center xs:justify-evenly border border-gray-700 rounded-lg mt-20">
          <p className="my-2">Slack Notifications</p>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={slackNotifications}
              onChange={(e) => setSlackNotifications(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ToggleSlackNotification;
