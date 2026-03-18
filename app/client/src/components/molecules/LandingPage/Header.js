"use client";
import { VizOpsLogo } from "@/components/atoms/AppIcons";
import LinkAtom from "@/components/atoms/LinkAtom";

function Header() {
  return (
    <div className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-[#050505]/60 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50">

      {/* Left Side: Logo and Title */}
      <div className="flex items-center gap-4 group cursor-pointer">
        <div className="relative">
          <div className="absolute inset-0 bg-red-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <VizOpsLogo size={36} className="text-red-600 relative z-10" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
            VIZOPS
          </h1>
          <span className="text-[10px] text-red-600 font-black uppercase tracking-[0.3em] opacity-70 mt-0.5">
            Enterprise Link
          </span>
        </div>
      </div>

      {/* Right Side: Navigation & Auth */}
      <div className="flex items-center gap-6">
        <LinkAtom link={"/login?form=signin"}>
          <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
            Sign In
          </button>
        </LinkAtom>

        <LinkAtom link={"/login?form=signup"}>
          <button className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/10 active:scale-95">
            Create Account
          </button>
        </LinkAtom>
      </div>
    </div>
  );
}

export default Header;