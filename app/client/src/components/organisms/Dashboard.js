"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CardContainer from "@/components/molecules/PipelineDashboard/CardContainer";
import TimeSeriesGraph from "@/components/molecules/PipelineDashboard/TimeSeriesGraph";
import TextAtom from "../atoms/TextAtom";
import BackButton from "../atoms/BackButton";
import PipelineExecutionGraph from "../molecules/PipelineDashboard/PipelineExecutionGraph";
import PipelineSuccessRate from "../molecules/PipelineDashboard/Pipeline-Overall-Rate";
import instance from "@/axios/axios";
import PipelineDurationChart from "../molecules/PipelineDashboard/PipelineDurationChart";
import PipelineDurationDistribution from "../molecules/PipelineDashboard/PipelineDurationDistribution";
import TopSlowPipelines from "../molecules/PipelineDashboard/TopSlowPipelines";

function Dashboard() {
  const searchParams = useSearchParams();
  const [pipelineData, setPipelineData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [status, setStatus] = useState({});
  const [pipelineName, setPipelineName] = useState("");
  const [history, setHistory] = useState();

  async function fetchPipelineData() {
    try {
      const response = await instance.get("/pipeline_history", {
        headers: {
          Authorization: `Bearer ${
            JSON.parse(localStorage.getItem("userData")).token
          }`,
        },
        params: {
          pipeline: `${pipelineName}`,
        },
      });

      console.log("Pipeline rate data: ", response.data);

      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching pipeline data:", error.message);
    }
  }

  useEffect(() => {
    setPipelineName(searchParams.get("pipeline"));

    fetchPipelineData();
    // Web Socket Connection
    const ws = new WebSocket("ws://localhost:8000/pipeline_state");

    // On connection open sending data(pipeline name)
    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({ Name: pipelineName }));
    };

    // Receving data from the server
    ws.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);

      // console.log("Received data:", receivedData.Status);
      setStatus(receivedData.Status);

      const updatedData = {
        Pod: receivedData.Pod,
        Service: receivedData.Service,
        Deployment: receivedData.Deployment,
        ReplicaSet: receivedData.ReplicaSet,
        timestamp: new Date().toISOString(),
      };

      // Update pipelineData in increasing order
      setPipelineData((prevData) => [...prevData, updatedData]);
      setCurrentData({
        Pod: receivedData.Pod,
        Service: receivedData.Service,
        Deployment: receivedData.Deployment,
        ReplicaSet: receivedData.ReplicaSet,
      });
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      console.log("Closing WebSocket Connection!");
      ws.close();
    };
  }, [pipelineName]);

  return (
    <div className="w-full p-5">
      <div className="w-full flex justify-start">
        <BackButton />
        <TextAtom properties={"font-semibold text-xl py-3 px-10 capitalize"}>
          <span className="text-gray-400">{pipelineName}</span>
        </TextAtom>
      </div>
      <CardContainer data={currentData} />
      <div className="grid grid-cols-2 gap-4 mt-5 grid-rows-3">
        <div>
          <TimeSeriesGraph data={pipelineData} />
        </div>
        <div>
          <PipelineSuccessRate history={history} />
        </div>
        <div>
          <PipelineExecutionGraph historyData={status?.history} />
        </div>
        <div>
          <PipelineDurationChart history={status?.history} />
        </div>
        <div>
          <PipelineDurationDistribution history={status?.history} />
        </div>
        <div>
          <TopSlowPipelines executions={status?.history} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
