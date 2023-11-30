import Image from "next/image";
import Link from "next/link";
import Header from "@/Components/Header/Header";
import ParticlesBg from "@/Components/Particles/ParticlesBg";
import Typewriter from "@/Components/Typography/Typerwriter";

export default function Home() {
  const texts = ["Hello, world!", "Next.js!", "client-side."];

  return (
    <>
    <div className="fixed top-0 left-0 w-[100vw] h-[100vh] -z-10 clip-path glass-effect">
    <ParticlesBg />
    </div>
      <main className="flex min-w-screen h-screen flex-col  ">
        <Header />
        <div className="flex md:flex-row flex-col h-full min-w-screen">
          <section className="w-[100%] h-full flex flex-col text-center sm:text-left sm:pl-10">
            <p className="text-5xl font-semibold italic font-Ubuntu mt-20 mb-8">
              Gain <span className="text-[#90DE83]">Holistic Insights</span>,
              Make <span className="text-[#d9b153]">Informed Decisions</span>
            </p>
            <Typewriter />
            <Link
              href="./configurePipeline"
              className="bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% col px-5 py-3 w-fit rounded-full shadow-md flex hover:bg-green-600 transform 
              duration-200 ml-4 mt-8 self-center sm:self-auto"
            >
              <button className="mx-px text-xl">Get Started</button>
              <Image
                src="/assets/Images/Enter.png"
                alt="Enter Image"
                width={30}
                height={20}
                className="ml-3 bounce-button"
              />
            </Link>
          </section>
          <section className="w-[100%] flex items-center justify-center mt-10 sm:mt-0">
          <img src="/assets/Images/vector.png" alt="" style={{
            width:'fit',
            maxHeight:'550px',
          }}/>
          </section>
        </div>
      </main>
    </>
  );
}
