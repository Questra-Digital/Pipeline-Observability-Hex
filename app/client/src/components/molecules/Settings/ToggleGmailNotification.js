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
          className="bg-gradient-to-r from-red-600 to-red-900 px-6 py-2 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-red-950/20"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Syncing..." : "Apply Status"}
        </button>
      </div>
      <div className="flex w-full flex-col md:w-[60%] border border-red-900/10 self-center shadow-2xl shadow-red-900/5 p-6 xs:p-10 rounded-2xl bg-[#0a0a0a]">
        <SettingsText
          Heading={"Email Notifications"}
          Description={
            "Enhance your awareness: Enable Email Notifications to receive instant alerts and updates, ensuring you stay informed about critical developments and changes."
          }
        />
        <div className="w-[100%] flex flex-col xs:flex-row items-center xs:justify-evenly border border-[#1a1a1a] bg-[#0d0d0d] rounded-xl mt-20 p-6 hover:border-red-900/30 transition-colors">
          <p className="my-2 text-gray-100 font-bold">Gmail Notifications</p>
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
