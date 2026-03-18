"use client";
import { allApps } from "@/constants/integrations";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import BackButton from "@/components/atoms/BackButton";

const ConfigureApp = () => {
  const searchParams = useSearchParams();
  const [appName, setAppName] = useState("");

  useEffect(() => {
    setAppName(searchParams.get("app"));
  }, [appName]);

  return (
    <div className="w-full min-h-screen bg-[#050505] flex flex-col items-center p-8 space-y-12">
      <div className="w-full max-w-4xl">
        <BackButton />
      </div>
      <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center">
        {allApps.map((appObject) => {
          if (appObject.name === appName) {
            const Component = appObject.component;
            if (Component != null) {
              return (
                <div key={appObject.name} className="w-full bg-[#0a0a0a] border border-red-900/20 rounded-3xl p-10 shadow-2xl shadow-red-900/5 animate-in fade-in zoom-in-95 duration-500">
                  <Component />
                </div>
              );
            } else {
              return (
                <div key={appObject.name} className="flex flex-col items-center gap-6 p-20 bg-[#0a0a0a] border border-dashed border-red-900/30 rounded-3xl">
                  <div className="w-20 h-20 rounded-full bg-red-950/20 border border-red-600/20 flex items-center justify-center animate-pulse">
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Integrating Apps Shortly</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">The neural link for {appName} is being established. Deployment imminent.</p>
                  </div>
                </div>
              );
            }
          }
        })}
      </div>
    </div>
  );
};

export default ConfigureApp;
