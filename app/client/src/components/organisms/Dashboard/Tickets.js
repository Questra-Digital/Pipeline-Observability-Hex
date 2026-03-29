"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
    TicketIcon,
    GitHubIcon
} from "@/components/atoms/AppIcons";

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || "{}");
            const token = userData.token || "";
            const instance = axios.create({
                baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            });

            const res = await instance.get("/api/github/tickets", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(res.data || []);
            setError(null);
        } catch (err) {
            console.error("Error fetching tickets:", err);
            setError("Failed to load automated tickets. Check backend connectivity.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#020202] text-[#e0e0e0] overflow-x-hidden pt-12 pb-32 px-4 lg:px-12 font-sans selection:bg-red-600/30 selection:text-white">
            {/* AMBIENT BACKGROUNDS */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-red-600/[0.04] blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 -z-10 animate-pulse"></div>
            <div className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-900/20 to-transparent top-0 opacity-50"></div>

            <div className="w-full max-w-3xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-5 duration-1000 fill-mode-both">
                {/* MINIMALIST HEADER */}
                {/* MINIMALIST HEADER - REFACTORED FOR STACKED LAYOUT */}
                <header className="flex flex-col gap-10 border-b border-white/5 pb-12 relative">
                    <div className="flex flex-col items-start gap-6">
                        <div className="flex items-center gap-6">
                            <div className="relative group shrink-0">
                                <div className="absolute inset-0 bg-red-600 blur-2xl opacity-0 group-hover:opacity-20 transition-all duration-1000"></div>
                                <div className="relative p-5 bg-[#050505] border border-red-600/30 rounded-3xl shadow-xl group-hover:border-red-600/60 transition-all duration-700 active:scale-95 overflow-hidden">
                                    <TicketIcon size={32} className="text-red-600" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></div>
                                    <span className="text-[9px] font-black uppercase text-red-600 tracking-[0.4em]">NEURAL LOGS</span>
                                </div>
                                <h1 className="text-6xl font-black tracking-tighter leading-none italic uppercase -ml-1 text-white select-none">
                                    Tickets
                                </h1>
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 opacity-60 border-l-2 border-red-900 px-3 py-1">
                            Automated Neural Diagnostic Repository (v2.5)
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 w-full">
                        <div className="flex-grow flex items-center justify-between bg-[#050505]/60 backdrop-blur-3xl px-8 py-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative group overflow-hidden">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col pr-8 border-r border-white/10 shrink-0">
                                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-2 italic">Grid Health</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-mono text-emerald-500 font-black uppercase">Optimal</span>
                                    </div>
                                </div>
                                <div className="flex flex-col shrink-0">
                                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1 italic">Active Links</span>
                                    <div className="flex items-end gap-1.5">
                                        <span className="text-3xl font-black text-white italic leading-none">{tickets.length}</span>
                                        <span className="text-[9px] font-black text-red-900 uppercase tracking-widest mb-0.5 italic">Entries</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={fetchTickets}
                                disabled={loading}
                                className="p-4 bg-white/[0.03] hover:bg-red-600/10 border border-white/10 hover:border-red-600/50 rounded-2xl transition-all active:scale-90 group text-gray-400 hover:text-red-500 relative z-10"
                                title="Sync Neural Data"
                            >
                                <svg className={`w-5 h-5 ${loading ? 'animate-spin text-red-500' : 'group-hover:rotate-180 transition-transform duration-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                        </div>
                    </div>
                </header>

                {/* HORIZONTAL GRID / LIST CONTAINER */}
                <div className="flex flex-col gap-6 lg:gap-8 w-full">
                    {loading && tickets.length === 0 ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="h-64 w-full bg-[#030303] border border-white/5 rounded-[2.5rem] animate-pulse"></div>
                        ))
                    ) : tickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-52 bg-[#020202]/60 border border-dashed border-white/10 rounded-[5rem] group transition-all duration-1000 hover:border-red-600/20 backdrop-blur-sm relative overflow-hidden">
                            <div className="relative p-12 bg-white/5 rounded-full border border-white/5 group-hover:scale-110 group-hover:border-red-600/20 transition-all duration-1000 mb-10">
                                <TicketIcon size={90} className="text-gray-900 group-hover:text-red-700 transition-all duration-700" />
                            </div>
                            <h3 className="text-4xl font-black text-gray-700 uppercase tracking-tighter italic">Neural Horizon: Empty</h3>
                        </div>
                    ) : (
                        tickets.map((ticket, idx) => (
                            <div
                                key={ticket.id || idx}
                                className="group relative flex flex-col items-start bg-[#050505] hover:bg-[#070707] border border-white/5 hover:border-red-600/30 rounded-[3rem] p-6 lg:p-10 transition-all duration-700 hover:shadow-[0_40px_100px_rgba(220,38,38,0.06)] hover:-translate-y-1 overflow-hidden w-full"
                            >
                                {/* SCAN ANIMATION */}
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2000ms] ease-in-out"></div>
                                <div className={`absolute bottom-0 left-0 w-full h-[2px] opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-red-600/40 to-transparent`}></div>

                                {/* STATUS NEON VERTICAL */}
                                <div className={`absolute left-0 top-0 bottom-0 w-[6px] transition-all duration-700 ${ticket.status === 'open' ? 'bg-red-700 group-hover:bg-red-600 shadow-[4px_0_25px_rgba(220,38,38,0.5)]' : 'bg-emerald-500 shadow-[4px_0_25px_rgba(16,185,129,0.5)]'}`}></div>

                                {/* VERTICAL LAYOUT START */}
                                <div className="flex flex-col w-full min-w-0">
                                    {/* TOP BAR: REPO & STATUS */}
                                    <div className="flex flex-wrap items-center justify-between gap-6 pb-6 mb-6 border-b border-white/5">
                                        <div className="flex items-center gap-6">
                                            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-red-600/10 group-hover:border-red-600/40 transition-all duration-700">
                                                <GitHubIcon size={24} className="text-gray-600 group-hover:text-red-500 transition-colors" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-mono font-black text-gray-700 group-hover:text-red-500 uppercase tracking-widest italic transition-colors">#{ticket.issueNumber}</span>
                                                <span className="text-xl font-black text-white italic tracking-tighter uppercase">{ticket.repoName}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1 italic">Status</span>
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${ticket.status === 'open' ? 'bg-red-600 animate-pulse' : 'bg-emerald-500'}`}></div>
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] font-mono italic ${ticket.status === 'open' ? 'text-red-500' : 'text-emerald-500'}`}>{ticket.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* MIDDLE: TITLE & TAGS */}
                                    <div className="space-y-6">
                                        <h3 className="text-2xl lg:text-4xl font-black text-white group-hover:text-red-600 transition-all duration-700 leading-tight italic uppercase tracking-tighter" title={ticket.title}>
                                            {ticket.title}
                                        </h3>

                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="px-4 py-1.5 bg-red-950/20 rounded-full border border-red-900/40 shrink-0">
                                                <span className="text-[9px] font-black text-red-700 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.6)] animate-pulse shrink-0"></div>
                                                    NEURAL-FINGERPRINT: {ticket.runId}
                                                </span>
                                            </div>
                                            {ticket.status === 'open' && (
                                                <span className="text-[9px] font-black bg-red-600/10 text-red-500 px-4 py-1.5 rounded-full border border-red-600/20 animate-pulse uppercase tracking-[0.3em] shrink-0 italic">Mission Critical</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* BOTTOM BAR: DATE & ACTION */}
                                    <div className="flex flex-wrap items-center justify-between gap-8 mt-10 pt-8 border-t border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-2 italic">Detection</span>
                                            <span className="text-sm font-black text-white font-mono opacity-80 group-hover:text-red-500 transition-colors">
                                                {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                            </span>
                                        </div>

                                        <a
                                            href={ticket.issueUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group/btn relative px-8 py-4 bg-[#020202] hover:bg-red-700 text-white rounded-2xl border border-white/5 hover:border-red-600 transition-all duration-700 active:scale-95 shadow-2xl flex items-center gap-4 overflow-hidden w-full sm:w-auto justify-center"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]"></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] relative z-10 italic">Analyze Root Cause</span>
                                            <div className="p-2 bg-white/5 rounded-lg group-hover/btn:bg-white/20 transition-all duration-500 relative z-10">
                                                <svg className="w-4 h-4 translate-x-0 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                                {/* VERTICAL LAYOUT END */}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* NEURAL ERROR OVERLAY */}
            {error && (
                <div className="fixed bottom-12 right-12 z-50 animate-in slide-in-from-right-20 duration-1000">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-red-600 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
                        <div className="relative bg-[#020202]/95 backdrop-blur-3xl border border-red-600/40 rounded-[3rem] p-10 lg:p-12 shadow-[0_40px_100px_rgba(220,38,38,0.2)] flex items-center gap-10 max-w-2xl group-hover:border-red-600/80 transition-all duration-500 outline outline-1 outline-white/5">
                            <div className="w-20 h-20 bg-red-600/10 rounded-[2rem] border border-red-600/30 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                <svg className="w-10 h-10 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-3 h-[1px] bg-red-600"></div>
                                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Neural Link Inhibited</h4>
                                </div>
                                <p className="text-red-500/80 text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed line-clamp-2 mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                    {error} <span className="text-red-700/50 ml-2 font-mono">[ERROR_CODE: API_SYNC_404]</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default Tickets;
