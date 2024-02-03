import Header from "../molecules/LandingPage/Header";
import MainSection from "../molecules/LandingPage/MainSection";

const LandingPage = () => {
  return (
    <>
      <main className="flex min-w-screen h-screen flex-col  ">
        <Header />
        <MainSection />
      </main>
    </>
  );
};

export default LandingPage;
