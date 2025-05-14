import React, { useEffect, useRef } from "react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PipelineDurationChart = ({ history }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const durations = history?.map((entry) => {
      const start = new Date(entry.deployStartedAt);
      const end = new Date(entry.deployedAt);
      return {
        label: `#${entry.id + 1} - ${start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        duration: (end - start) / 1000, // duration in seconds
      };
    });

    console.log("Durations: ", durations);

    const data = {
      labels: durations?.map((d) => d.label),
      datasets: [
        {
          label: "Duration (sec)",
          data: durations?.map((d) => d.duration),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          barThickness: 40,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Pipeline Duration",
          color: "white",
          font: {
            size: 20,
            weight: "bold",
          },
          padding: {
            top: 10,
            bottom: 10,
          },
        },
        legend: {
          labels: {
            color: "white",
            font: {
              size: 16,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw} seconds`,
          },
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "white",
          bodyColor: "white",
        },
      },
      scales: {
        x: {
          ticks: {
            color: "white",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "white",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          title: {
            display: true,
            text: "Duration (seconds)",
            color: "white",
            font: {
              size: 14,
            },
          },
        },
      },
    };

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data,
      options,
    });
  }, [history]);

  return (
    <div
      className="bg-[#1e1e2f] rounded-xl p-4 shadow-md"
      style={{ height: "435px" }}
    >
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default PipelineDurationChart;
