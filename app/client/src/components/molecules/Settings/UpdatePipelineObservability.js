import { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast } from "@/components/atoms/toastUtils/Toast";
import useFetch from "@/hooks/useFetch";
import ToggleButton from "@/components/atoms/ToggleButton";

const UpdatePipelineObservability = () => {
  const [observabilityStatus, setObservabilityStatus] = useState(false);
  const [request, setRequest] = useState("/api/cronjob/status");
  const { data, error, loading, fetchData } = useFetch(request);

  useEffect(() => {
    fetchData();
  }, [request]);

  useEffect(() => {
    if (data) {
      if (data.message === "Cronjob Stopped") {
        setObservabilityStatus(false);
      } else if (data.message === "Cronjob started") {
        setObservabilityStatus(true);
      } else if(data?.message) {
        setObservabilityStatus(data.message);
      }
    }
  }, [data]);

  const handleSave = async () => {
    if (observabilityStatus) {
      try {
        await setRequest("/api/runcronjob");
        SuccessToast("Status Updated Successfully!");
      } catch (error) {
        if (error.response && error.response.status === 401) {
          ErrorToast(error.response.data.error);
        } else {
          ErrorToast("Error updating status!");
        }
      }
    } else {
      try {
        await setRequest("/api/stopcronjob");
        SuccessToast("Status Updated Successfully!");
      } catch (error) {
        if (error.response && error.response.status === 401) {
          ErrorToast(error.response.data.error);
        } else {
          ErrorToast("Error updating status!");
        }
      }
    }
  };

  return (
    <div className="flex w-full flex-col p-2">
      <div className="self-end">
        <button
          className="bg-purple-600 h-fit px-3 py-1 rounded-md"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="flex w-full flex-col md:w-[60%] border border-gray-800 self-center shadow shadow-blue-950 p-2 xs:p-10 rounded-lg">
        <SettingsText
          Heading={"Pipeline Observability"}
          Description={
            "Empower your pipeline with insights: Activate Pipeline Observability to empower your team with real-time analytics, enabling informed decision-making and continuous improvement."
          }
        />
        <div className="w-[100%] flex flex-col xs:flex-row items-center xs:justify-evenly border border-gray-700 rounded-lg mt-20">
          <p className="my-2">Observability Status</p>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={observabilityStatus}
              onChange={(e) => setObservabilityStatus(e.target.checked)}
              className="sr-only peer"
            />
            <ToggleButton />
          </label>
        </div>
      </div>
    </div>
  );
};

export default UpdatePipelineObservability;
