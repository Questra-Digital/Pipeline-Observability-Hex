import { useState } from "react";
import { useDispatch } from 'react-redux';
import { addApp } from "@/redux/features/apps/appsSlice";
import { useRouter } from "next/navigation";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import instance from "@/axios/axios";

const Gmail = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");

  const handleConfigure = async (e) => {
    e.preventDefault();
    if (!email || !senderEmail || !appPassword) {
      WarningToast("Enter all fields!");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email) || !/\S+@\S+\.\S+/.test(senderEmail)) {
      WarningToast("Enter valid email addresses!");
      return;
    }

    if (appPassword.length !== 8) {
      WarningToast("App Password must be 8 characters long!");
      return;
    }

    try {
      const authToken = JSON.parse(localStorage.getItem("userData")).token;
      const response = await instance.post(
        "/api/email",
        { email, senderEmail, appPassword },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (response.status === 200) {
        SuccessToast("Email Saved successfully!");
        dispatch(addApp({ name: "email" }));
        setEmail("");
        setSenderEmail("");
        setAppPassword("");
        router.back();
      } else {
        ErrorToast("Failed to save email. Please try again.");
      }
    } catch (error) {
      if (error?.response?.data?.error) ErrorToast(error.response.data.error);
      else ErrorToast("We are facing some issue. Try Again!");
    }
  };

  return (
    <div className="border flex flex-col rounded-md border-gray-500 shadow shadow-blue-500 p-5 sm:p-8 max-w-[450px] sm:py-12">
      <div className="mb-8">
        <p className="text-xl xs:text-2xl font-bold mb-3">Gmail Setup</p>
        <p>
          Stay connected with ease: Configure your email effortlessly to ensure
          continuity in receiving updates, alerts, and communications regarding
          your account and activities.
        </p>
      </div>
      <div className="w-[100%] flex flex-col mb-10">
        <label htmlFor="email" className="my-2 sm:text-lg">
          Reciever Email
        </label>
        <input
          className="border-2 w-full py-2 px-3 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
          placeholder="example@gmail.com"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="senderEmail" className="my-2 sm:text-lg">
          Sender Email
        </label>
        <input
          className="border-2 w-full py-2 px-3 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
          placeholder="sender@example.com"
          type="email"
          name="senderEmail"
          value={senderEmail}
          onChange={(e) => setSenderEmail(e.target.value)}
        />
        <label htmlFor="appPassword" className="my-2 sm:text-lg">
          App Password
        </label>
        <input
          className="border-2 w-full py-2 px-3 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
          placeholder="********"
          type="text"
          name="appPassword"
          value={appPassword}
          onChange={(e) => setAppPassword(e.target.value)}
        />
      </div>
      <button
        className="bg-purple-600 py-2 rounded-lg text-lg font-semibold"
        onClick={handleConfigure}
      >
        Configure
      </button>
    </div>
  );
};

export default Gmail;