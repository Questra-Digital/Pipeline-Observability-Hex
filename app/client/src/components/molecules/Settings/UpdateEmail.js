import React, { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import usePost from "@/hooks/usePost";

const UpdateEmail = () => {
  const [email, setEmail] = useState("");
  const { loading, error, data, postData } = usePost();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email) {
      await postData("/api/email", { email });
    } else {
      WarningToast("Enter Email First!");
    }
  };

  // Handle success and error messages after rendering is complete
  useEffect(() => {
    if (data && data.message === "Email Saved successfully") {
      SuccessToast("Email Updated successfully!");
      setEmail("");
    } else if (error) {
      ErrorToast(error);
    }
  }, [data, error]);

  return (
    <div className="flex w-full flex-col p-5 sm:p-2 border rounded-lg border-gray-600 sm:border-none mt-3 sm:mt-0">
      <div className="self-end mb-2">
        <button
          className="bg-gradient-to-r from-red-600 to-red-900 px-6 py-2 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-red-950/20"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Syncing..." : "Save Changes"}
        </button>
      </div>
      <div className="flex w-full flex-col md:w-[60%] border border-gray-800 self-center shadow shadow-blue-950 p-2 xs:p-10 rounded-lg">
        <SettingsText
          Heading={"Email Settings"}
          Description={"Stay connected with ease: Update your email address effortlessly to ensure continuity in receiving updates, alerts, and communications regarding your account and activities."}
        />
        <div className="w-[100%] flex flex-col my-3">
          <label htmlFor="email" className="my-2">
            Email
          </label>
          <input
            className="w-full sm:w-[80%] p-3 h-12 outline-none bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-red-600 transition-all"
            placeholder="example@gmail.com"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default UpdateEmail;
