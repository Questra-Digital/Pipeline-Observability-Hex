import React, { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import {
  ErrorToast,
  SuccessToast,
  WarningToast,
} from "@/components/atoms/toastUtils/Toast";
import usePost from "@/hooks/usePost";
import useFetch from "@/hooks/useFetch";

const UpdateMessage = () => {
  const [deviationValue, setDeviationValue] = useState("");
  const {
    loading: postDataLoading,
    error: postDataError,
    data: postDataResponse,
    postData,
  } = usePost();
  const {
    data: deviationData,
    error: deviationError,
    loading: deviationLoading,
    fetchData: fetchDeviationValue,
  } = useFetch("/api/custom-message"); // Use useFetch hook to get deviation value

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (deviationValue) {
      await postData("/api/custom-message", {
        custom_message: deviationValue,
      });
    } else {
      WarningToast("Enter Value First!");
    }
  };

  // Handle success and error messages after rendering is complete
  useEffect(() => {
    if (
      postDataResponse &&
      postDataResponse.message === "Custom Message inserted...."
    ) {
      SuccessToast("Custom Message Updated!");
    } else if (postDataError) {
      ErrorToast(postDataError);
    }
  }, [postDataResponse, postDataError]);

  // Fetch deviation value on component mount
  useEffect(() => {
    fetchDeviationValue();
  }, []);

  useEffect(() => {
    if (deviationData) {
      setDeviationValue(deviationData.customMessage);
    } else if (deviationError) {
      ErrorToast(deviationError);
    }
  }, [deviationData, deviationError]);

  return (
    <div className="flex w-full flex-col p-2">
      <div className="self-end mb-2">
        <button
          className="bg-purple-600 px-3 py-1 rounded-md"
          onClick={handleSubmit}
          disabled={postDataLoading || deviationLoading}
        >
          {postDataLoading || deviationLoading ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="flex w-full flex-col md:w-[60%] border border-gray-800 self-center shadow shadow-blue-950 p-2 xs:p-10 rounded-lg">
        <SettingsText
          Heading={"Customize Your Message"}
          Description={
            "You can customize the message that will be sent to the user when the deviation value is greater than the threshold."
          }
        />
        <div className="w-[100%] flex flex-col my-3">
          <label htmlFor="deviation" className="my-2">
            Message
          </label>
          <input
            className="border-2 w-full sm:w-[70%] p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
            placeholder="Enter your message here..."
            name="deviation"
            min="1"
            value={deviationValue}
            onChange={(e) => setDeviationValue(e.target.value)}
            disabled={postDataLoading || deviationLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default UpdateMessage;
