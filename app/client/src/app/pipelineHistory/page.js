"use client";
import axios from "../../axios";
import { useEffect, useState } from "react";

function Page() {
  const [history, setHistory] = useState([]);
  const pipelineName = localStorage.getItem('pipeline');

  useEffect(() => {
    async function fetchPipelineData() {
      try {
        const response = await axios.get("/pipeline_history", {
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
      <h1 className="text-center mt-5 font-semibold text-2xl text-red-600">
        Pipeline State: {pipelineName}
      </h1>
      <div className="flex flex-wrap px-5 py-2 bg-blue-300 w-[90%] items-center mt-10 mb-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <p className="my-px">Pipeline Name</p>
        <p className="my-px">Deployment</p>
        <p className="my-px">Service</p>
        <p className="my-px">Pod</p>
        <p className="my-px">replicaSet</p>
        <p className="my-px">Time</p>
      </div>

      {history.map((data, index) => (
        <div className="flex flex-wrap px-5 py-2 bg-blue-300 w-[90%] items-center grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 my-px">
          
          <p className="my-px">{data.pipeline_name}</p>
          <p className="my-px">{data.summary.deployment}</p>
          <p className="my-px">{data.summary.service}</p>
          <p className="my-px">{data.summary.pod}</p>
          <p className="my-px">{data.summary.replicaSet}</p>
          <p className="my-px">{data.time}</p>
        </div>
      ))}
    </div>
  );
}

export default Page;
