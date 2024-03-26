import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { graphConfigs } from "@/constants/graphConfigurations";

const TimeSeriesGraph = ({ data }) => {
  console.log("data in graph : ", data);
  const chartRef = useRef(null); // Using useRef to hold the chart instance

  useEffect(() => {
    if (!data || data.length === 0) {
      return;
    }

    let slicedData = data.slice(-20);

    const labels = slicedData.map((item) => {
      const timestamp = new Date(item.timestamp);
      return timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    });

    const keys = ["Pod", "Service", "Deployment", "ReplicaSet"];

    const valueMap = {};
    const uniqueValues = Array.from(new Set(slicedData.flatMap((item) => keys.map((key) => item[key]))));
    uniqueValues.forEach((value, index) => {
      valueMap[value] = index + 1;
    });

    const reverseValueMap = Object.fromEntries(Object.entries(valueMap).map(([key, value]) => [value, key]));

    const colors = ["#FF1436", "#EADE00", "#726FAF", "#81000B"];

    const datasets = keys.map((key, index) => {
      const dataPoints = slicedData.map((item) => valueMap[item[key]]);
      return {
        label: key,
        backgroundColor: "transparent",
        borderColor: colors[index],
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: colors[index],
        pointBorderColor: "transparent",
        data: dataPoints,
        fill: false,
      };
    });

    const config = {
      ...graphConfigs,
      data: {
        labels: labels,
        datasets: datasets,
      },
    };

    if (chartRef.current) {
      chartRef.current.data = config.data; // Update data
      chartRef.current.update(); // Re-render chart
    } else {
      const canvas = document.getElementById("line-chart");
      const ctx = canvas.getContext("2d");
      chartRef.current = new Chart(ctx, config); // Create chart instance
    }
  }, [data]); // Dependency array

  return (
    <div className="flex flex-col w-[100%] border border-gray-700 hover:shadow-3xl rounded-xl bg-gray-900 p-4">
      <div className="relative h-[400px]">
        <canvas id="line-chart"></canvas>
      </div>
    </div>
  );
};

export default TimeSeriesGraph;