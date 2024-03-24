import React, { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast } from "@/components/atoms/toastUtils/Toast";
import useFetch from "@/hooks/useFetch";
import usePost from "@/hooks/usePost";
import ToggleButton from "@/components/atoms/ToggleButton";

const ToggleSlackNotification = () => {
  const [slackNotifications, setSlackNotifications] = useState(false);
  const { data, error, loading, fetchData } = useFetch(
    "/api/notification/slack"
  );
  const { postData: updateStatus } = usePost();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      setSlackNotifications(data.status === "on");
    }
  }, [data]);

  const handleSave = async () => {
    try {
      // Update status of Slack notifications
      await updateStatus("/api/notification/slack", {
        status: slackNotifications ? "on" : "off",
      });
      SuccessToast("Status Updated Successfully!");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        ErrorToast(error.response.data.error);
      } else {
        ErrorToast("Error updating status!");
      }
    }
  };

  return (
    <div className="flex w-full flex-col p-2">
      <div className="self-end">
        <button
          className="bg-purple-600 h-fit px-3 py-1 rounded-md"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
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
            <ToggleButton />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ToggleSlackNotification;
