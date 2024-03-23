import { useState } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import {
  ErrorToast,
  SuccessToast,
  WarningToast,
} from "@/components/atoms/toastUtils/Toast";
import instance from "@/axios/axios";

const UpdateToken = () => {
  const [token, setToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (token) {
      try {
        const authToken = JSON.parse(localStorage.getItem("userData")).token;
        const response = await instance.post(
          "/api/token",
          { token },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        if (
          response.status === 200 &&
          response.data.message === "Token Saved successfully"
        ) {
          SuccessToast("Token Updated successfully!");
        } else {
          SuccessToast;
          ErrorToast("Failed to update token. Please try again.");
        }
      } catch (error) {
        if (error.response.status == 401) {
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
    <div className="flex w-full flex-col p-2">
      <div className="self-end">
        <button
          className="bg-purple-600 h-fit px-3 py-1 rounded-md"
          onClick={handleSubmit}
        >
          Save
        </button>
      </div>
      <div className="flex w-full flex-col md:w-[60%] border border-gray-800 self-center shadow shadow-blue-950 p-2 xs:p-10 rounded-lg">
        <SettingsText
          Heading={"Token Settings"}
          Description={
            "Ensure uninterrupted insights: Keep your monitoring current with a renewed ArgoCD token, ensuring seamless access to real-time analytics for informed decision-making."
          }
        />
        <div className="w-[100%] flex flex-col my-3">
          <label htmlFor="token" className="my-2">
            Token
          </label>
          <input
            className="border-2 w-full sm:w-[70%] p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
            placeholder="ArgoCD Token"
            type="text"
            name="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default UpdateToken;
