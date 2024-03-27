"use client";
import instance from "@/axios/axios";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import { useState } from "react";
import {useDispatch} from 'react-redux';
import { useRouter } from "next/navigation";
import { addApp } from "@/redux/features/apps/appsSlice";

const Slack = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [token, setToken] = useState("");
  const [channel, setChannel] = useState("");

  const handleConfigure = async (e) => {
    e.preventDefault();
    if (channel && token) {
      try {
        const authToken = JSON.parse(localStorage.getItem("userData")).token;
        const response = await instance.post(
          "/api/slack",
          { token, channel },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        if (
          response.status === 200
        ) {
          SuccessToast("Slack configured successfully!");
          dispatch(addApp({name: 'slack'}));
          setToken("");
          setChannel("");
          router.back();
        } else {
          ErrorToast("Failed to save. Please try again.");
        }
      } catch (error) {
        if (error?.response?.data?.error) ErrorToast(error.response.data.error);
        else ErrorToast("We are facing some issue. Try Again!");
      }
    } else {
      WarningToast("Enter All Fields!");
    }
  };

  return (
    <div className="border flex flex-col rounded-md border-gray-500 shadow shadow-blue-500 p-5 sm:p-8 max-w-[450px] sm:py-12">
      <div className="mb-8">
        <p className="text-xl xs:text-2xl font-bold mb-3">Slack Setup</p>
        <p>
          Empower your communication flow: Stay synced across platforms by
          Setting up Slack, empowering your team with synchronized communication
          channels for efficient collaboration.
        </p>
      </div>
      <div className="w-[100%] flex flex-col mb-10">
        <label htmlFor="botToken" className="my-2 sm:text-lg">
          Bot Token
        </label>
        <input
          className="border-2 w-full py-2 px-3 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
          placeholder="xxxxxx-xxxxxx-xxxxxx-xxxxxx"
          type="text"
          name="botToken"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <label htmlFor="channelID" className="my-2 sm:text-lg">
          Channel ID
        </label>
        <input
          className="border-2 w-full py-2 px-3 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
          placeholder="CXXXXXXXXXX"
          type="text"
          name="channelID"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
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

export default Slack;
