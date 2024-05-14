import React, { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import useFetch from "@/hooks/useFetch";
import usePost from "@/hooks/usePost";

const UpdateSenderEmail = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { data, error, loading, fetchData } = useFetch(
    "/api/notifier-email"
  );
  const { postData } = usePost();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      setEmail(data.email);
      setPassword(data.password);
    }
  }, [data]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (email && password) {
        if (!/\S+@\S+\.\S+/.test(email)) {
          WarningToast("Invalid Email Address");
        } else if (password.length !== 8) {
          WarningToast("Password must be 8 characters long.");
        } else {
          await postData("/api/notifier-email", { email, password });
        }
      } else {
        WarningToast("Enter Sender Email and Password First!");
      }
        SuccessToast("Email and App Password Updated Successfully!");
      } catch (error) {
        if (error.response && error.response.status === 401) {
          ErrorToast(error.response.data.error);
        } else {
          ErrorToast("Error updating Email and Password!");
        }
      }
  };

  // Handle success and error messages after rendering is complete
  useEffect(() => {
    if (data && data.message === "Email Saved successfully") {
      SuccessToast("Email Updated successfully!");
      setEmail("");
      setPassword("");
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
          <label htmlFor="email" className="my-2">
            Sender Email
          </label>
          <input
            className="border-2 w-full sm:w-[70%] p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
            placeholder="sender@gmail.com"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="w-[100%] flex flex-col my-3">
          <label htmlFor="password" className="my-2">
            App Password
          </label>
          <input
            className="border-2 w-full sm:w-[70%] p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
            placeholder="********"
            type="text"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default UpdateSenderEmail;