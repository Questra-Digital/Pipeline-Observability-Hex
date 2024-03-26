"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import HistoryHeader from "@/components/molecules/PipelineHistory/HistoryHeader";
import PipelineDataRow from "@/components/molecules/PipelineHistory/PipelineDataRow";
import TextAtom from "@/components/atoms/TextAtom";
import instance from "@/axios/axios";
import BackButton from "../atoms/BackButton";

function PipelineHistory() {
  const searchParams = useSearchParams();
  const [history, setHistory] = useState([]);
  const [pipelineName, setPipelineName] = useState("");
  const labels = [
    "Time",
    "Deployment",
    "Service",
    "Pod",
    "ReplicaSet",
  ];

  useEffect(() => {
    setPipelineName(searchParams.get("pipeline"));
    async function fetchPipelineData() {
      try {
        const response = await instance.get("/pipeline_history", {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
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
    <BackButton/> 
      <table className="w-[90%] my-3 rounded-lg">
        <HistoryHeader labels={labels} />
        <tbody className="">
          {history.length === 0 ? (
            <tr>
              <td colSpan={labels.length}>
                <TextAtom
                  properties="text-center animate-pulse text-2xl font-semibold text-red-600"
                  text="No history available for this pipeline!"
                />
              </td>
            </tr>
          ) : (
            history.map((data, index) => (
              <PipelineDataRow data={data} key={index} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default PipelineHistory;
