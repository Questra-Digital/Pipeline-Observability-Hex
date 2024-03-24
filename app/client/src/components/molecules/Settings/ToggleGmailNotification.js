import { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast } from "@/components/atoms/toastUtils/Toast";
import useFetch from "@/hooks/useFetch";
import usePost from "@/hooks/usePost";
import ToggleButton from "@/components/atoms/ToggleButton";

const ToggleGmailNotification = () => {
  const [emailNotifications, setEmailNotifications] = useState(false);
  const { data, error, loading, fetchData } = useFetch(
    "/api/notification/email"
  );
  const { postData: updateStatus } = usePost();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      setEmailNotifications(data.status === "on");
    }
  }, [data]);

  const handleSave = async () => {
    try {
      // Update status of email notifications
      await updateStatus("/api/notification/email", {
        status: emailNotifications ? "on" : "off",
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
          Heading={"Email Notifications"}
          Description={
            "Enhance your awareness: Enable Email Notifications to receive instant alerts and updates, ensuring you stay informed about critical developments and changes."
          }
        />
        <div className="w-[100%] flex flex-col xs:flex-row items-center xs:justify-evenly border border-gray-700 rounded-lg mt-20">
          <p className="my-2">Gmail Notifications</p>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="sr-only peer"
            />
            <ToggleButton />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ToggleGmailNotification;
