"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import HistoryHeader from "@/components/molecules/PipelineHistory/HistoryHeader";
import PipelineDataRow from "@/components/molecules/PipelineHistory/PipelineDataRow";
import TextAtom from "@/components/atoms/TextAtom";
import instance from "@/axios/axios";
import BackButton from "../atoms/BackButton";
import HitoryGraph from "../molecules/PipelineHistory/HistoryGraph";
import SuccessCard from "../molecules/PipelineHistory/SuccessCard";
import FailureCard from "../molecules/PipelineHistory/FailureCard";

function PipelineHistory() {
  const searchParams = useSearchParams();
  const [history, setHistory] = useState([]);
  const [pipelineName, setPipelineName] = useState("");
  const labels = ["Time", "Deployment", "Service", "Pod", "ReplicaSet"];

  useEffect(() => {
    setPipelineName(searchParams.get("pipeline"));
    async function fetchPipelineData() {
      try {
        const response = await instance.get("/pipeline_history", {
          headers: {
            Authorization: `Bearer ${
              JSON.parse(localStorage.getItem("userData")).token
            }`,
          },
          params: {
            pipeline: `${searchParams.get("pipeline")}`,
          },
        });

        setHistory(response.data);

        console.log(response.data);
      } catch (error) {
        console.error("Error fetching pipeline data:", error.message);
      }
    }

    fetchPipelineData();
  }, []);

  return (
    <div className="w-[100%] flex justify-center items-center flex-col">
      <div className="w-full flex justify-start my-5">
        <BackButton />
        <TextAtom properties={"font-semibold text-xl py-3 px-10 capitalize"}>
          <span className="text-gray-400">{pipelineName}</span>
        </TextAtom>
      </div>
      <div className="w-[90%] max-h-[400px] flex justify-between">
        <div className="w-[75%] max-h-full bg-gray-900 rounded-lg shadow shadow-yellow-900 p-4">
          {history && <HitoryGraph history={history} />}
        </div>
        <div className="w-fit flex flex-col justify-between">
          <SuccessCard history={history} />
          <FailureCard history={history} />
        </div>
      </div>
      <TextAtom text={"Pipeline History"} properties={"w-[90%] text-2xl font-semibold mt-16"} />
      <table className="w-[90%] rounded-lg my-5">
        <HistoryHeader labels={labels} />
        <tbody className="">
          {!history || history?.length === 0 ? (
            <tr>
              <td colSpan={labels.length}>
                <TextAtom
                  properties="text-center animate-pulse text-2xl font-semibold text-red-600"
                  text="No history available for this pipeline!"
                />
              </td>
            </tr>
          ) : (
            history?.map((data, index) => (
              <PipelineDataRow data={data} key={index} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default PipelineHistory;
