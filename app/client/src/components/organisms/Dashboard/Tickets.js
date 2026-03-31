"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchTickets } from "@/services/ticketService";
import {
    TicketIcon,
    GitHubIcon
} from "@/components/atoms/AppIcons";
import Modal from "@/components/atoms/Modal";

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [repoFilter, setRepoFilter] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        getTickets();
    }, []);

    const getTickets = async () => {
        setLoading(true);
        try {
            const data = await fetchTickets();
            setTickets(data);
            setError(null);
        } catch (err) {
            setError("Failed to load automated tickets. Check backend connectivity.");
        } finally {
            setLoading(false);
        }
    };

    const repoStyles = useMemo(() => {
        return {
            'argocd-web-app': { text: 'text-blue-500', border: 'group-hover:border-blue-600/40', glow: 'hover:shadow-[0_40px_100px_rgba(37,99,235,0.1)]', scan: 'via-blue-600/20' },
            'pipeline-observability-hex': { text: 'text-emerald-500', border: 'group-hover:border-emerald-600/40', glow: 'hover:shadow-[0_40px_100px_rgba(16,185,129,0.1)]', scan: 'via-emerald-600/20' },
            'influencer-stats-api': { text: 'text-amber-500', border: 'group-hover:border-amber-600/40', glow: 'hover:shadow-[0_40px_100px_rgba(245,158,11,0.1)]', scan: 'via-amber-600/20' },
            'flutter-creator-app': { text: 'text-purple-500', border: 'group-hover:border-purple-600/40', glow: 'hover:shadow-[0_40px_100px_rgba(147,51,234,0.1)]', scan: 'via-purple-600/20' },
            'default': { text: 'text-red-500', border: 'group-hover:border-red-600/40', glow: 'hover:shadow-[0_40px_100px_rgba(220,38,38,0.1)]', scan: 'via-red-600/20' }
        };
    }, []);

    const getRepoStyle = (repoName) => {
        const key = repoName?.toLowerCase() || 'default';
        return repoStyles[key] || repoStyles['default'];
    };

    const repos = useMemo(() => {
        const uniqueRepos = [...new Set(tickets.map(t => t.repoName))];
        return uniqueRepos.sort();
    }, [tickets]);

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            const matchesSearch =
                ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.repoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.issueNumber.toString().includes(searchQuery);

            const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
            const matchesRepo = repoFilter === "all" || ticket.repoName === repoFilter;

            return matchesSearch && matchesStatus && matchesRepo;
        });
    }, [tickets, searchQuery, statusFilter, repoFilter]);

    return (
        <div className="relative min-h-screen bg-[#020202] text-[#e0e0e0] overflow-x-hidden pt-12 pb-32 px-4 lg:px-12 font-sans selection:bg-red-600/30 selection:text-white">
            {/* AMBIENT BACKGROUNDS */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-red-600/[0.04] blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 -z-10 animate-pulse"></div>
            <div className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-900/20 to-transparent top-0 opacity-50"></div>

            <div className="w-full max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-1000 fill-mode-both">
                {/* MODERN HEADER */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10 relative">
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
                    </div>

                    <div className="flex items-end gap-6 text-right">
                        <div className="flex flex-col items-end bg-[#050505]/60 backdrop-blur-3xl px-8 py-6 rounded-3xl border border-white/5 shadow-2xl relative group overflow-hidden">
                            <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1 italic">Active Entries</span>
                            <div className="flex items-end gap-3 text-right">
                                <span className="text-4xl font-black text-white italic leading-none">{filteredTickets.length}</span>
                                <span className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-0.5 italic">/ {tickets.length}</span>
                            </div>
                        </div>
                        <button
                            onClick={getTickets}
                            disabled={loading}
                            className="p-6 bg-white/[0.03] hover:bg-red-600/10 border border-white/10 hover:border-red-600/50 rounded-3xl transition-all active:scale-90 group text-gray-400 hover:text-red-500 relative z-10"
                            title="Sync Neural Data"
                        >
                            <svg className={`w-6 h-6 ${loading ? 'animate-spin text-red-500' : 'group-hover:rotate-180 transition-transform duration-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </div>
                </header>

                {/* SEARCH & FILTERS BAR */}
                <div className="flex flex-col lg:flex-row items-center gap-4 bg-[#050505]/40 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
                    <div className="relative flex-grow w-full">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="SEARCH TICKETS, REPOS, OR ISSUE ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#020202] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-gray-800 focus:outline-none focus:border-red-600/40 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-[#020202] border border-white/5 rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-red-600/40 transition-all cursor-pointer appearance-none min-w-[140px]"
                        >
                            <option value="all">ALL STATUS</option>
                            <option value="open">OPEN</option>
                            <option value="closed">CLOSED</option>
                        </select>

                        <select
                            value={repoFilter}
                            onChange={(e) => setRepoFilter(e.target.value)}
                            className="bg-[#020202] border border-white/5 rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-red-600/40 transition-all cursor-pointer appearance-none flex-grow lg:flex-grow-0 min-w-[180px]"
                        >
                            <option value="all">ALL REPOSITORIES</option>
                            {repos.map(repo => (
                                <option key={repo} value={repo}>{repo.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* TICKETS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading && tickets.length === 0 ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="h-64 bg-[#030303] border border-white/5 rounded-[2rem] animate-pulse"></div>
                        ))
                    ) : filteredTickets.length === 0 ? (
                        <div className="md:col-span-2 flex flex-col items-center justify-center py-40 bg-[#020202]/60 border border-dashed border-white/10 rounded-[4rem] group hover:border-red-600/20 transition-all duration-1000">
                            <TicketIcon size={60} className="text-gray-900 mb-8 group-hover:text-red-700 transition-all duration-700" />
                            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter italic">No Neural Matches Found</h3>
                        </div>
                    ) : (
                        filteredTickets.map((ticket, idx) => {
                            const style = getRepoStyle(ticket.repoName);
                            return (
                                <div
                                    key={ticket.id || idx}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`group relative flex flex-col bg-[#050505] hover:bg-[#070707] border border-white/5 ${style.border} ${style.glow} rounded-[2.5rem] p-8 transition-all duration-700 cursor-pointer overflow-hidden`}
                                >
                                    {/* SCAN ANIMATION */}
                                    <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${style.scan} to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2000ms]`}></div>

                                    {/* STATUS INDICATOR */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${ticket.status === 'open' ? 'bg-red-600 shadow-[2px_0_15px_rgba(220,38,38,0.4)]' : 'bg-emerald-500 shadow-[2px_0_15px_rgba(16,185,129,0.4)]'}`}></div>

                                    <div className="flex flex-col h-full justify-between">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <GitHubIcon size={16} className={`text-gray-700 ${style.text} transition-colors`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${style.text}`}>{ticket.repoName}</span>
                                                </div>
                                                <span className={`text-[9px] font-mono font-black text-gray-800 ${style.text} transition-colors`}>#{ticket.issueNumber}</span>
                                            </div>

                                            <h3 className={`text-xl font-black text-white ${style.text.replace('text-', 'group-hover:text-')} transition-all duration-700 leading-tight italic uppercase tracking-tighter line-clamp-2`}>
                                                {ticket.title}
                                            </h3>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest mb-1">Detected</span>
                                                <span className="text-[10px] font-mono text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            <div className={`px-4 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-lg ${ticket.status === 'open' ? 'bg-red-600/10 border-red-600/40 text-red-500 shadow-red-600/10' : 'bg-emerald-600/10 border-emerald-600/40 text-emerald-500 shadow-emerald-600/10'}`}>
                                                {ticket.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ERROR TOAST */}
            {error && (
                <div className="fixed bottom-12 right-12 z-50 animate-in slide-in-from-right-10 duration-500">
                    <div className="bg-[#050505] border border-red-600/40 rounded-2xl p-6 shadow-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center border border-red-600/20">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{error}</p>
                    </div>
                </div>
            )}

            {/* TICKET DETAIL MODAL */}
            <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)}>
                {selectedTicket && (
                    <div className="w-full max-w-2xl bg-[#050505] p-10 space-y-10">
                        <div className="flex items-start justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="px-4 py-1.5 bg-red-950/20 rounded-full border border-red-900/40">
                                        <span className="text-[9px] font-black text-red-700 uppercase tracking-widest">#{selectedTicket.issueNumber}</span>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-xl ${selectedTicket.status === 'open' ? 'bg-red-600/10 border-red-600/40 text-red-500 shadow-red-600/10' : 'bg-emerald-600/10 border-emerald-600/40 text-emerald-500 shadow-emerald-600/10'}`}>
                                        {selectedTicket.status}
                                    </div>
                                </div>
                                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                                    {selectedTicket.title}
                                </h2>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="p-3 hover:bg-white/5 rounded-xl transition-colors">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-8 py-8 border-y border-white/5">
                            <div className="space-y-2">
                                <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.3em]">Repository</span>
                                <div className="flex items-center gap-3">
                                    <GitHubIcon size={18} className={getRepoStyle(selectedTicket.repoName).text} />
                                    <span className={`text-sm font-black uppercase italic ${getRepoStyle(selectedTicket.repoName).text}`}>{selectedTicket.repoName}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.3em]">Detected At</span>
                                <span className="block text-sm font-black text-white font-mono">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.3em]">Neural ID</span>
                                <span className="block text-sm font-black text-red-900 font-mono tracking-tighter">{selectedTicket.runId}</span>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.3em]">External Link</span>
                                <a href={selectedTicket.issueUrl} target="_blank" rel="noopener noreferrer" className="block text-sm font-black text-blue-500 hover:text-blue-400 underline underline-offset-4 decoration-2 transition-colors">VIEW ON GITHUB</a>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/5 transition-all text-[9px] font-black uppercase tracking-widest active:scale-95"
                            >
                                Close Log
                            </button>
                            <a
                                href={selectedTicket.issueUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-4 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white rounded-2xl shadow-[0_10px_30px_rgba(220,38,38,0.3)] transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-3 active:scale-95"
                            >
                                Analyze Root Cause
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </a>
                        </div>
                    </div>
                )}
            </Modal>

            <style jsx>{`
                select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23333' %3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                    background-position: right 1.5rem center;
                    background-repeat: no-repeat;
                    background-size: 1rem;
                }
            `}</style>
        </div>
    );
};

export default Tickets;
