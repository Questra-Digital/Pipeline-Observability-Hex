'use client';
import { useState, useEffect, useCallback } from 'react';
import instance from '@/axios/axios';

// Severity configs
const SEVERITY = {
    critical: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', badge: 'bg-red-500', label: '● CRITICAL' },
    warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', badge: 'bg-amber-500', label: '▲ WARNING' },
    info: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', badge: 'bg-blue-500', label: '◆ INFO' },
};

const CATEGORY_ICONS = {
    'Missing ENV Variable / Secret': '🔑',
    'Dependency Failure': '📦',
    'Permission / Authentication Error': '🔐',
    'Timeout': '⏱️',
    'Out of Memory': '💀',
    'Network Error': '🌐',
    'Docker / Container Error': '🐳',
    'Test Failure': '🧪',
    'Build / Compile Error': '⚙️',
    'Runner / Workflow Configuration Error': '🔧',
    'Unknown Error': '❓',
};

const ConfidenceBar = ({ confidence }) => {
    const pct = Math.round(confidence * 100);
    const color = pct >= 80 ? 'from-red-600 to-red-400' : pct >= 60 ? 'from-amber-500 to-amber-400' : 'from-blue-600 to-blue-400';
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-black text-white tabular-nums">{pct}%</span>
        </div>
    );
};

const FindingCard = ({ finding, isPrimary }) => {
    const [expanded, setExpanded] = useState(isPrimary);
    const sev = SEVERITY[finding.severity] || SEVERITY.info;
    const icon = CATEGORY_ICONS[finding.category] || '🔍';

    return (
        <div className={`rounded-3xl border ${sev.border} ${sev.bg} overflow-hidden transition-all duration-500`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-4 p-6 text-left hover:opacity-80 transition-opacity"
            >
                <span className="text-3xl">{icon}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`text-[8px] font-black uppercase tracking-[0.3em] px-2 py-0.5 rounded ${sev.badge} text-white`}>
                            {sev.label}
                        </span>
                        {isPrimary && (
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] px-2 py-0.5 rounded bg-white/10 text-white/60">
                                PRIMARY CAUSE
                            </span>
                        )}
                    </div>
                    <h4 className="text-base font-black text-white tracking-tight">{finding.category}</h4>
                    <div className="mt-2">
                        <ConfidenceBar confidence={finding.confidence} />
                    </div>
                </div>
                <div className="text-gray-600 shrink-0">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d={expanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
                    </svg>
                </div>
            </button>

            {expanded && (
                <div className="px-6 pb-6 space-y-6 border-t border-white/5 pt-6">
                    {/* Evidence Panel */}
                    {finding.evidence && finding.evidence.length > 0 && (
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 mb-3">📋 Evidence — Log Extract</p>
                            <div className="bg-black/60 rounded-2xl p-4 border border-white/5 overflow-x-auto">
                                <pre className="text-[10px] text-gray-400 font-mono leading-relaxed whitespace-pre-wrap break-words">
                                    {finding.evidence.map((line, i) => {
                                        const isError = /error|fail|fatal|denied|timeout/i.test(line);
                                        return (
                                            <span key={i} className={`block ${isError ? 'text-red-400 font-bold bg-red-500/5 -mx-4 px-4' : ''}`}>
                                                <span className="text-white/20 select-none mr-2">{String(i + 1).padStart(3)}</span>
                                                {line}
                                            </span>
                                        );
                                    })}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Dynamic Remediation */}
                    {finding.remediation && (
                        <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-3">🛠️ How to Fix</p>
                            <p className="text-sm text-gray-300 leading-relaxed font-medium">{finding.remediation}</p>
                        </div>
                    )}

                    {/* Matched Lines */}
                    {finding.matchedLines && finding.matchedLines.length > 0 && (
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 mb-3">🎯 Pattern Match Signals</p>
                            <div className="flex flex-wrap gap-2">
                                {finding.matchedLines.slice(0, 5).map((ml, i) => (
                                    <code key={i} className="text-[9px] bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg text-gray-400 font-mono truncate max-w-[280px]">
                                        {ml.length > 60 ? ml.slice(0, 60) + '…' : ml}
                                    </code>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const TimelineView = ({ timeline }) => {
    if (!timeline || timeline.length === 0) return null;
    return (
        <div className="space-y-1">
            {timeline.map((entry, i) => {
                const isFirst = i === 0 || timeline[i - 1].jobName !== entry.jobName;
                return (
                    <div key={i}>
                        {isFirst && (
                            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-700 mt-4 mb-2 first:mt-0">
                                {entry.jobName}
                            </p>
                        )}
                        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${entry.isFailed ? 'bg-red-500/5 border-red-500/20' :
                            entry.isLastSuccess ? 'bg-amber-500/5 border-amber-500/20' :
                                'bg-white/[0.02] border-white/5'
                            }`}>
                            <div className={`w-2 h-2 rounded-full shrink-0 ${entry.isFailed ? 'bg-red-500' : entry.status === 'success' ? 'bg-emerald-500' : 'bg-gray-600'
                                }`} />
                            <span className={`text-[10px] font-bold flex-1 ${entry.isFailed ? 'text-red-400' : entry.isLastSuccess ? 'text-amber-400' : 'text-gray-500'}`}>
                                {entry.stepName}
                            </span>
                            <div className="flex items-center gap-2">
                                {entry.isFailed && <span className="text-[8px] font-black text-red-500 uppercase tracking-wider">FAILED</span>}
                                {entry.isLastSuccess && <span className="text-[8px] font-black text-amber-500 uppercase tracking-wider">LAST OK</span>}
                                {entry.durationSec > 0 && (
                                    <span className="text-[9px] text-gray-700 font-mono tabular-nums">
                                        {entry.durationSec >= 60
                                            ? `${Math.floor(entry.durationSec / 60)}m ${Math.round(entry.durationSec % 60)}s`
                                            : `${entry.durationSec.toFixed(1)}s`}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const RCAPanel = ({ run, owner, repo, onClose, onViewLogs }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('diagnosis');

    const fetchRCA = useCallback(async () => {
        if (!run?.runId) return;
        setLoading(true);
        setError(null);
        try {
            const token = JSON.parse(localStorage.getItem('userData')).token;
            const res = await instance.get(
                `/api/github/rca?runId=${run.runId}&owner=${owner}&repo=${repo}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.status === 200) setData(res.data);
            else setError('Failed to analyze run logs.');
        } catch (e) {
            setError(e?.response?.data?.error || 'Analysis failed. The run logs may have expired on GitHub.');
        } finally {
            setLoading(false);
        }
    }, [run, owner, repo]);

    useEffect(() => {
        fetchRCA();
    }, [fetchRCA]);

    const tabs = [
        { id: 'diagnosis', label: 'Diagnosis', icon: '🧠' },
        { id: 'timeline', label: 'Timeline', icon: '⏱️' },
        { id: 'anomalies', label: `Anomalies${data?.anomalies?.length ? ` (${data.anomalies.length})` : ''}`, icon: '⚠️' },
        { id: 'fingerprint', label: 'Fingerprint', icon: '🧬' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-lg p-4 md:p-8">
            <div className="relative w-full max-w-4xl my-auto">
                {/* Background glow */}
                <div className="absolute -inset-4 bg-red-600/5 blur-3xl rounded-full pointer-events-none" />

                <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)]">
                    {/* Scan line animation */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/60 to-transparent" />

                    {/* ── HEADER ── */}
                    <div className="p-8 border-b border-white/5 flex items-start justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-[18px] bg-red-600/10 border border-red-600/20 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.1)]">
                                <span className="text-2xl">🧠</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Root Cause Analysis</h2>
                                    {data?.fromCache && (
                                        <span className="text-[8px] font-black px-2 py-0.5 rounded bg-white/5 text-gray-500 uppercase tracking-widest">CACHED</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">
                                    {owner}/{repo} · Run #{run?.runId}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
                        >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-32 gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-2 border-red-600/20" />
                                <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-t-red-600 animate-spin" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-white uppercase tracking-widest mb-1">Analyzing Pipeline</p>
                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Fetching logs → Running pattern engine</p>
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && !loading && (
                        <div className="p-8 flex flex-col items-center justify-center py-24 gap-4">
                            <span className="text-5xl">⚠️</span>
                            <p className="text-red-400 font-bold text-center max-w-sm">{error}</p>
                            <button onClick={fetchRCA} className="px-6 py-3 rounded-full bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-600/20 transition-colors">
                                Retry Analysis
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    {data && !loading && (
                        <>
                            {/* ── SUMMARY BANNER ── */}
                            {data.primary && (
                                <div className="mx-6 mt-6 p-6 bg-red-600/5 border border-red-600/10 rounded-3xl">
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-red-500 mb-2">DIAGNOSIS SUMMARY</p>
                                    <p className="text-sm font-bold text-gray-200 leading-relaxed">{data.summary}</p>
                                </div>
                            )}

                            {/* ── TAB BAR ── */}
                            <div className="px-6 mt-6 flex gap-2 border-b border-white/5 pb-0">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-t-2xl border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.id
                                            ? 'text-white border-red-600 bg-white/[0.03]'
                                            : 'text-gray-600 border-transparent hover:text-gray-400'
                                            }`}
                                    >
                                        <span>{tab.icon}</span> {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 space-y-4">
                                {/* ── DIAGNOSIS TAB ── */}
                                {activeTab === 'diagnosis' && (
                                    <>
                                        {data.primary && <FindingCard finding={data.primary} isPrimary={true} />}
                                        {data.secondary && data.secondary.length > 0 && (
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-700 my-4">⚡ Secondary Findings</p>
                                                <div className="space-y-3">
                                                    {data.secondary.map((f, i) => <FindingCard key={i} finding={f} isPrimary={false} />)}
                                                </div>
                                            </div>
                                        )}
                                        {!data.primary && (
                                            <div className="text-center py-16 text-gray-600">
                                                <span className="text-5xl block mb-4">🔍</span>
                                                <p className="font-bold uppercase tracking-widest text-sm">No patterns detected</p>
                                                <p className="text-[10px] mt-2">The pipeline may have failed for an infrastructure reason not reflected in logs.</p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* ── TIMELINE TAB ── */}
                                {activeTab === 'timeline' && (
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 mb-4">Step-by-step execution timeline</p>
                                        {data.timeline && data.timeline.length > 0
                                            ? <TimelineView timeline={data.timeline} />
                                            : <p className="text-gray-600 text-center py-12 text-sm">No timeline data available for this run.</p>
                                        }
                                    </div>
                                )}

                                {/* ── ANOMALIES TAB ── */}
                                {activeTab === 'anomalies' && (
                                    <div className="space-y-4">
                                        {data.anomalies && data.anomalies.length > 0
                                            ? data.anomalies.map((a, i) => {
                                                const sev = SEVERITY[a.severity] || SEVERITY.info;
                                                return (
                                                    <div key={i} className={`p-5 rounded-3xl border ${sev.border} ${sev.bg}`}>
                                                        <div className="flex items-start gap-4">
                                                            <span className="text-2xl">{a.type === 'large_log' ? '📜' : a.type === 'retry_storm' ? '🔁' : a.type === 'repeating_error' ? '💀' : '⚡'}</span>
                                                            <div>
                                                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${sev.color}`}>{a.type.replace(/_/g, ' ')}</p>
                                                                <p className="text-sm text-gray-300">{a.description}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                            : <p className="text-center text-gray-600 py-12 text-sm">No log anomalies detected. System behavior appears nominal.</p>
                                        }
                                    </div>
                                )}

                                {/* ── FINGERPRINT TAB ── */}
                                {activeTab === 'fingerprint' && data.fingerprint && (
                                    <div className="space-y-4">
                                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 mb-6">Error Fingerprint Analysis</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                <div className="text-center p-4 bg-white/[0.02] rounded-2xl">
                                                    <p className="text-4xl font-black text-red-500">{data.fingerprint.seenCount || 1}</p>
                                                    <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mt-1">Times Seen</p>
                                                </div>
                                                <div className="text-center p-4 bg-white/[0.02] rounded-2xl">
                                                    <p className="text-2xl font-black text-white">{data.fingerprint.repos?.length || 1}</p>
                                                    <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mt-1">Repos Affected</p>
                                                </div>
                                                <div className="col-span-2 text-center p-4 bg-white/[0.02] rounded-2xl">
                                                    <p className="text-xs font-mono text-gray-500">{data.fingerprint.hash}</p>
                                                    <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mt-1">Error Hash (MD5)</p>
                                                </div>
                                            </div>
                                            {data.fingerprint.seenCount > 1 && (
                                                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                                    <p className="text-sm text-red-400 font-bold">
                                                        ⚡ This exact error pattern has appeared <span className="font-black text-red-300">{data.fingerprint.seenCount} times</span> across your pipelines.
                                                    </p>
                                                </div>
                                            )}
                                            {data.fingerprint.repos && data.fingerprint.repos.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 mb-3">Affected Repos</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {data.fingerprint.repos.map((r, i) => (
                                                            <span key={i} className="text-[10px] bg-white/5 text-gray-400 px-3 py-1.5 rounded-full border border-white/5 font-mono">{r}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-white/5 flex justify-between items-center">
                        <p className="text-[8px] text-gray-700 font-black uppercase tracking-[0.6em]">VIZOPS · RCA ENGINE v2.0</p>
                        <div className="flex items-center gap-4">
                            {onViewLogs && (
                                <button
                                    onClick={onViewLogs}
                                    className="px-6 py-2.5 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                                >
                                    View Full Logs
                                </button>
                            )}
                            <button onClick={onClose} className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-white/10 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RCAPanel;
