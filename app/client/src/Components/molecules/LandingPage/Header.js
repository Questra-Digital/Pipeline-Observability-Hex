"use client";
import TitleAtom from "@/Components/atoms/TitleAtom";
import ImageAtom from "../../atoms/ImageAtom";
import RoundBtnAtom from "../../atoms/RoundBtnAtom";
import { useEffect, useState } from "react";
import { strapiInstance } from "@/axios/axios";

function Header() {
  const [logoSource, setLogoSource] = useState("");
  useEffect(() => {
    async function fetchPipelineData() {
      try {
        const response = await strapiInstance.get(
          "/api/global-item?populate=*",
          {}
        );

        setLogoSource("http:127.0.0.1:1337"+response.data.data.attributes.logo.data.attributes.url);
        console.log(response);
      } catch (error) {
        console.error("Error fetching data ", error.message);
      }
    }
    fetchPipelineData();
  }, []);

  return (
    <>
      <div className="flex justify-center sm:justify-between flex-wrap items-center w-full px-5 my-5 z-10">
        <ImageAtom
          src={logoSource}
          width={70}
          height={70}
          alt={"Logo"}
          properties={["mx-2", "md:mx-0"]}
        />
        <TitleAtom text={"Datalogs-Pipeline-Observer"} />
        <div className=" my-2 md:my-0 mx-2 md:mx-0 flex justify-center md:justify-end">
          <RoundBtnAtom
            text={"Login"}
            properties={[
              "bg-blue-700",
              "shadow-md",
              "hover:bg-blue-800",
              "hover:border-gray-400",
            ]}
          />
          <RoundBtnAtom
            text={"Sign Up"}
            properties={[
              "underline",
              "underline-offset-8",
              "hover:text-blue-400",
            ]}
          />
        </div>
      </div>
    </>
  );
}

export default Header;
