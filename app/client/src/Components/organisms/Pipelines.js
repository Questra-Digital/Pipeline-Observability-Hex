"use client";
import React, { useState, useEffect } from "react";
import axios from "../../axios/axios";
import { useRouter } from "next/navigation";
import TextAtom from "@/Components/atoms/TextAtom";
import PipelinesList from "@/Components/molecules/Pipelines/PipelineList";

function Pipelines() {
  const [pipelines, setPipelines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    async function fetchPipelines() {
      try {
        const response = await axios.get("/get_all_pipelines", {});
        setPipelines(response.data.available_pipeline);
        console.log(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching files:", error.message);
        setIsLoading(false);
      }
    }

    fetchPipelines();
  }, []);

  const handleHistoryClick = (pipelineName) => {
    console.log("Clicked on pipeline:", pipelineName);
    localStorage.setItem("pipeline", `${pipelineName}`);
    console.log(localStorage.getItem("pipeline"));
    router.push(`/pipelineHistory`);
  };

  const handleStateClick = (pipelineName) => {
    console.log("Clicked on pipeline:", pipelineName);
    localStorage.setItem("pipeline", `${pipelineName}`);
    console.log(localStorage.getItem("pipeline"));
    // router.push(`/pipelineState`, { pipeline: `${pipelineName}` });
    router.push(`/pipelineState`);
  };

  return (
    <div className="flex flex-col justify-center items-center py-5">
      <TextAtom
        properties={"text-2xl font-bold"}
        text={"Configured Pipelines"}
      />
      <PipelinesList
        pipelines={pipelines}
        onStateClick={handleStateClick}
        onHistoryClick={handleHistoryClick}
      />
    </div>
  );
}

export default Pipelines;
