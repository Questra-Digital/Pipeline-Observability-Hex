import React from "react";

const PipelineSuccessRate = ({ history }) => {
  // --- BACKEND LOGIC (UNCHANGED) ---
  const calculateSuccessCount = () => {
    let successCount = 0;
    history?.forEach((data) => {
      if (!data.summary) return;
      const { deployment, service, pod, replicaSet } = data.summary;
      if (
        deployment?.toLowerCase() === "healthy" &&
        service?.toLowerCase() === "healthy" &&
        pod?.toLowerCase() === "healthy" &&
        replicaSet?.toLowerCase() === "healthy"
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
  // ----------------------------------------

  return (
    // OUTER CONTAINER (Height/Width preserved)
    <div className="group relative h-full w-full">

      {/* 1. OUTER GLOW (Steady Green Pulse) */}
      <div className="absolute -inset-0.5 bg-emerald-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

      {/* 2. MAIN CARD SURFACE */}
      <div className="relative h-full w-full rounded-xl border border-emerald-500/30 overflow-hidden flex flex-col justify-center items-center shadow-2xl">

        {/* --- UNIQUE BACKGROUND LAYERS --- */}

        {/* Layer A: Base Dark Background */}
        <div className="absolute inset-0 bg-[#020a05]"></div>

        {/* Layer B: The "Stable Core" Spotlight (Center Glow) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-[#050505] to-[#050505]"></div>

        {/* Layer C: Digital Matrix Texture (Stable dot grid) */}
        <div className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(#10b981 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px'
          }}>
        </div>

        {/* Layer D: Vignette (Darkens the corners) */}
        <div className="absolute inset-0 bg-[radial-gradient(transparent_30%,_#000000_100%)]"></div>

        {/* -------------------------------- */}

        {/* --- CONTENT --- */}

        {/* Icon (Shield/Check) */}
        <div className="relative z-10 mb-3 p-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-black border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Number */}
        <div className="relative z-10 text-center">
          <span className="block text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-200 to-emerald-600 drop-shadow-[0_2px_10px_rgba(16,185,129,0.5)]">
            {successRate}%
          </span>
        </div>

        {/* Title / Footer */}
        <div className="relative z-10 mt-2 text-center">
          <span className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-[0.25em] border-b border-emerald-500/30 pb-1">
            Success Rate
          </span>
        </div>

      </div>
    </div>
  );
};

export default PipelineSuccessRate;