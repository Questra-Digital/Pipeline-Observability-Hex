import React from "react";

const PipelineSuccessRate = ({ history }) => {
  const calculateSuccessCount = () => {
    let successCount = 0;
    history?.forEach((data) => {
      const { deployment, service, pod, replicaSet } = data.summary;
      if (
        deployment === "Healthy" &&
        service === "Healthy" &&
        pod === "Healthy" &&
        replicaSet === "Healthy"
      ) {
        successCount++;
      }
    });
    return successCount;
  };

  const calculateFailureCount = () => {
    let failureCount = 0;
    history?.forEach((data) => {
      const { deployment, service, pod, replicaSet } = data.summary;
      if (
        deployment !== "Healthy" ||
        service !== "Healthy" ||
        pod !== "Healthy" ||
        replicaSet !== "Healthy"
      ) {
        failureCount++;
      }
    });
    return failureCount;
  };

  const failureCount = calculateFailureCount();
  const successCount = calculateSuccessCount();
  const total = successCount + failureCount;

  console.log("Success Count: ", successCount);
  console.log("Failure Count: ", failureCount);

  const successRate =
    total === 0 ? 0 : ((successCount / total) * 100).toFixed(2);

  return (
    <div style={styles.container}>
      <div style={styles.title}>Pipeline overall success rate</div>
      <div style={styles.percentage}>{successRate}%</div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#e53935",
    borderRadius: "8px",
    padding: "16px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "18px",
    fontWeight: "500",
    marginBottom: "10px",
  },
  percentage: {
    fontSize: "48px",
    fontWeight: "bold",
  },
};

export default PipelineSuccessRate;
