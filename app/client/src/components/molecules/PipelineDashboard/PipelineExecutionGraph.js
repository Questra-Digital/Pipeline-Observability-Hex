import React, { useRef, useEffect } from "react";
import Chart from "chart.js/auto";

const PipelineExecutionsChart = ({ historyData }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!historyData || historyData.length === 0) return;

    const ctx = chartRef.current.getContext("2d");

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = historyData.map((item) => {
      const date = new Date(item.deployStartedAt);
      return `${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes()
      ).padStart(2, "0")}`;
    });

    const dataPoints = historyData.map(() => 1);

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Executions",
            data: dataPoints,
            backgroundColor: "rgba(59, 130, 246, 0.6)",
            borderRadius: 1,
            barThickness: 4,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "Pipeline executions",
            font: {
              size: 16,
              weight: "bold",
            },
            color: "#fff",
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: {
              color: "#fff",
              font: { size: 12 },
            },
          },
          y: {
            beginAtZero: true,
            suggestedMax: 1.2,
            ticks: {
              stepSize: 1,
              color: "#fff",
              font: { size: 12 },
            },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
        },
      },
    });
  }, [historyData]);

  return (
    <div
      className="bg-[#1e1e2f] rounded-xl p-4"
      style={{ height: "435px", width: "100%" }}
    >
      <canvas ref={chartRef} />
    </div>
  );
};

export default PipelineExecutionsChart;
