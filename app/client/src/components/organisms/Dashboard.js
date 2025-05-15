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
import React from "react";
import PipelineFailRate from "../molecules/PipelineDashboard/Pipeline-Fail-Rate";

function Dashboard() {
  const searchParams = useSearchParams();
  const [pipelineData, setPipelineData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [status, setStatus] = useState({});
  const [pipelineName, setPipelineName] = useState("");
  const [history, setHistory] = useState();
  const [loading, setLoading] = useState(true);
  const [allHistories, setAllHistories] = useState([]); // [{pipeline, history}]
  const [mostRecentFailed, setMostRecentFailed] = useState(null); // {pipeline, failedExecution}
  const [topFailedPipeline, setTopFailedPipeline] = useState(null); // {pipeline, count}

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

  useEffect(() => {
    async function fetchAllPipelineFailures() {
      setLoading(true);
      try {
        // 1. Fetch all pipeline names
        const pipelinesRes = await instance.get("/all_pipelines", {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("userData")).token}`,
          },
        });
        const pipelines = pipelinesRes.data.available_pipeline;
        // 2. Fetch history for each pipeline
        const histories = await Promise.all(
          pipelines.map(async (pipeline) => {
            try {
              const res = await instance.get("/pipeline_history", {
                headers: {
                  Authorization: `Bearer ${JSON.parse(localStorage.getItem("userData")).token}`,
                },
                params: { pipeline },
              });
              return { pipeline, history: res.data };
            } catch (e) {
              return { pipeline, history: [] };
            }
          })
        );
        setAllHistories(histories);
        // 3. Aggregate failures
        let mostRecent = null;
        let topFailed = { pipeline: null, count: 0 };
        // --- work by faissal: Updated failure detection logic to match backend data structure ---
        histories.forEach(({ pipeline, history }) => {
          const failed = history.filter(item => {
            const s = item.summary || {};
            return (
              s.deployment !== "Healthy" ||
              s.pod !== "Healthy" ||
              s.replicaSet !== "Healthy" ||
              s.service !== "Healthy"
            );
          });
          // Top failed pipeline
          if (failed.length > topFailed.count) {
            topFailed = { pipeline, count: failed.length };
          }
          // Most recent failed pipeline
          failed.forEach(f => {
            if (!mostRecent || new Date(f.timestamp || f.time || f.createdAt || 0) > new Date(mostRecent.failedExecution.timestamp || mostRecent.failedExecution.time || mostRecent.failedExecution.createdAt || 0)) {
              mostRecent = { pipeline, failedExecution: f };
            }
          });
        });
        setMostRecentFailed(mostRecent);
        setTopFailedPipeline(topFailed.pipeline ? topFailed : null);
      } catch (e) {
        setAllHistories([]);
        setMostRecentFailed(null);
        setTopFailedPipeline(null);
      }
      setLoading(false);
    }
    // --- work by faissal: Fetch all pipeline failures every 5 seconds ---
    fetchAllPipelineFailures();
    const intervalId = setInterval(fetchAllPipelineFailures, 5000); // poll every 5 seconds
    return () => clearInterval(intervalId);
  }, []);

  // --- Failure Metrics ---
  // Extract failure and success metrics from status.history
  const historyData = status?.history || [];
  const failedExecutions = historyData.filter(item => item.phase === "Failed");
  const successExecutions = historyData.filter(item => item.phase === "Succeeded");
  const totalExecutions = historyData.length;
  const failureCount = failedExecutions.length;
  const successCount = successExecutions.length;
  const failureRate = totalExecutions > 0 ? ((failureCount / totalExecutions) * 100).toFixed(2) : "0.00";
  const successRate = totalExecutions > 0 ? ((successCount / totalExecutions) * 100).toFixed(2) : "0.00";
  const lastFailed = failedExecutions.length > 0 ? failedExecutions[failedExecutions.length - 1] : null;

  // --- UI for Failed Pipeline and Top Failed Pipelines ---
  // You can extract more info from lastFailed if needed (e.g., timestamp, id)

  return (
    <div className="w-full p-5">
      <div className="w-full flex justify-start">
        <BackButton />
        <TextAtom properties={"font-semibold text-xl py-3 px-10 capitalize"}>
          <span className="text-gray-400">Pipelines</span>
        </TextAtom>
      </div>
      {/* --- New Metrics Row --- */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Failed Pipeline Card */}
        <div className="border border-gray-700 bg-red-600 rounded-lg p-6 flex-1 min-w-[250px] flex flex-col items-center justify-center text-white shadow-md">
          <div className="text-lg font-semibold mb-2">Failed Pipeline</div>
          {loading ? (
            <div>Loading...</div>
          ) : mostRecentFailed && mostRecentFailed.failedExecution ? (
            <>
              <div className="text-2xl font-bold">{mostRecentFailed.pipeline}</div>
              <div className="text-sm mt-1">Phase: {mostRecentFailed.failedExecution.phase}</div>
              <div className="text-xs mt-1">{mostRecentFailed.failedExecution.timestamp || mostRecentFailed.failedExecution.time || mostRecentFailed.failedExecution.createdAt || ""}</div>
            </>
          ) : (
            <div className="text-md">No recent failures</div>
          )}
        </div>
        {/* Top Failed Pipeline Card */}
        <div className="border border-gray-700 bg-yellow-600 rounded-lg p-6 flex-1 min-w-[250px] flex flex-col items-center justify-center text-white shadow-md">
          <div className="text-lg font-semibold mb-2">Top Failed Pipeline</div>
          {loading ? (
            <div>Loading...</div>
          ) : topFailedPipeline ? (
            <>
              <div className="text-2xl font-bold">{topFailedPipeline.pipeline}</div>
              <div className="text-sm mt-1">Total Failures: {topFailedPipeline.count}</div>
            </>
          ) : (
            <div className="text-md">No failures found</div>
          )}
        </div>
      </div>
      {/* --- Existing Cards and Graphs --- */}
      <CardContainer data={currentData} />
      <div className="grid grid-cols-4 gap-4 mt-5 grid-rows-2">
        <div className="col-span-2">
          <TimeSeriesGraph data={pipelineData} />
        </div>
        <div>
          <PipelineSuccessRate history={history} />
        </div>
        <div>
          <PipelineFailRate history={history} />
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
