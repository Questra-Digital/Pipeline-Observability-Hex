'use client'


function Header() {
  return (
    <>
    <div className="grid md:grid-cols-3 items-center w-full px-5 my-5 z-10">
        <img className="w-28 my-2 md:my-0 self-center md:self-start" src="/assets/Images/logo.png" alt="logo"/>
        <p className="text-slate-200 text-2xl xl:text-3xl font-bold my-2 md:my-0 text-center font-Ubuntu">Datalogs-Pipeline-Observer</p>
        <div className=" my-2 md:my-0 flex justify-center md:justify-end">
            <button className="outline outline-blue-500 hover:outline-blue-300 bg-transparent px-5 py-[1.5px] rounded-full mr-5 filter drop-shadow-md transform duration-200 ease-linear">Login</button>
            <button className="bg-blue-700 hover:bg-blue-500 px-5 py-2 text-xl rounded-full mr-5 shadow-sm shadow-gray-100 hover:border-gray-400 transform duration-200 ease-linear">SignUp</button>
        </div>
    </div>
    </> 
  )
}

export default Header