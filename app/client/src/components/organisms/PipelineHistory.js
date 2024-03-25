"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import HistoryHeader from "@/components/molecules/PipelineHistory/HistoryHeader";
import PipelineDataRow from "@/components/molecules/PipelineHistory/PipelineDataRow";
import TextAtom from "@/components/atoms/TextAtom";
import instance from "@/axios/axios";

function PipelineHistory() {
  const searchParams = useSearchParams();
  const [history, setHistory] = useState([]);
  const [pipelineName, setPipelineName] = useState("");
  const Labels = [
    "PipelineName",
    "Deployment",
    "Service",
    "Pod",
    "ReplicaSet",
    "Time",
  ];

  useEffect(() => {
    setPipelineName(searchParams.get("pipeline"));
    async function fetchPipelineData() {
      try {
        const response = await instance.get("/pipeline_history", {
          params: {
            pipeline: `${pipelineName}`,
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
    <div className="w-[100%] h-full flex justify-center items-center flex-col">
      <HistoryHeader labels={Labels} pipelineName={pipelineName} />

      {history &&
        (history.length === 0 ? (
          <div className="w-full h-full justify-center items-center">
            <TextAtom
              properties={"text-center animate-pulse text-2xl font-semibold text-red-600"}
              text={"No history available for this pipeline!"}
            />
          </div>
        ) : (
          history.map((data, index) => (
            <PipelineDataRow data={data} key={index} />
          ))
        ))}
    </div>
  );
}

export default PipelineHistory;