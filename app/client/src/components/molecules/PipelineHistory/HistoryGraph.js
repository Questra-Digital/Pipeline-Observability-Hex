import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

function PipelineChart({ history }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (history.length === 0) return;

    const labels = history.map((data) => new Date(data.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    const datasets = [
      {
        label: "Deployment",
        data: history.map((data) => data.summary.deployment === "Healthy" ? 1 : 0),
        backgroundColor: "rgba(75, 192, 192, 1)",
        borderWidth: 0,
      },
      {
        label: "Service",
        data: history.map((data) => data.summary.service === "Healthy" ? 1 : 0),
        backgroundColor: "rgba(255, 159, 64, 1)",
        borderWidth: 0,
      },
      {
        label: "Pod",
        data: history.map((data) => data.summary.pod === "Healthy" ? 1 : 0),
        backgroundColor: "rgba(153, 102, 255, 1)",
        borderWidth: 0,
      },
      {
        label: "ReplicaSet",
        data: history.map((data) => data.summary.replicaSet === "Healthy" ? 1 : 0),
        backgroundColor: "rgba(255, 99, 132, 1)",
        borderWidth: 0,
      },
    ];

    const ctx = chartRef.current.getContext("2d");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                const datasetLabel = context.dataset.label || '';
                const value = context.parsed.y === 1 ? 'Healthy' : 'Progressing';
                return datasetLabel + ': ' + value;
              }
            }
          },
        },
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            beginAtZero: true,
          },
        },
      },
    });
  }, [history]);

  return <canvas ref={chartRef} />;
}

export default PipelineChart;
