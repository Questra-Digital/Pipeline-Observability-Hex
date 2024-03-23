import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import 'chartjs-adapter-date-fns'; // Import the Chart.js adapter for date-fns
import { graphConfigs } from "@/constants/graphConfigurations";

const TimeSeriesGraph = ({ data }) => {
  console.log("data in graph : ", data);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      // Handle the case where data is null, undefined, or empty
      return;
    }

    console.log(data);
    let slicedData = data.slice(-20); // Keep only the last 20 records

    const keys = ["Pod", "Service", "Deployment", "ReplicaSet"];
    const colors = ["#FF1436", "#EADE00", "#726FAF", "#81000B"];

    const datasets = keys.map((key, index) => {
      const dataPoints = slicedData.map((item) => {
        return {
          x: new Date(item.timestamp),
          y: key === "Healthy" ? 1 : 0,
        };
      });
      return {
        label: key,
        backgroundColor: colors[index],
        borderColor: colors[index],
        data: dataPoints,
      };
    });

    if (chartRef.current) {
      // Update existing chart
      chartRef.current.data.datasets = datasets;
      chartRef.current.update();
    } else {
      // Create new chart
      const config = {
        ...graphConfigs,
        type: "scatter",
        data: {
          datasets: datasets,
        },
        options: {
          ...graphConfigs.options,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'second', // Display time in seconds, adjust as needed
                displayFormats: {
                  second: 'HH:mm:ss' // Format for displaying time
                }
              },
              ticks: {
                color: "white",
              },
              grid: {
                color: "rgba(255, 255, 255, 0.1)",
              },
            },
            y: {
              ticks: {
                color: "white",
              },
              grid: {
                color: "rgba(255, 255, 255, 0.1)",
              },
            },
          },
        },
      };
      
      const ctx = document.getElementById("scatter-chart").getContext("2d");
      chartRef.current = new Chart(ctx, config);
    }
  }, [data]);

  return (
    <div className="flex flex-col w-[100%] border border-gray-700 hover:shadow-3xl rounded-xl bg-gray-900 p-4">
      <div className="relative h-[400px]">
        <canvas id="scatter-chart"></canvas>
      </div>
    </div>
  );
};

export default TimeSeriesGraph;
