"use client";
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import { useRouter } from "next/navigation";

function page() {
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
    localStorage.setItem('pipeline',`${pipelineName}`);
    console.log(localStorage.getItem('pipeline'));
    router.push(`/pipelineHistory`);
  }

  const handleStateClick = (pipelineName) => {
    console.log("Clicked on pipeline:", pipelineName);
    localStorage.setItem('pipeline',`${pipelineName}`);
    console.log(localStorage.getItem('pipeline'));
    // router.push(`/pipelineState`, { pipeline: `${pipelineName}` });
    router.push(`/pipelineState`);
  }

  return (
    <div className="flex flex-col justify-center items-center py-5">
      <h1 className="text-2xl font-bold">Configured Pipelines</h1>
      <div className="flex flex-col justify-between sm:w-[70%] w-[100%] my-10">
        <div className="flex flex-row justify-between py-3 px-10 rounded-2xl bg-slate-500 mb-5 font-bold text-md">
          <p className="mx-2">Name</p>
          <p className="font-bold h-full">|</p>
          <p className="mx-2">Actions</p>
        </div>
        {pipelines.map((pipeline, index) => (
          <div
            className="flex flex-row flex-wrap justify-between py-3 px-10 rounded-2xl text-black font-semibold bg-rose-200 mb-2"
            key={index}
          >
            <p className="px-3 py-2">{pipeline}</p>
            <div>
            <button className="rounded-full bg-sky-400 px-3 py-2 mx-2"
            onClick={() => handleStateClick(pipeline)}>
              Explore
            </button>
            <button className="rounded-full bg-sky-400 px-3 py-2"
            onClick={() => handleHistoryClick(pipeline)}>
              History
            </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default page;
