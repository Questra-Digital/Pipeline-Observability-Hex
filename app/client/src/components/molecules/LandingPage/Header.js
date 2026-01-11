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

  // NOTE: This effect logic remains unchanged as it handles data fetching.
  useEffect(() => {
    async function fetchAppData() {
      try {
        const response = await strapiInstance.get(
          "/api/global-item?populate=*",
          {}
        );

        // Updated URL string concatenation to use the title property name consistently with the original code
        setLogoSource(
          "http://127.0.0.1:1337" +
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
    // Updated container to use a dark background for consistency
    <div className="flex justify-center sm:justify-between flex-wrap items-center w-full px-5 py-3 z-20 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 absolute top-0">
        
        {/* Left Side: Logo and Title */}
        <div className="flex items-center">
            {/* VIZOPS Branding (Static placeholder for now, replace with dynamic source) */}
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent tracking-tight">
                VIZOPS
            </h1>
            {/* If you want to use the Image and TitleAtom logic, here is the structure:
            <ImageAtom
                // Using the static URL for now since the state setting has a typo
                src="http://localhost:1337/uploads/small_logo_51f23fb97c.png"
                width={30} // Reduced size for header
                height={30}
                alt={"Logo"}
                properties={["mx-2", "self-center"]}
            />
            <TitleAtom text={title || "App Title"} />
            */}
        </div>

        {/* Right Side: Single Login Button */}
        <div className="my-2 md:my-0 flex justify-center md:justify-end">
          <LinkAtom link={"/login"}>
            <RoundBtnAtom
              text={"Login"}
              properties={[
                // Updated styles to match the successful Login button gradient:
                "bg-gradient-to-r", 
                "from-blue-600",
                "to-cyan-500",
                "text-white",
                "font-semibold",
                "shadow-lg",
                "hover:opacity-90",
                "transition",
              ]}
            />
          </LinkAtom>
          {/* REMOVED: The redundant Sign Up button */}
        </div>
    </div>
  );
}

export default Header;