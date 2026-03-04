"use client";
import React, { useState, useEffect, useRef } from "react";
import useFetch from "@/hooks/useFetch";
import { ErrorToast } from "@/components/atoms/toastUtils/Toast";

const NOCView = ({ onBack }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const containerRef = useRef(null);

    // Fetching both ArgoCD and GitHub data
    const { data: argoData, loading: argoLoading } = useFetch("/all_pipelines");
    const { data: githubData, loading: githubLoading } = useFetch("/api/github/repos");

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                ErrorToast(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullScreen(true);
        } else {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    };

    useEffect(() => {
        const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleFsChange);
        return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    const renderStatusHex = (status, label, type) => {
        const colorClass = status === "active" || status === "Healthy" || status === "success"
            ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]"
            : status === "failed" || status === "Degraded"
                ? "bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                : "bg-gray-600 grayscale opacity-50";

        return (
            <div className="relative group cursor-crosshair">
                <div className={`w-12 h-14 clip-hex transition-all duration-300 transform group-hover:scale-110 flex items-center justify-center ${colorClass}`}>
                    <div className="w-10 h-12 clip-hex bg-slate-950 flex items-center justify-center">
                        <span className={`text-[8px] font-black uppercase text-center leading-tight ${status === "active" || status === "Healthy" || status === "success" ? "text-emerald-400" : "text-gray-400"}`}>
                            {label.substring(0, 3)}
                        </span>
                    </div>
                </div>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 py-1.5 px-3 bg-black/90 border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap backdrop-blur-md">
                    <p className="text-[10px] font-bold text-white uppercase tracking-tighter">{label}</p>
                    <p className="text-[8px] text-gray-500 uppercase">{type} • {status}</p>
                </div>
            </div>
        );
    };

    const isLoading = argoLoading || githubLoading;

    return (
        <div ref={containerRef} className={`w-full min-h-screen bg-[#020308] text-gray-300 font-mono p-6 overflow-y-auto selection:bg-purple-500/30 ${isFullScreen ? "fixed inset-0 z-[100]" : "relative"}`}>

            {/* SVG Hex Clip Path Definition */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <clipPath id="clip-hex" clipPathUnits="objectBoundingBox">
                        <path d="M0.5,0 L1,0.25 L1,0.75 L0.5,1 L0,0.75 L0,0.25 Z" />
                    </clipPath>
                </defs>
            </svg>
            <style jsx>{`
                .clip-hex { clip-path: url(#clip-hex); }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <div className="flex items-center gap-6">
                    {!isFullScreen && (
                        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group px-4 py-1.5 rounded border border-white/5 hover:bg-white/5">
                            <span className="text-xs font-bold uppercase tracking-[2px]">← Exit NOC</span>
                        </button>
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black text-white tracking-widest uppercase italic bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Neural-Ops Center // {new Date().toLocaleTimeString()}
                        </h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-[4px]">Active Pipeline Surveillance & Unified Observability</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest animate-pulse">● System Online</span>
                        <span className="text-[8px] text-gray-600 uppercase">Uptime: 99.998%</span>
                    </div>
                    <button
                        onClick={toggleFullScreen}
                        className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center group"
                    >
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                    </button>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* ArgoCD Section */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-1 h-6 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                        <h2 className="text-sm font-black text-gray-100 uppercase tracking-[4px]">ArgoCD Environment Clusters</h2>
                    </div>

                    <div className="bg-[#05060f] border border-white/5 rounded-2xl p-8 min-h-[400px] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(168,85,247,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        {isLoading ? (
                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-x-2 gap-y-4 animate-pulse">
                                {[...Array(40)].map((_, i) => <div key={i} className="w-10 h-12 bg-white/5 clip-hex"></div>)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-x-2 gap-y-4">
                                {(argoData?.available_pipeline || []).map((pipe, idx) => renderStatusHex("Healthy", pipe, "ArgoCD"))}
                                {(!argoData?.available_pipeline?.length) && <p className="col-span-full text-center text-gray-600 text-xs py-20">NO ARGO DATA DETECTED</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* GitHub Actions Section */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-1 h-6 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        <h2 className="text-sm font-black text-gray-100 uppercase tracking-[4px]">GitHub Actions Microservices</h2>
                    </div>

                    <div className="bg-[#05060f] border border-white/5 rounded-2xl p-8 min-h-[400px] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        {isLoading ? (
                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-x-2 gap-y-4 animate-pulse">
                                {[...Array(30)].map((_, i) => <div key={i} className="w-10 h-12 bg-white/5 clip-hex"></div>)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-x-2 gap-y-4">
                                {githubData?.flatMap(acc => acc.repositories?.filter(r => r.enabled).map(repo => renderStatusHex("active", repo.name, `GHA • ${acc.owner}`))) || []}
                                {(!githubData?.length) && <p className="col-span-full text-center text-gray-600 text-xs py-20">NO ACTIVE GITHUB PIPELINES</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Stats Strip */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Active Nodes", val: (argoData?.available_pipeline?.length || 0) + (githubData?.length || 0), color: "text-blue-400" },
                    { label: "Stability Index", val: "99.8%", color: "text-emerald-400" },
                    { label: "Observability Saturation", val: "72%", color: "text-purple-400" },
                    { label: "Encryption", val: "AES-256", color: "text-gray-500" },
                ].map((stat, i) => (
                    <div key={stat.label} className="bg-[#0b0c15] border border-white/5 rounded-xl p-4 flex flex-col gap-1 shadow-2xl">
                        <span className="text-[9px] uppercase tracking-[2px] font-bold text-gray-600">{stat.label}</span>
                        <span className={`text-xl font-black ${stat.color}`}>{stat.val}</span>
                    </div>
                ))}
            </div>

            {/* Background Neural Matrix Pattern */}
            <div className="fixed inset-0 pointer-events-none -z-10 opacity-10 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]"></div>
        </div>
    );
};

export default NOCView;
