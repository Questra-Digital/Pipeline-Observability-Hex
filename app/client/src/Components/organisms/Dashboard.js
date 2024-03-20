"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CardContainer from "@/Components/molecules/PipelineDashboard/CardContainer";
import TimeSeriesGraph from "@/Components/molecules/PipelineDashboard/TimeSeriesGraph";
import TextAtom from "../atoms/TextAtom";

function Dashboard() {
  const searchParams = useSearchParams();
  const [pipelineData, setPipelineData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [pipelineName, setPipelineName] = useState("");

  useEffect(() => {
    setPipelineName(searchParams.get("pipeline"));
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
      console.log(receivedData);

      const updatedData = {
        ...receivedData,
        timestamp: new Date().toISOString(),
      };

      // Update pipelineData in increasing order
      setPipelineData((prevData) => [...prevData, updatedData]);
      setCurrentData(receivedData);
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
      <TextAtom properties={"font-semibold text-xl my-5"} text={"Dashboard | "}>
        <span className="text-gray-400">{pipelineName}</span>
      </TextAtom>
      <CardContainer data={currentData} />
      <div className="flex justify-center items-center mt-4">
        <div className="md:w-[70vw]">
          <TimeSeriesGraph data={pipelineData} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
