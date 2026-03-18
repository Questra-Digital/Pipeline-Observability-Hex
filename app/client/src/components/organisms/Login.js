"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LoginForm from "../molecules/Forms/SigninForm";
import SignupForm from "../molecules/Forms/SignupForm";
import BackButton from "../atoms/BackButton";
import { VizOpsLogo } from "../atoms/AppIcons";

const LoginContent = () => {
  const searchParams = useSearchParams();
  const initialForm = searchParams.get("form") || "signin";
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const currentForm = searchParams.get("form");
    if (currentForm) {
      setForm(currentForm);
    }
  }, [searchParams]);

  const toggleForm = () => {
    setForm(form === "signin" ? "signup" : "signin");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020202] relative overflow-hidden font-Ubuntu">
      {/* GLOBAL ATMOSPHERIC BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Deep Radial Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a0505_0%,transparent_50%)]"></div>

        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full animate-pulse ${i % 3 === 0 ? 'bg-red-600/20' : 'bg-white/10'}`}
              style={{
                width: `${1 + Math.random() * 2}px`,
                height: `${1 + Math.random() * 2}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${5 + Math.random() * 7}s`,
                opacity: 0.1 + Math.random() * 0.4
              }}
            ></div>
          ))}
        </div>

        {/* Ambient Glows */}
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-red-950/20 blur-[120px] rounded-full"></div>

        {/* Scanning Pulse */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/5 to-transparent animate-[scanline_10s_linear_infinite]"></div>
      </div>

      <div className="absolute top-10 left-10 z-20">
        <BackButton />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">

        {/* Left Side: Branding & Info */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="mb-10 flex items-center gap-4">
            <VizOpsLogo size={60} className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse" />
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">VIZOPS</h1>
              <p className="text-red-600 font-mono text-xs tracking-[0.4em] uppercase opacity-80">Enterprise Link</p>
            </div>
          </div>

          <h2 className="text-6xl font-black text-white leading-[0.9] tracking-tighter uppercase italic mb-8">
            Access <span className="text-red-600">Advanced</span> <br />Pipeline Insights
          </h2>

          <div className="space-y-6 max-w-md">
            <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm group hover:border-red-600/20 transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-red-950/20 border border-red-600/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Integrated GitOps orchestration with real-time monitoring and analytics components.</p>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm group hover:border-red-600/20 transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-red-950/20 border border-red-600/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Enterprise-grade security for all CI/CD pipelines and deployment workflows.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="w-full max-w-lg lg:w-[500px] animate-in slide-in-from-right-10 duration-700">
          <div className="glass-card rounded-[3rem] p-1 shadow-[0_0_80px_rgba(220,38,38,0.1)] relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-transparent"></div>

            <div className="bg-[#0a0a0a]/60 backdrop-blur-3xl rounded-[3rem] p-10 lg:p-14">
              {/* Form Switcher Tabs */}
              <div className="flex bg-black/40 p-1.5 rounded-2xl mb-12 border border-white/5">
                <button
                  onClick={() => setForm("signin")}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${form === "signin" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-gray-500 hover:text-white"}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setForm("signup")}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${form === "signup" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-gray-500 hover:text-white"}`}
                >
                  Create Account
                </button>
              </div>

              <div className="relative overflow-hidden min-h-[400px]">
                {form === "signin" ? (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <LoginForm />
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <SignupForm />
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">
            © 2024 VIZOPS SYSTEMS • VERSION 1.0
          </p>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-[#050505] flex items-center justify-center text-red-600 font-black uppercase tracking-widest">Initialising Stream...</div>}>
      <LoginContent />
    </Suspense>
  );
};

export default Login;