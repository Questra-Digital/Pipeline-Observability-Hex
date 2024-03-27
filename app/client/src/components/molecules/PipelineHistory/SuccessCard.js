// SuccessCard.js
import React from "react";

function SuccessCard({ history }) {
  const calculateSuccessCount = () => {
    let successCount = 0;
    history?.forEach((data) => {
      const { deployment, service, pod, replicaSet } = data.summary;
      if (deployment === "Healthy" && service === "Healthy" && pod === "Healthy" && replicaSet === "Healthy") {
        successCount++;
      }
    });
    return successCount;
  };

  const successCount = calculateSuccessCount();

  return (
    <div className="w-[200px] h-[180px] rounded-lg bg-green-700 shadow-md shadow-white hover:scale-105 duration-200 ease-linear flex flex-col items-center p-4">
      <h2 className="text-2xl font-semibold">Total Success</h2>
      <p className="text-[70px] ">{successCount}</p>
    </div>
  );
}

export default SuccessCard;
