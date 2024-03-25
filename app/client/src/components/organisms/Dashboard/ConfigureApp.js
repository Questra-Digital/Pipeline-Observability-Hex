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
    <div className="w-full h-full flex flex-col items-center p-2">
      <BackButton />
      {allApps.map((appObject) => {
        if (appObject.name === appName) {
          const Component = appObject.component;
          if (Component != null) {
            return <Component key={appObject.name} />;
          } else {
            return (
              <p className="text-xl font-semibold text-red-600 animate-pulse">
                We are Integrating Apps Shortly
              </p>
            );
          }
        }
      })}
    </div>
  );
};

export default ConfigureApp;
