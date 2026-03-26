'use client';
import React, { useState, useEffect, useRef } from 'react';

const LogViewer = ({ logs, jobName, onClose, loading }) => {
    const [filter, setFilter] = useState('');
    const scrollRef = useRef(null);

    // Simple ANSI color stripper (since we'll use our own highlighting)
    const cleanLogs = (text) => {
        return text.replace(/\x1b\[[0-9;]*m/g, '');
    };

    const lines = cleanLogs(logs || '').split('\n');
    const filteredLines = lines.filter(line =>
        line.toLowerCase().includes(filter.toLowerCase())
    );

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-md">
            <div className="relative w-full max-w-6xl h-full flex flex-col bg-[#050505] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">

                {/* Terminal Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                        </div>
                        <div className="h-4 w-[1px] bg-white/10 mx-2" />
                        <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Terminal :: {jobName || 'Job Logs'}</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{lines.length} Lines Processed</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="FILTER_LOGS..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-full px-5 py-2 text-[10px] font-bold text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50 transition-all w-48 group-hover:w-64"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-black">CTRL+F</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-600/20 hover:text-red-500 transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Log Content */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-8 font-mono text-[11px] leading-relaxed custom-scrollbar selection:bg-red-600/30"
                >
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 gap-6">
                            <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                            <p className="uppercase tracking-widest font-black text-[10px] text-gray-600 animate-pulse">Establishing Secure Stream...</p>
                        </div>
                    ) : filteredLines.map((line, i) => {
                        const isError = /error|fail|fatal|denied|exception/i.test(line);
                        const isWarning = /warn|caution/i.test(line);
                        const isStep = /##\[[a-z]+\]/i.test(line);

                        return (
                            <div key={i} className={`flex gap-6 py-0.5 px-4 -mx-4 group hover:bg-white/[0.02] transition-colors ${isError ? 'bg-red-500/5 text-red-400 font-medium' :
                                isWarning ? 'text-amber-300' :
                                    isStep ? 'text-blue-400 font-black uppercase' :
                                        'text-gray-400'
                                }`}>
                                <span className="w-12 text-right text-white/10 select-none group-hover:text-white/30 shrink-0 tabular-nums">
                                    {i + 1}
                                </span>
                                <span className="break-all whitespace-pre-wrap">
                                    {line || ' '}
                                </span>
                            </div>
                        );
                    })}

                    {filteredLines.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-gray-600 opacity-20 italic">
                            <p className="text-4xl mb-4">🔍</p>
                            <p className="font-bold uppercase tracking-widest text-sm">No matches found for "{filter}"</p>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="px-8 py-3 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Connection Stable</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Encoding: UTF-8</span>
                        </div>
                    </div>
                    <p className="text-[9px] font-black text-red-600/40 uppercase tracking-[0.4em]">Integrated Intelligence Mode :: active</p>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(220, 38, 38, 0.2);
                }
            `}</style>
        </div>
    );
};

export default LogViewer;
