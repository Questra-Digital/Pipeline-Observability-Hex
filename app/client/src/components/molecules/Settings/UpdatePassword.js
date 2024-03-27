import React, { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import usePost from "@/hooks/usePost";

const UpdatePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { loading, error, data, postData } = usePost();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword && oldPassword) {
      await postData("/api/changepassword", { newPassword, oldPassword });
    } else {
      WarningToast("Enter All Fields First!");
    }
  };

  // Handle success and error messages after rendering is complete
  useEffect(() => {
    if (data && data.message === "Password updated successfully") {
      SuccessToast("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
    } else if (error) {
      ErrorToast(error);
    }
  }, [data, error]);

  return (
    <div className="flex w-full flex-col p-2">
      <div className="self-end mb-2">
        <button
          className="bg-purple-600 px-3 py-1 rounded-md"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="flex w-full flex-col md:w-[60%] border border-gray-800 self-center shadow shadow-blue-950 p-2 xs:p-10 rounded-lg">
        <SettingsText
          Heading={"Change Password"}
          Description={"Renew your digital credentials: Stay proactive in protecting your information by updating your password, ensuring continuous security and peace of mind."}
        />
        <div>
          <div className="w-[100%] flex flex-col my-3">
            <label htmlFor="oldPassword" className="my-2">
              Old Password
            </label>
            <input
              className="border-2 w-full sm:w-[70%] p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
              placeholder="*********"
              type="password"
              name="oldPassword"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={loading}
            />
          </div>{" "}
          <div className="w-[100%] flex flex-col my-3">
            <label htmlFor="newPassword" className="my-2">
              New Password
            </label>
            <input
              className="border-2 w-full sm:w-[70%] p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
              placeholder="*********"
              type="password"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
