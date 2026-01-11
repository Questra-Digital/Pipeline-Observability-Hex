import React from "react";

// Helper function to pick a color theme based on the Title
const getTheme = (title = "") => {
  const t = title.toLowerCase();
  
  if (t.includes("pod") || t.includes("workflow")) {
    return {
      name: "pink",
      gradient: "from-pink-500 via-rose-500 to-yellow-500",
      shadow: "shadow-pink-500/20",
      border: "border-pink-500/50",
      bg: "bg-pink-500/10",
      text: "text-pink-400"
    };
  } else if (t.includes("service") || t.includes("pipeline")) {
    return {
      name: "purple",
      gradient: "from-violet-600 via-purple-500 to-indigo-400",
      shadow: "shadow-violet-500/20",
      border: "border-violet-500/50",
      bg: "bg-violet-500/10",
      text: "text-violet-400"
    };
  } else if (t.includes("deploy") || t.includes("error")) {
    return {
      name: "orange",
      gradient: "from-orange-500 via-amber-500 to-yellow-400",
      shadow: "shadow-orange-500/20",
      border: "border-orange-500/50",
      bg: "bg-orange-500/10",
      text: "text-orange-400"
    };
  } else {
    // Default (Blue/Cyan) for ReplicaSet or others
    return {
      name: "cyan",
      gradient: "from-cyan-400 via-blue-500 to-teal-400",
      shadow: "shadow-cyan-500/20",
      border: "border-cyan-500/50",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400"
    };
  }
};

function Card({ title, number, badgeText, subtitle }) {
  // Get the specific color theme for this card
  const theme = getTheme(title);

  return (
    <div className={`group relative w-full md:w-[280px] lg:w-[300px] transition-all duration-500 hover:-translate-y-2`}>
      
      {/* 1. VIBRANT GLOW (Behind the card) */}
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${theme.gradient} opacity-30 blur-md group-hover:opacity-75 transition duration-500`}></div>
      
      {/* 2. CARD SURFACE */}
      <div className="relative h-full bg-[#121212] rounded-xl p-6 overflow-hidden border border-white/10 flex flex-col justify-between z-10">
        
        {/* Decorative Top Line */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.gradient}`}></div>

        {/* --- HEADER --- */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">
              {title}
            </h3>
            {/* The Badge is now colored specifically for this card */}
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${theme.bg} ${theme.text} border ${theme.border} bg-opacity-20`}>
              {badgeText}
            </span>
          </div>
          
          {/* Icon with dynamic color */}
          <div className={`p-2 rounded-lg bg-[#1a1a1a] border border-white/5 ${theme.text}`}>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm14.25 6a.75.75 0 01-.22.53l-2.25 2.25a.75.75 0 11-1.06-1.06L15.44 12l-1.72-1.72a.75.75 0 111.06-1.06l2.25 2.25c.141.14.22.331.22.53zm-10.28-.53a.75.75 0 000 1.06l2.25 2.25a.75.75 0 101.06-1.06L8.56 12l1.72-1.72a.75.75 0 10-1.06-1.06l-2.25 2.25z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* --- BODY (Gradient Text) --- */}
        <div className="mb-4">
          <span className={`font-black text-5xl text-transparent bg-clip-text bg-gradient-to-br ${theme.gradient} drop-shadow-sm`}>
            {number}
          </span>
        </div>

        {/* --- FOOTER --- */}
        <div className="flex items-center gap-2 border-t border-white/5 pt-3">
          {/* Pulsing Dot */}
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.bg.replace('/10', '')}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.bg.replace('/10', '')} bg-current`}></span>
          </span>
          <p className="text-gray-500 text-xs font-medium">
            {subtitle}
          </p>
        </div>

      </div>
    </div>
  );
}

export default Card;