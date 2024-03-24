'use client'
import React, { useEffect, useState } from "react";
import HistoryHeader from "@/components/molecules/PipelineHistory/HistoryHeader";
import PipelineDataRow from "@/components/molecules/PipelineHistory/PipelineDataRow";
import TextAtom from "@/components/atoms/TextAtom";
import instance from "@/axios/axios";

function PipelineHistory() {
  const [history, setHistory] = useState([]);
  const pipelineName = localStorage.getItem("pipeline");
  const Labels = ["PipelineName", "Deployment", "Service", "Pod", "ReplicaSet", "Time"];

  useEffect(() => {
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
    <div className="w-[100%] flex justify-center items-center flex-col">
      <HistoryHeader labels={Labels} pipelineName={pipelineName} />

      {history &&
        (history.length === 0 ? (
          <TextAtom properties={"text-center text-lg font-semibold text-red-600 mt-4"} text={"No previous history available"}/>
        ) : (
          history.map((data, index) => (
            <PipelineDataRow data={data} key={index} />
          ))
        ))}
    </div>
  );
}

export default PipelineHistory;