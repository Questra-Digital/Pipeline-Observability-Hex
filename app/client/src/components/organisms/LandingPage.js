import Header from "../molecules/LandingPage/Header";
import MainSection from "../molecules/LandingPage/MainSection";

const LandingPage = () => {
  return (
    <>
      <main className="flex w-full flex-col bg-[#050505]">
        <Header />
        <MainSection />
      </main>
    </>
  );
};

export default LandingPage;
