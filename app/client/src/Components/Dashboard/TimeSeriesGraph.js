import React, { useEffect } from "react";
import Chart from "chart.js/auto";

const TimeSeriesGraph = ({ data }) => {
  console.log('data in graph : ',data);
  useEffect(() => {
    if (!data || data.length === 0) {
      // Handle the case where data is null, undefined, or empty
      return;
    }

    let slicedData = data.slice(-20); // Keep only the last 20 records

    const labels = slicedData.map((item) => {
      const timestamp = new Date(item.timestamp);
      return timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    });


    const keys = ["Pod", "Service", "Deployment", "ReplicaSet"];

    const valueMap = {};
    const reverseValueMap = {};
    const uniqueValues = Array.from(
      new Set(slicedData.flatMap((item) => keys.map((key) => item[key])))
    );
    uniqueValues.forEach((value, index) => {
      valueMap[value] = index + 1;
      reverseValueMap[index + 1] = value;
    });

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
      type: "line",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Pipeline Status Over Time",
            font: {
              size: 20,
              weight: "bold",
              lineHeight: 1.2,
            },
            padding: {
              top: 10,
              bottom: 10,
            },
            color: "white",
            margin: {
              bottom: 50,
            },
          },
        },
        legend: {
          display: true,
          labels: {
            color: "white",
            font: {
              size: 18,
            },
          },
          align: "end",
          position: "bottom",
          margin: {
            top: 20,
          },
          onClick: () => {},
          onHover: () => {},
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
            ticks: {
              color: "white",
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const datasetIndex = tooltipItem.datasetIndex;
              const value = data.datasets[datasetIndex].data[tooltipItem.index];
              const originalValue = reverseValueMap[value];
              return `${data.datasets[datasetIndex].label}: ${originalValue}`;
            },
          },
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          bodyColor: "white",
          titleColor: "white",
          titleFont: {
            size: 22,
            weight: "bold",
          },
          bodyFont: {
            size: 16,
          },
          padding: 16,
          cornerRadius: 5,
          displayColors: false,
        },
      },
    };

    const canvas = document.getElementById("line-chart");
    const ctx = canvas.getContext("2d");

    if (window.myLine) {
      window.myLine.destroy();
    }

    window.myLine = new Chart(ctx, config);
  }, [data]);

  return (
    <div className="flex flex-col w-[100%] border border-gray-700 hover:shadow-3xl rounded-xl bg-gray-900 p-4">
      <div className="relative h-[400px]">
        <canvas id="line-chart"></canvas>
      </div>
    </div>
  );
};

export default TimeSeriesGraph;
