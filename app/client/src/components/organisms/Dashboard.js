"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CardContainer from "@/components/molecules/PipelineDashboard/CardContainer";
import TimeSeriesGraph from "@/components/molecules/PipelineDashboard/TimeSeriesGraph";
import TextAtom from "../atoms/TextAtom";
import BackButton from "../atoms/BackButton";

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
    <div className="w-full flex justify-start">
    <BackButton />
      <TextAtom properties={"font-semibold text-xl py-3 px-10 capitalize"}>
        <span className="text-gray-400">{pipelineName}</span>
      </TextAtom>

    </div>
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
