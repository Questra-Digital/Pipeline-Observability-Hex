export const graphConfigs = {
    type: "line",
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