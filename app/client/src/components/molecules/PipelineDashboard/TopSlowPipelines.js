import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const TopSlowPipelines = ({ executions, topN = 5 }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    // Calculate durations and sort descending
    const sortedExecutions = executions
      ?.map((exec) => {
        const start = new Date(exec.deployStartedAt);
        const end = new Date(exec.deployedAt);
        return {
          revision: exec.id + 1,
          duration: Math.floor((end - start) / 1000),
        };
      })
      .sort((a, b) => b.duration - a.duration)
      .slice(0, topN);

    const data = {
      labels: sortedExecutions?.map((e) => e.revision),
      datasets: [
        {
          label: "Duration (s)",
          data: sortedExecutions?.map((e) => e.duration),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    };

    const config = {
      type: "bar",
      data,
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Top ${topN} Slow Pipeline Executions`,
            color: "white",
            font: { size: 18 },
          },
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: "white" },
            grid: { color: "rgba(255,255,255,0.1)" },
            title: {
              display: true,
              text: "Duration (s)",
              color: "white",
              font: { size: 14 },
            },
          },
          y: {
            ticks: { color: "white" },
            grid: { color: "rgba(255,255,255,0.1)" },
            title: {
              display: true,
              text: "Execution Number",
              color: "white",
              font: {
                size: 14,
              },
            },
          },
        },
      },
    };

    if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    chartInstanceRef.current = new Chart(chartRef.current, config);

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [executions, topN]);

  return (
    <div
      className="bg-gray-900 border border-gray-700"
      style={{
        height: "435px",
        padding: "1rem",
        borderRadius: "12px",
      }}
    >
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default TopSlowPipelines;
