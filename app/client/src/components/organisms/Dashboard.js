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
  const historyData = status?.history || [];

  return (
    <div className="w-full p-5">
      <div className="w-full flex justify-start">
        <BackButton />
        <TextAtom properties={"font-semibold text-xl py-3 px-10 capitalize"}>
          <span className="text-gray-400">Pipelines</span>
        </TextAtom>
      </div>

      {/* --- NEW DESIGNED CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Card 1: Most Recent Failed - THE RED CARD (Solid, Intense, Alert Style) */}
        <div className="relative overflow-hidden rounded-2xl min-h-[200px] shadow-lg transform transition-transform hover:scale-[1.01]">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900"></div>
            {/* Decorative pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            </div>
            
            <div className="relative z-10 p-6 flex flex-col justify-between h-full text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <span className="font-bold text-red-100 tracking-wider uppercase text-sm">Most Recent Failure</span>
                </div>

                <div>
                    {loading ? (
                        <div className="h-8 bg-white/20 rounded animate-pulse w-2/3"></div>
                    ) : mostRecentFailed && mostRecentFailed.failedExecution ? (
                        <>
                            <h2 className="text-3xl font-extrabold truncate mb-2 drop-shadow-sm">{mostRecentFailed.pipeline}</h2>
                            <div className="flex items-center justify-between text-sm text-red-100 bg-red-800/30 p-2 rounded border border-red-500/30">
                                <span>Phase: {mostRecentFailed.failedExecution.phase}</span>
                                <span>{new Date(mostRecentFailed.failedExecution.timestamp || mostRecentFailed.failedExecution.time || mostRecentFailed.failedExecution.createdAt).toLocaleTimeString()}</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-xl font-medium opacity-90">No recent failures detected</div>
                    )}
                </div>
            </div>
        </div>

        {/* Card 2: Top Failed Pipelines - THE DARK CARD (Neon, Tech, Grid Style) */}
        <div className="relative overflow-hidden rounded-2xl min-h-[200px] shadow-lg bg-gray-950 border border-gray-800 group hover:border-red-500/50 transition-colors duration-500">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#ef4444 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
            {/* Glowing orb */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-600 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>

            <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-gray-400 tracking-wider uppercase text-sm group-hover:text-red-400 transition-colors">Statistical Analysis</span>
                    <div className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-500">All Time</div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-50 transition-colors">Top Failed Pipelines</h3>
                    
                    {loading ? (
                         <div className="h-8 bg-gray-800 rounded animate-pulse w-1/2"></div>
                    ) : topFailedPipeline ? (
                        <div className="flex items-end justify-between border-t border-gray-800 pt-4">
                             <div className="flex flex-col">
                                <span className="text-2xl font-bold text-white truncate max-w-[180px]">{topFailedPipeline.pipeline}</span>
                                <span className="text-xs text-gray-500">Target Pipeline</span>
                             </div>
                             <div className="text-right">
                                <span className="block text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-600 drop-shadow-sm">{topFailedPipeline.count}</span>
                                <span className="text-xs text-red-500 font-bold uppercase">Total Crashes</span>
                             </div>
                        </div>
                    ) : (
                        <div className="text-gray-500 font-medium">No data available</div>
                    )}
                </div>
            </div>
        </div>

      </div>
      {/* --- End Cards --- */}

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