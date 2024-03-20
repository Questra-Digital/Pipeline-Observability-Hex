"use client";
import { lazy, useState, useEffect } from "react";
import ImageAtom from "@/components/atoms/ImageAtom";
import LinkAtom from "@/components/atoms/LinkAtom";
import TextAtom from "@/components/atoms/TextAtom";
const ParticlesBg = lazy(() =>
  import("@/components/atoms/Particles/ParticlesBg")
);
const Typewriter = lazy(() =>
  import("@/components/atoms/Typography/Typerwriter")
);

export default function MainSection() {
  // state to handle Elements Display
  const [showParticlesBg, setShowParticlesBg] = useState(false);
  const [showTypewriter, setShowTypewriter] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowTypewriter(true), 1000); // Delay loading Typewriter by 1 seconds
    setTimeout(() => setShowParticlesBg(true), 2000); // Delay loading ParticlesBg by 2 seconds
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 w-[100vw] h-[100vh] -z-10 clip-path glass-effect">
        {showParticlesBg && <ParticlesBg />}
      </div>
      <div className="flex md:flex-row flex-col h-full min-w-screen">
        <section className="w-[100%] h-full flex flex-col text-center sm:text-left sm:pl-10">
          <TextAtom
            properties={"text-5xl font-semibold italic font-Ubuntu mt-20 mb-8"}
          >
            Gain <span className="text-[#90DE83]">Holistic Insights</span>, Make{" "}
            <span className="text-[#d9b153]">Informed Decisions</span>
          </TextAtom>
          <div className="min-h-[70px]">{showTypewriter && <Typewriter />}</div>
          <LinkAtom
            link="./configurePipeline"
            prefetch={true}
            text={"Get Started"}
            properties={
              "bg-gradient-to-r from-blue-800 to-purple-600 to-90% col px-5 py-3 w-fit rounded-full shadow-md flex text-xl hover:bg-green-600 transform duration-200 ml-4 mt-8 self-center sm:self-auto"
            }
          >
            <ImageAtom
              src="/assets/Images/Enter.png"
              alt="Enter Image"
              width={30}
              height={20}
              properties={["ml-3", "bounce-button"]}
              loading="lazy"
            />
          </LinkAtom>
        </section>
        <section className="w-[100%] flex items-center justify-center mt-10 sm:mt-0">
          <ImageAtom
            src="/assets/Images/hero.png"
            alt=""
            height={550}
            width={500}
            priority
            quality={100}
          />
        </section>
      </div>
    </>
  );
}
