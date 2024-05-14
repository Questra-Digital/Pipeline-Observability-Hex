import React, { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import usePost from "@/hooks/usePost";

const UpdateSenderEmail = () => {
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPassword, setSenderPassword] = useState("");
  const { loading, error, data, postData } = usePost();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (senderEmail && senderPassword) {
      if (!/\S+@\S+\.\S+/.test(senderEmail)) {
        WarningToast("Invalid Email Address");
      } else if (senderPassword.length !== 8) {
        WarningToast("Password must be 8 characters long.");
      } else {
        await postData("/api/sender-email", { senderEmail, senderPassword });
      }
    } else {
      WarningToast("Enter Sender Email and Password First!");
    }
  };

  // Handle success and error messages after rendering is complete
  useEffect(() => {
    if (data && data.message === "Email Saved successfully") {
      SuccessToast("Email Updated successfully!");
      setSenderEmail("");
      setSenderPassword("");
    } else if (error) {
      ErrorToast(error);
    }
  }, [data, error]);

  return (
    <div className="flex w-full flex-col p-5 sm:p-2 border rounded-lg border-gray-600 sm:border-none mt-3 sm:mt-0">
      <div className="self-end mb-2">
        <button
          className="bg-purple-600 px-3 py-1 rounded-md"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="flex w-full flex-col md:w-[60%] border border-gray-800 self-center shadow shadow-blue-950 p-2 xs:p-10 rounded-lg mt-5">
        <SettingsText
          Heading={"Sender Email Settings"}
          Description={"Update your sender email and password to ensure seamless communication."}
        />
        <div className="w-[100%] flex flex-col my-3">
          <label htmlFor="senderEmail" className="my-2">
            Sender Email
          </label>
          <input
            className="border-2 w-full sm:w-[70%] p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
            placeholder="sender@gmail.com"
            type="email"
            name="senderEmail"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="w-[100%] flex flex-col my-3">
          <label htmlFor="senderPassword" className="my-2">
            App Password
          </label>
          <input
            className="border-2 w-full sm:w-[70%] p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
            placeholder="********"
            type="text"
            name="senderPassword"
            value={senderPassword}
            onChange={(e) => setSenderPassword(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default UpdateSenderEmail;