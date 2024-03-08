import LinkAtom from "@/Components/atoms/LinkAtom"

const Home = () => {
  return (
    <div className="w-full h-full flex justify-center items-center flex-col py-5 px-5">
    <p className="font-semibold text-3xl md:text-5xl my-10">
      Welcome Back,<span className="text-blue-400"> Sherry</span>
    </p>
    <LinkAtom link={"/integrations"} text={"Monitor Pipeline Now"} properties={"border px-2 sm:px-4 py-3 hover:bg-white hover:text-black ease-linear duration-300 transition-all"}/>
  </div>
  )
}

export default Home