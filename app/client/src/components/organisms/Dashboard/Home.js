'use client'
import { useEffect, useState } from 'react';
import LinkAtom from "@/components/atoms/LinkAtom";
import { useConfiguredApps } from '@/hooks/useConfiguredApps';

const Home = () => {
  useConfiguredApps();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full max-h-screen h-[800px] flex justify-center items-center flex-col px-6 py-8 relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}
        />
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Main content */}
      <div className={`relative z-10 flex flex-col items-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* System status indicator */}
        <div className="mb-16 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>SYSTEM ONLINE</span>
        </div>

        {/* Main heading with glitch effect */}
        <h1 className="font-bold text-6xl md:text-7xl lg:text-[100px] leading-none mb-6 text-center bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent relative tracking-tight">
          WELCOME BACK
          {/* Glitch layers */}
          <span className="absolute inset-0 text-green-500 opacity-20 animate-glitch" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)' }}>
            WELCOME BACK
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 text-sm md:text-base uppercase tracking-[0.15em] mb-16 text-center">
          CI/CD Pipeline Observability Dashboard
        </p>

        {/* CTA Button */}
        <div className={`mb-20 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <LinkAtom 
            link={"/integrations"} 
            text={"Monitor Pipeline Now"} 
            properties={"group relative border-2 border-green-500/30 px-10 py-4 hover:border-green-400 transition-all duration-300 bg-gradient-to-r from-green-500/5 to-transparent hover:from-green-500/10 overflow-hidden text-sm tracking-wider"}
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </LinkAtom>
        </div>

        {/* Quick stats */}
        <div className={`grid grid-cols-3 gap-16 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">99.8%</div>
            <div className="text-xs text-gray-500 uppercase tracking-[0.15em]">Uptime</div>
          </div>
          <div className="text-center border-x border-gray-800 px-12">
            <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">24/7</div>
            <div className="text-xs text-gray-500 uppercase tracking-[0.15em]">Monitoring</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-2">Real-time</div>
            <div className="text-xs text-gray-500 uppercase tracking-[0.15em]">Analytics</div>
          </div>
        </div>
      </div>

      {/* Animated corner decorations */}
      <div className="absolute top-8 left-8 w-24 h-24 border-t-2 border-l-2 border-green-500/30" />
      <div className="absolute top-8 right-8 w-24 h-24 border-t-2 border-r-2 border-green-500/30" />
      <div className="absolute bottom-8 left-8 w-24 h-24 border-b-2 border-l-2 border-green-500/30" />
      <div className="absolute bottom-8 right-8 w-24 h-24 border-b-2 border-r-2 border-green-500/30" />

      <style jsx>{`
        @keyframes gridMove {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(50px);
          }
        }
        @keyframes glitch {
          0%, 100% {
            transform: translate(0);
          }
          33% {
            transform: translate(-2px, 2px);
          }
          66% {
            transform: translate(2px, -2px);
          }
        }
        .animate-glitch {
          animation: glitch 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default Home;