import React from "react";

const PipelineFailRate = ({ history }) => {
  // --- BACKEND LOGIC (EXACTLY THE SAME) ---
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
    total === 0 ? 0 : ((failureCount / total) * 100).toFixed(2);
  // ----------------------------------------

  return (
    // OUTER CONTAINER (Height/Width preserved)
    <div className="group relative h-full w-full">
      
      {/* 1. OUTER GLOW (Pulsing Red) */}
      <div className="absolute -inset-0.5 bg-red-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>

      {/* 2. MAIN CARD SURFACE */}
      <div className="relative h-full w-full rounded-xl border border-red-500/30 overflow-hidden flex flex-col justify-center items-center shadow-2xl">
        
        {/* --- UNIQUE BACKGROUND LAYERS --- */}
        
        {/* Layer A: Base Dark Background */}
        <div className="absolute inset-0 bg-[#050505]"></div>

        {/* Layer B: The "Red Alert" Spotlight (Center Glow) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-[#050505] to-[#050505]"></div>

        {/* Layer C: Hazard Stripe Texture (Subtle diagonal lines) */}
        <div className="absolute inset-0 opacity-[0.07]" 
             style={{ 
               backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ff0000 10px, #ff0000 11px)' 
             }}>
        </div>
        
        {/* Layer D: Vignette (Darkens the corners) */}
        <div className="absolute inset-0 bg-[radial-gradient(transparent_0%,_#000000_100%)]"></div>

        {/* -------------------------------- */}

        {/* --- CONTENT (Z-Index ensures it sits above background) --- */}
        
        {/* Icon */}
        <div className="relative z-10 mb-3 p-3 rounded-full bg-gradient-to-br from-red-500/20 to-black border border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
        </div>

        {/* Number */}
        <div className="relative z-10 text-center">
            <span className="block text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-red-200 to-red-500 drop-shadow-[0_2px_10px_rgba(220,38,38,0.5)]">
                {successRate}%
            </span>
        </div>

        {/* Title / Footer */}
        <div className="relative z-10 mt-2 text-center">
             <span className="text-red-400 text-[10px] font-bold uppercase tracking-[0.25em] border-b border-red-500/30 pb-1">
                Failure Rate
            </span>
        </div>

      </div>
    </div>
  );
};

export default PipelineFailRate;