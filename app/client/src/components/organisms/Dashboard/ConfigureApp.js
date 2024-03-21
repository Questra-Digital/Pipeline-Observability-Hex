"use client";
import { allApps } from "@/constants/integrations";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import LinkAtom from "@/components/atoms/LinkAtom";
import ImageAtom from "@/components/atoms/ImageAtom";

const ConfigureApp = () => {
  const searchParams = useSearchParams();
  const [appName, setAppName] = useState("");

  useEffect(() => {
    setAppName(searchParams.get("app"));
  }, [appName]);

  return (
    <div className="w-full h-full flex flex-col items-center p-2">
      <div className="mt-5 px-5 w-fit self-start">
        <LinkAtom link={"/integrations"} properties="w-fit">
          <ImageAtom
            src="/assets/Images/back.png"
            width={30}
            height={20}
            alt={"back button"}
          />
        </LinkAtom>
      </div>
      {allApps.map((appObject) => {
        if (appObject.name === appName) {
          const Component = appObject.component;
          if (Component != null) {
            return <Component key={appObject.name} />;
          } else {
            return <p className="text-xl font-semibold text-red-600 animate-pulse">We are Integrating Apps Shortly</p>;
          }
        }
      })}
    </div>
  );
};

export default ConfigureApp;
