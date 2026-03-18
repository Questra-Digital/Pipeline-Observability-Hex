import React, { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import usePost from "@/hooks/usePost";
import useFetch from "@/hooks/useFetch";

const UpdateDeviationValue = () => {
  const [deviationValue, setDeviationValue] = useState("");
  const { loading: postDataLoading, error: postDataError, data: postDataResponse, postData } = usePost();
  const { data: deviationData, error: deviationError, loading: deviationLoading, fetchData: fetchDeviationValue } = useFetch("/api/deviation-value"); // Use useFetch hook to get deviation value

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (deviationValue) {
      await postData("/api/deviation-value", { deviation_value: deviationValue });
    } else {
      WarningToast("Enter Value First!");
    }
  };

  // Handle success and error messages after rendering is complete
  useEffect(() => {
    if (postDataResponse && postDataResponse.message === "Deviation Value inserted....") {
      SuccessToast("Deviation Value Updated!");
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
      setDeviationValue(deviationData.deviationValue);
    } else if (deviationError) {
      ErrorToast(deviationError);
    }
  }, [deviationData, deviationError]);

  return (
    <div className="flex w-full flex-col p-2">
      <div className="self-end mb-2">
        <button
          className="bg-gradient-to-r from-red-600 to-red-900 px-6 py-2 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-red-950/20"
          onClick={handleSubmit}
          disabled={postDataLoading || deviationLoading}
        >
          {(postDataLoading || deviationLoading) ? "Calculating..." : "Update Deviation"}
        </button>
      </div>
      <div className="flex w-full flex-col md:w-[60%] border border-gray-800 self-center shadow shadow-blue-950 p-2 xs:p-10 rounded-lg">
        <SettingsText
          Heading={"Deviation Settings"}
          Description={"Stay informed on your terms: Tailor your alerts by setting the Deviation Value, ensuring notifications align perfectly with your operational requirements and preferences."}
        />
        <div className="w-[100%] flex flex-col my-3">
          <label htmlFor="deviation" className="my-2">
            Deviation Value
          </label>
          <input
            className="w-full sm:w-[80%] p-3 h-12 outline-none bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-red-600 transition-all"
            placeholder="10"
            type="number"
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

export default UpdateDeviationValue;
