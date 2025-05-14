import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const PipelineDurationDistribution = ({ history }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    // const durations = executions.map(({ deployStartedAt, deployedAt }) => {
    //   const start = new Date(deployStartedAt);
    //   const end = new Date(deployedAt);
    //   return Math.floor((end - start) / 1000); // duration in seconds
    // });

    const durations = history?.map((entry) => {
      const start = new Date(entry.deployStartedAt);
      const end = new Date(entry.deployedAt);
      return Math.floor((end - start) / 1000); // duration in seconds
    });

    const buckets = {
      "0–10s": 0,
      "11–30s": 0,
      "31–60s": 0,
      "61–120s": 0,
      ">120s": 0,
    };

    durations?.forEach((duration) => {
      if (duration <= 10) buckets["0–10s"]++;
      else if (duration <= 30) buckets["11–30s"]++;
      else if (duration <= 60) buckets["31–60s"]++;
      else if (duration <= 120) buckets["61–120s"]++;
      else buckets[">120s"]++;
    });

    const data = {
      labels: Object.keys(buckets),
      datasets: [
        {
          label: "Executions",
          data: Object.values(buckets),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };

    const config = {
      type: "bar",
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Pipeline Duration Distribution",
            color: "white",
            font: { size: 18 },
          },
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            ticks: { color: "white" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "white", stepSize: 1 },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    };

    // Cleanup old chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(chartRef.current, config);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [history]);

  return (
    <div
      style={{
        height: "432px",
        backgroundColor: "#1e1e2f",
        padding: "1rem",
        borderRadius: "12px",
      }}
    >
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default PipelineDurationDistribution;
