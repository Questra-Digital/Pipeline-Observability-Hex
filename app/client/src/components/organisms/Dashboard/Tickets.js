"use client";

import { useState, useEffect, useMemo } from "react";
import { syncTickets } from "@/services/ticketService";
import { GitHubIcon } from "@/components/atoms/AppIcons";

/* ─── Shared primitives ──────────────────────────────────────── */
const statusMeta = (s) => {
    if (s === "open") return { label: "OPEN", dot: "bg-red-500", ring: "border-red-600/30 bg-red-600/8 text-red-400", bar: "bg-red-600 shadow-[2px_0_12px_rgba(220,38,38,0.4)]" };
    if (s === "escalated") return { label: "ESCALATED", dot: "bg-amber-500", ring: "border-amber-600/30 bg-amber-600/8 text-amber-400", bar: "bg-amber-500 shadow-[2px_0_12px_rgba(245,158,11,0.4)]" };
    return { label: "CLOSED", dot: "bg-emerald-500", ring: "border-emerald-600/30 bg-emerald-600/8 text-emerald-400", bar: "bg-emerald-500 shadow-[2px_0_12px_rgba(16,185,129,0.4)]" };
};

const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return "—"; } };
const fmtTime = (d) => { try { return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

const REPO_ACCENTS = ["#dc2626", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
const repoColor = (name) => REPO_ACCENTS[Math.abs([...name].reduce((a, c) => a + c.charCodeAt(0), 0)) % REPO_ACCENTS.length];

/* ─── Stat Pill ─────────────────────────────────────────────── */
const StatPill = ({ label, value, color, sub }) => (
    <div className="flex flex-col gap-1 px-6 py-4 bg-[#0a0a0a] rounded-2xl border border-white/5 min-w-[120px]">
        <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.25em]">{label}</span>
        <span className="text-3xl font-black leading-none" style={{ color }}>{value}</span>
        {sub && <span className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">{sub}</span>}
    </div>
);

/* ─── Ticket Card ────────────────────────────────────────────── */
const TicketCard = ({ ticket, onClick, accent }) => {
    const sm = statusMeta(ticket.status);
    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col bg-[#080808] hover:bg-[#0d0d0d] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            style={{ "--accent": accent }}
        >
            {/* top accent bar */}
            <div className="absolute top-0 left-0 w-full h-[1px]"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}50, transparent)` }} />
            {/* left status bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${sm.bar} transition-all duration-300`} />

            <div className="px-7 pt-6 pb-5 flex flex-col h-full gap-4">
                {/* header row */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <GitHubIcon size={13} className="shrink-0 text-gray-600" />
                        <span className="text-[9px] font-black uppercase tracking-widest truncate"
                            style={{ color: accent }}>{ticket.repoName}</span>
                    </div>
                    <span className={`shrink-0 px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${sm.ring}`}>
                        {sm.label}
                    </span>
                </div>

                {/* title */}
                <h3 className="text-sm font-black text-white leading-snug uppercase tracking-tight line-clamp-2 group-hover:text-opacity-90 transition-all">
                    {ticket.title}
                </h3>

                {/* footer */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                        <span className="text-[9px] text-gray-600 font-mono">#{ticket.issueNumber}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-mono text-gray-600">{fmtDate(ticket.createdAt)}</p>
                        <p className="text-[8px] font-mono text-gray-800">{fmtTime(ticket.createdAt)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── Detail Drawer ──────────────────────────────────────────── */
const DetailDrawer = ({ ticket, onClose, accent }) => {
    if (!ticket) return null;
    const sm = statusMeta(ticket.status);
    return (
        <>
            {/* backdrop */}
            <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* drawer */}
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-[#070707] border-l border-white/[0.06] flex flex-col shadow-[−40px_0_80px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-300">
                {/* drawer header */}
                <div className="px-8 py-6 border-b border-white/[0.05] flex items-center justify-between shrink-0"
                    style={{ borderTopColor: accent, borderTopWidth: 2 }}>
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${sm.dot} shadow-[0_0_8px_currentColor]`} />
                        <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${sm.ring}`}>{sm.label}</span>
                        <span className="text-[10px] text-gray-600 font-mono">#{ticket.issueNumber}</span>
                    </div>
                    <button onClick={onClose}
                        className="p-2 rounded-xl text-gray-600 hover:text-white hover:bg-white/5 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* drawer body */}
                <div className="flex-1 overflow-y-auto px-8 py-7 space-y-7 custom-scrollbar">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-snug">{ticket.title}</h2>

                    {/* meta grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Repository", value: ticket.repoName, color: accent },
                            { label: "Owner", value: ticket.repoOwner, color: "#fff" },
                            { label: "Run ID", value: `#${ticket.runId}`, color: "#6b7280", mono: true },
                            { label: "Detected", value: fmtDate(ticket.createdAt), color: "#fff" },
                        ].map(m => (
                            <div key={m.label} className="bg-[#0a0a0a] rounded-2xl p-4 border border-white/[0.05]">
                                <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest block mb-1.5">{m.label}</span>
                                <span className={`text-sm font-black ${m.mono ? "font-mono" : ""}`} style={{ color: m.color }}>{m.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* body preview */}
                    <div className="bg-[#0a0a0a] rounded-2xl p-5 border border-white/[0.05]">
                        <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest block mb-3">Diagnostic Report</span>
                        <pre className="text-[10px] text-gray-400 font-mono leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-y-auto custom-scrollbar">
                            {ticket.body?.slice(0, 1200) || "No diagnostic body available."}
                        </pre>
                    </div>
                </div>

                {/* drawer footer */}
                <div className="px-8 py-5 border-t border-white/[0.05] flex gap-3 shrink-0">
                    <button onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                        Close
                    </button>
                    <a href={ticket.issueUrl} target="_blank" rel="noopener noreferrer"
                        className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${accent}cc, ${accent}80)` }}>
                        View on GitHub
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                </div>
            </div>
        </>
    );
};

/* ─── Main component ─────────────────────────────────────────── */
const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [repoFilter, setRepoFilter] = useState("all");
    const [selected, setSelected] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => { load(); }, []);

    const showToast = (msg, type = "info") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const load = async () => {
        setLoading(true);
        try {
            const data = await syncTickets();
            setTickets(data.tickets || []);
            setError(null);
            if (data.synced > 0) {
                showToast(`Synced ${data.synced} ticket${data.synced > 1 ? "s" : ""} with GitHub`, "success");
            }
        } catch {
            setError("Failed to load tickets — check backend connectivity.");
        } finally {
            setLoading(false);
        }
    };

    const repos = useMemo(() => [...new Set(tickets.map(t => t.repoName))].sort(), [tickets]);

    const filtered = useMemo(() => tickets.filter(t => {
        const q = search.toLowerCase();
        const matchQ = !q || t.title.toLowerCase().includes(q) || t.repoName.toLowerCase().includes(q) || String(t.issueNumber).includes(q);
        const matchS = statusFilter === "all" || t.status === statusFilter;
        const matchR = repoFilter === "all" || t.repoName === repoFilter;
        return matchQ && matchS && matchR;
    }), [tickets, search, statusFilter, repoFilter]);

    const stats = useMemo(() => ({
        total: tickets.length,
        open: tickets.filter(t => t.status === "open").length,
        escalated: tickets.filter(t => t.status === "escalated").length,
        closed: tickets.filter(t => t.status === "closed").length,
    }), [tickets]);

    const selectedAccent = selected ? repoColor(selected.repoName) : "#dc2626";

    return (
        <div className="min-h-screen bg-[#060606] text-white relative">
            {/* ── PAGE HEADER ─────────────────────────────────────── */}
            <div className="px-8 pt-10 pb-8">
                {/* breadcrumb */}
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#dc2626]" />
                    <span className="text-[9px] font-black text-red-600/70 uppercase tracking-[0.4em]">Neural Ops · Auto-Generated</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">
                            Incident<br />
                            <span className="text-red-600">Tickets</span>
                        </h1>
                        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mt-3">
                            AI-generated pipeline failure reports
                        </p>
                    </div>

                    <div className="flex items-stretch gap-3">
                        <StatPill label="Total" value={stats.total} color="#ffffff" />
                        <StatPill label="Open" value={stats.open} color="#dc2626" />
                        <StatPill label="Escalated" value={stats.escalated} color="#f59e0b" />
                        <StatPill label="Closed" value={stats.closed} color="#10b981" />
                        <button onClick={load} disabled={loading}
                            className="shrink-0 self-stretch px-4 bg-[#0a0a0a] border border-white/[0.06] hover:border-white/20 rounded-2xl text-gray-500 hover:text-white transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center">
                            <svg className={`w-5 h-5 ${loading ? "animate-spin text-red-500" : "group-hover:rotate-180 transition-transform"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── FILTER BAR ──────────────────────────────────────── */}
            <div className="px-8 mb-8">
                <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                    {/* search */}
                    <div className="relative flex-1">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by title, repo, or issue ID…"
                            className="w-full bg-[#0a0a0a] border border-white/[0.06] hover:border-white/10 focus:border-red-600/30 rounded-xl pl-11 pr-5 py-3.5 text-xs text-white placeholder-gray-700 font-mono outline-none transition-colors"
                        />
                    </div>

                    {/* status pills */}
                    <div className="flex gap-2">
                        {[
                            { val: "all", label: "All", count: stats.total },
                            { val: "open", label: "Open", count: stats.open, color: "#dc2626" },
                            { val: "escalated", label: "Escalated", count: stats.escalated, color: "#f59e0b" },
                            { val: "closed", label: "Closed", count: stats.closed, color: "#10b981" },
                        ].map(s => (
                            <button key={s.val} onClick={() => setStatusFilter(s.val)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === s.val
                                    ? "text-white border-white/20 bg-white/8"
                                    : "text-gray-600 border-white/[0.05] bg-[#0a0a0a] hover:border-white/10 hover:text-gray-400"}`}>
                                {s.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />}
                                {s.label}
                                <span className="text-[8px] opacity-60">{s.count}</span>
                            </button>
                        ))}
                    </div>

                    {/* repo filter */}
                    <select value={repoFilter} onChange={e => setRepoFilter(e.target.value)}
                        className="bg-[#0a0a0a] border border-white/[0.06] hover:border-white/10 focus:border-red-600/30 rounded-xl px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-white outline-none transition-colors cursor-pointer min-w-[180px]">
                        <option value="all">All Repos</option>
                        {repos.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            </div>

            {/* ── TICKET GRID ─────────────────────────────────────── */}
            <div className="px-8 pb-16">
                {loading && tickets.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} className="h-48 bg-[#0a0a0a] border border-white/5 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="text-5xl mb-4">⚠️</div>
                        <p className="text-sm font-black text-red-500 uppercase tracking-widest">{error}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 bg-[#080808] border border-dashed border-white/[0.06] rounded-3xl">
                        <div className="text-6xl mb-6 opacity-20">🎫</div>
                        <p className="text-lg font-black text-gray-700 uppercase tracking-tighter italic">No tickets match</p>
                        <p className="text-[10px] text-gray-800 mt-2">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((t, i) => (
                            <TicketCard key={t.id || i} ticket={t} accent={repoColor(t.repoName)} onClick={() => setSelected(t)} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── DETAIL DRAWER ───────────────────────────────────── */}
            <DetailDrawer ticket={selected} onClose={() => setSelected(null)} accent={selectedAccent} />

            {/* ── SYNC TOAST ──────────────────────────────────────── */}
            {toast && (
                <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 ${toast.type === "success"
                        ? "bg-emerald-950/90 border-emerald-600/40 text-emerald-400"
                        : "bg-[#0a0a0a] border-white/10 text-gray-400"
                    }`}>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {toast.msg}
                </div>
            )}
        </div>
    );
};

export default Tickets;
