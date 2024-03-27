"use client";
import instance from "@/axios/axios";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addApp } from "@/redux/features/apps/appsSlice";
import { useRouter } from "next/navigation";

const ArgoCD = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [token, setToken] = useState("");
  const authToken = useSelector((state) => state.user.token);

  const handleConfigure = async (e) => {
    e.preventDefault();
    if (token) {
      try {
        const response = await instance.post(
          "/api/token",
          { token },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        if (response?.status === 200) {
          SuccessToast("Token Saved successfully!");
          dispatch(addApp({name: "argocd"}))
          setToken("");
          router.back();
        } else {
          ErrorToast("Failed to save token. Please try again.");
        }
      } catch (error) {
        if (error?.response?.status == 401) {
          ErrorToast("Please enter a valid token!");
        } else if (error?.response?.data?.error)
          ErrorToast(error.response.data.error);
        else ErrorToast("We are facing some issue. Try Again!");
      }
    } else {
      WarningToast("Enter Token First!");
    }
  };

  return (
    <div className="border flex flex-col rounded-md border-gray-500 shadow shadow-blue-500 p-5 sm:p-8 max-w-[450px] sm:py-12">
      <div className="mb-8">
        <p className="text-xl xs:text-2xl font-bold mb-3">ArgoCD Setup</p>
        <p>
          Ensure uninterrupted insights: Keep your monitoring current with a
          ArgoCD token, ensuring seamless access to real-time analytics for
          informed decision-making.
        </p>
      </div>
      <div className="w-[100%] flex flex-col mb-10">
        <label htmlFor="token" className="my-2 sm:text-lg">
          ArgoCD Token
        </label>
        <input
          className="border-2 w-full py-2 px-3 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
          placeholder="xxxxxx-xxxxxx-xxxxxx-xxxxxx"
          type="text"
          name="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
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

export default ArgoCD;
