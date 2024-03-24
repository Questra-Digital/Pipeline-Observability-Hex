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
            className="border-2 w-full sm:w-[70%] p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
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
