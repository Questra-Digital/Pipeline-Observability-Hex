"use client";
import { lazy, useState, useEffect } from "react";
import ImageAtom from "@/components/atoms/ImageAtom";
import LinkAtom from "@/components/atoms/LinkAtom";
import TextAtom from "@/components/atoms/TextAtom";
import { strapiInstance } from "@/axios/axios";

// Lazy loading components
const ParticlesBg = lazy(() =>
  import("@/components/atoms/Particles/ParticlesBg")
);
const Typewriter = lazy(() =>
  import("@/components/atoms/Typography/Typerwriter")
);

export default function MainSection() {
  const [showParticlesBg, setShowParticlesBg] = useState(false);
  const [showTypewriter, setShowTypewriter] = useState(false);
  // Initial state for heroImage is set to an empty string
  const [heroImage, setHeroImage] = useState("");

  useEffect(() => {
    async function fetchAppData() {
      try {
        const response = await strapiInstance.get(
          "/api/global-item?populate=*",
          {}
        );
        
        // --- IMAGE PATH FIX: Corrected protocol typo from 'http:' to 'http://' ---
        const imageUrl = 
          "http://127.0.0.1:1337" +
          response.data.data.attributes.heroImage.data.attributes.url;

        setHeroImage(imageUrl);
      } catch (error) {
        console.error("Error fetching data ", error.message);
        // Fallback static image path in case of API failure
        setHeroImage("/assets/Images/hero_fallback.png"); 
      }
    }
    fetchAppData();
  }, []);

  useEffect(() => {
    // Increased the delay for a smoother staggered entrance
    setTimeout(() => setShowTypewriter(true), 500);
    setTimeout(() => setShowParticlesBg(true), 1500); 
  }, []);

  return (
    // Outer Wrapper with minimum height to fill the screen
    <div className="relative min-h-screen pt-20 md:pt-0 flex items-center justify-center overflow-hidden">
      
      {/* 1. Background Particles Container */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-gray-950">
        {showParticlesBg && <ParticlesBg />}
      </div>
      
      {/* 2. Main Content Wrapper: Uses a responsive grid for better control */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between p-4 md:p-8">
        
        {/* Left Section: Text Content (Wider on MD screens) */}
        <section className="w-full md:w-[60%] lg:w-[55%] flex flex-col text-center md:text-left py-10">
          <TextAtom
            // Updated font styling for better impact and consistent coloring
            properties="text-4xl md:text-6xl font-extrabold font-Ubuntu mt-8 mb-6 leading-tight text-white"
          >
            Gain <span className="bg-gradient-to-r from-green-400 to-blue-300 bg-clip-text text-transparent">Holistic Insights</span>, <br className="hidden md:inline" /> Make{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-300 bg-clip-text text-transparent">Informed Decisions</span>
          </TextAtom>
          
          {/* Typewriter text area */}
          <div className="min-h-[90px] text-lg md:text-xl text-gray-300">
            {showTypewriter && <Typewriter />}
          </div>
          
          {/* CTA Button */}
          <LinkAtom
            link="/home"
            prefetch={true}
            text={"Get Started"}
            // Consistent gradient and button styling (centered on mobile, left on MD+)
            properties={
              "bg-gradient-to-r from-blue-600 to-cyan-500 hover:to-blue-600 to-90% col px-8 py-3 w-fit rounded-full shadow-lg flex text-xl font-semibold transition-all duration-300 mt-10 self-center md:self-auto"
            }
          >
            <ImageAtom
              src="/assets/Images/enter.png"
              alt="Enter Image"
              width={30}
              height={20}
              properties={["ml-3", "animate-pulse"]} // Changed to pulse for modern feel
              loading="lazy"
            />
          </LinkAtom>
        </section>
        
        {/* Right Section: Hero Image (Slightly narrower on MD screens) */}
        <section className="w-full md:w-[40%] lg:w-[45%] flex items-center justify-center mt-10 md:mt-0">
          {heroImage ? (
            <ImageAtom
              // Using the dynamically fetched image state
              src="http://127.0.0.1:1337/uploads/thumbnail_hero_35ea658625_ed337cda79.png"
              alt="Vizops Hero Graphic"
              height={550}
              width={500}
              priority
              quality={100}
            />
          ) : (
            // Placeholder/loading state
            <div className="w-[500px] h-[550px] bg-gray-800/50 rounded-lg animate-pulse flex items-center justify-center text-gray-500">
                Loading Hero Image...
            </div>
          )}
        </section>
      </div>
    </div>
  );
}