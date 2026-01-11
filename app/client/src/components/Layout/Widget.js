"use client";

import React, { useState, useEffect } from "react";
import ImageAtom from "@/components/atoms/ImageAtom";

const Widget = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });

  const dayOfWeek = currentTime.toLocaleDateString("en-US", { weekday: "long" });
  const restOfDate = currentTime.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] overflow-hidden relative shadow-md">
      {/* Noise Effect */}
      <div className="absolute inset-0 opacity-55 pointer-events-none">
        <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuNSIvPjwvc3ZnPg==')] animate-pulse"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 flex flex-col space-y-6">
        
        {/* Date */}
        <div className="flex justify-between items-center text-xs uppercase tracking-wider">
          <span className="text-[#a0a0a0]">{dayOfWeek}</span>
          <span className="text-[#c0c0c0]">{restOfDate}</span>
        </div>

{/* Time */}
<div className="text-center">
  <div className="text-5xl font-bold text-white tracking-tight">
    {formatTime(currentTime)}
  </div>
</div>

{/* Timezone Right Aligned - No Box */}
<div className="flex justify-end">
  <span className="text-[#c0c0c0] text-xs uppercase tracking-wider">
    {timezone}
  </span>
</div>


        {/* Blueprint BG */}
        <div className="absolute inset-0 -z-[1]">
          <ImageAtom
            src="http://127.0.0.1:1337/uploads/pc_blueprint_c7b5cafbe8.gif"
            width={250}
            height={250}
            alt="Blueprint"
            properties={["w-full h-full object-contain"]}
          />
        </div>
      </div>
    </div>
  );
};

export default Widget;
