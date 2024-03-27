// FailureCard.js
import React from "react";

function FailureCard({ history }) {
  const calculateFailureCount = () => {
    let failureCount = 0;
    history.forEach((data) => {
      const { deployment, service, pod, replicaSet } = data.summary;
      if (deployment !== "Healthy" || service !== "Healthy" || pod !== "Healthy" || replicaSet !== "Healthy") {
        failureCount++;
      }
    });
    return failureCount;
  };

  const failureCount = calculateFailureCount();

  return (
    <div className="w-[200px] h-[180px] rounded-lg bg-red-700 shadow-md shadow-white hover:scale-105 duration-200 ease-linear flex flex-col items-center p-4">
      <h2 className="text-2xl font-semibold">Total Failures</h2>
      <p className="text-[70px] ">{failureCount}</p>
    </div>
  );
}

export default FailureCard;
