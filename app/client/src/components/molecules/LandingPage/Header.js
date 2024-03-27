"use client";
import TitleAtom from "@/components/atoms/TitleAtom";
import ImageAtom from "../../atoms/ImageAtom";
import RoundBtnAtom from "../../atoms/RoundBtnAtom";
import { useEffect, useState } from "react";
import { strapiInstance } from "@/axios/axios";
import LinkAtom from "@/components/atoms/LinkAtom";

function Header() {
  const [logoSource, setLogoSource] = useState("");
  const [title, setTitle] = useState("");
  useEffect(() => {
    async function fetchAppData() {
      try {
        const response = await strapiInstance.get(
          "/api/global-item?populate=*",
          {}
        );

        setLogoSource(
          "http:127.0.0.1:1337" +
            response.data.data.attributes.logo.data.attributes.url
        );
        console.log(response);
        setTitle(response.data.data.attributes.title);
      } catch (error) {
        console.error("Error fetching data ", error.message);
      }
    }
    fetchAppData();
  }, []);

  return (
    <>
      <div className="flex justify-center sm:justify-between flex-wrap items-center w-full px-5 my-5 z-10">
        <div>
          <ImageAtom
            src={logoSource}
            width={60}
            height={60}
            alt={"Logo"}
            properties={["mx-2", "md:mx-0, self-center"]}
          />
          <TitleAtom text={title} />
        </div>
        <div className=" my-2 md:my-0 mx-2 md:mx-0 flex justify-center md:justify-end">
          <LinkAtom link={"/login"}>
            <RoundBtnAtom
              text={"Login"}
              properties={[
                "bg-blue-700",
                "shadow-md",
                "hover:bg-blue-800",
                "hover:border-gray-400",
              ]}
            />
          </LinkAtom>
          <LinkAtom link={"/login"}>
            <RoundBtnAtom
              text={"Sign Up"}
              properties={[
                "underline",
                "underline-offset-8",
                "hover:text-blue-400",
              ]}
            />
          </LinkAtom>
        </div>
      </div>
    </>
  );
}

export default Header;
