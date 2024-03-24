"use client";
import React from "react";
import AppCard from "@/components/molecules/Integrations/AppCard";
import AppContainer from "@/components/molecules/Integrations/AppContainer";
import { allApps } from "@/constants/integrations";
import { useSelector } from "react-redux";
import { useConfiguredApps } from "@/hooks/useConfiguredApps";

const Integrations = () => {
  const apps = useSelector((state) => state.apps.apps);

  useConfiguredApps();

  // Function to check if an app is configured
  const isConfigured = (appName) => {
    return apps.some((app) => app.name === appName && app.status === true);
  };

  return (
    <div className="w-full flex justify-start p-5 flex-col gap-10">
      <div>
        <p className="text-xl font-semibold mb-3">Configured Apps</p>
        <AppContainer>
          {allApps.map((app, index) => (
            <React.Fragment key={index}>
              {isConfigured(app.name) && (
                <AppCard
                  imageURL={app.image}
                  alt={app.alt}
                  name={app.name}
                  url={``}
                  status={true}
                />
              )}
            </React.Fragment>
          ))}
        </AppContainer>
      </div>
      <div>
        <p className="text-xl font-semibold mb-3">Available Apps</p>
        <AppContainer>
          {allApps.map((app, index) => (
            <React.Fragment key={index}>
              {!isConfigured(app.name) && (
                <AppCard
                  imageURL={app.image}
                  alt={app.alt}
                  name={app.name}
                  url={`/integrations/app?app=${encodeURIComponent(app.name)}`}
                  status={false}
                />
              )}
            </React.Fragment>
          ))}
        </AppContainer>
      </div>
    </div>
  );
};

export default Integrations;
