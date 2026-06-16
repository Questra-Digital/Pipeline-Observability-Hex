"use client";
import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/axios/axios";

/* ─── Auth helper ─────────────────────────────────────────────── */
const authCfg = () => {
    try {
        const t = JSON.parse(localStorage.getItem("userData"))?.token;
        return { headers: { Authorization: `Bearer ${t}` } };
    } catch { return {}; }
};
const api = {
    get: (u) => axiosInstance.get(u, authCfg()),
    post: (u, d) => axiosInstance.post(u, d, authCfg()),
    delete: (u) => axiosInstance.delete(u, authCfg()),
};

/* ─── Theme tokens ────────────────────────────────────────────── */
const C = { red: "#dc2626", amber: "#f59e0b", green: "#10b981", blue: "#3b82f6", purple: "#8b5cf6" };

/* ─── Primitive components ────────────────────────────────────── */
const Btn = ({ children, onClick, disabled, variant = "primary", size = "md", loading = false, full = false }) => {
    const s = { sm: "px-3 py-2 text-[9px]", md: "px-5 py-3 text-[10px]", lg: "px-6 py-3.5 text-xs" };
    const v = {
        primary: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20",
        ghost: "bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 border border-white/[0.08] hover:text-white",
        danger: "bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-600/20",
        success: "bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-600/20",
        warning: "bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 border border-amber-600/20",
        blue: "bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-600/20",
    };
    return (
        <button onClick={onClick} disabled={disabled || loading}
            className={`${full ? "w-full" : ""} flex items-center justify-center gap-2 font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${s[size]} ${v[variant]}`}>
            {loading && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {children}
        </button>
    );
};

const Field = ({ label, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</label>
        {children}
    </div>
);

const inputCls = "bg-[#080808] border border-white/[0.08] hover:border-white/[0.12] focus:border-red-600/30 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-800 outline-none transition-colors font-mono w-full";

const Input = ({ label, value, onChange, placeholder, type = "text" }) => (
    <Field label={label}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </Field>
);

const Sel = ({ label, value, onChange, options }) => (
    <Field label={label}>
        <select value={value} onChange={e => onChange(e.target.value)} className={inputCls + " cursor-pointer"}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </Field>
);

const Panel = ({ children, accent = C.red, className = "" }) => (
    <div className={`relative bg-[#0a0a0a] border border-white/[0.06] rounded-3xl overflow-hidden ${className}`}>
        <div className="absolute top-0 left-0 w-full h-[1px]"
            style={{ background: `linear-gradient(90deg,transparent,${accent}50,transparent)` }} />
        <div className="p-6">{children}</div>
    </div>
);

const PanelHead = ({ title, badge, badgeColor = C.red, sub }) => (
    <div className="mb-5">
        <div className="flex items-center gap-3">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">{title}</h3>
            {badge && (
                <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border"
                    style={{ color: badgeColor, borderColor: `${badgeColor}35`, background: `${badgeColor}10` }}>
                    {badge}
                </span>
            )}
        </div>
        {sub && <p className="text-[10px] text-gray-700 font-mono mt-1">{sub}</p>}
    </div>
);

const Toast = ({ msg, type = "success", dismiss }) => {
    const cols = { success: C.green, error: C.red, warning: C.amber, info: C.blue };
    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border text-xs font-black uppercase tracking-widest shadow-2xl animate-in slide-in-from-bottom-3 duration-300 bg-[#0a0a0a]"
            style={{ borderColor: `${cols[type]}35`, color: cols[type] }}>
            {msg}
            <button onClick={dismiss} className="ml-2 opacity-50 hover:opacity-100 text-base leading-none">×</button>
        </div>
    );
};

const fmtDate = d => { try { return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

/* ─── Repo selector (uses connected repos from API) ──────────── */
const useConnectedRepos = () => {
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/api/github/repos").then(r => {
            const flat = [];
            (r.data || []).forEach(acc => {
                (acc.repositories || []).forEach(repo => {
                    if (repo.enabled) flat.push({ accountId: acc.id, owner: repo.owner || acc.owner, name: repo.name, fullName: repo.fullName || `${acc.owner}/${repo.name}`, label: `${acc.name || acc.owner} / ${repo.name}` });
                });
            });
            setRepos(flat);
        }).catch(() => setRepos([])).finally(() => setLoading(false));
    }, []);

    return { repos, loading };
};

const RepoSel = ({ label, onSelect, value }) => {
    const { repos, loading } = useConnectedRepos();
    const opts = [{ value: "", label: loading ? "Loading repos…" : repos.length ? "Select a connected repo…" : "No repos connected" },
    ...repos.map(r => ({ value: r.fullName, label: r.label }))];
    return (
        <Sel label={label} value={value}
            onChange={v => {
                const r = repos.find(x => x.fullName === v);
                if (r) onSelect(r);
            }}
            options={opts}
        />
    );
};

/* ──────────────────────────────────────────────────────────────── */
/* TAB 1: WORKFLOW DISPATCH                                        */
/* ──────────────────────────────────────────────────────────────── */
function DispatchTab() {
    const [sel, setSel] = useState({ accountId: "", owner: "", name: "" });
    const [workflows, setWorkflows] = useState([]);
    const [summaries, setSummaries] = useState([]);
    const [wfId, setWfId] = useState("");
    const [ref, setRef] = useState("main");
    const [inputsRaw, setInputsRaw] = useState("{}");
    const [loading, setLoading] = useState(false);
    const [dispatching, setDispatching] = useState(false);
    const [retrying, setRetrying] = useState({});
    const [toast, setToast] = useState(null);
    const t = (m, ty = "success") => { setToast({ m, ty }); setTimeout(() => setToast(null), 4000); };

    const loadAutomations = async (r) => {
        const repo = r || sel;
        if (!repo.accountId) return;
        setLoading(true);
        try {
            // 1. Load dispatchable workflows (requires YAML trigger)
            const { data: wfs } = await api.get(`/api/github/workflows?accountId=${repo.accountId}&owner=${repo.owner}&repo=${repo.name}`);
            setWorkflows(wfs || []);
            if (wfs?.length) setWfId(String(wfs[0].id));

            // 2. Load latest runs per workflow (Zero-setup Re-Run mode)
            const { data: sums } = await api.get(`/api/github/workflow-summary?accountId=${repo.accountId}&repo=${repo.name}`);
            setSummaries(sums || []);
        } catch (e) {
            console.error(e);
            t(e?.response?.data?.error || "Failed to load workflow data", "error");
        } finally { setLoading(false); }
    };

    const dispatch = async () => {
        if (!wfId) { t("Select a workflow from the list below", "error"); return; }
        let inputs = {};
        try { inputs = JSON.parse(inputsRaw); } catch { t("Inputs must be valid JSON", "error"); return; }
        setDispatching(true);
        try {
            await api.post("/api/github/dispatch", { accountId: sel.accountId, owner: sel.owner, repo: sel.name, workflowId: parseInt(wfId, 10), ref, inputs });
            t(`Successfully dispatched on "${ref}" ✓`);
            setTimeout(() => loadAutomations(sel), 2000);
        } catch (e) { t(e?.response?.data?.error || "Dispatch failed", "error"); }
        finally { setDispatching(false); }
    };

    const rerun = async (sum) => {
        setRetrying(p => ({ ...p, [sum.runId]: true }));
        try {
            await api.post("/api/github/retry", { accountId: sel.accountId, owner: sum.repoOwner, repo: sum.repoName, runId: sum.runId });
            t(`Re-run started for ${sum.workflowName} ✓`);
            setTimeout(() => loadAutomations(sel), 2000);
        } catch (e) { t(e?.response?.data?.error || "Re-run failed", "error"); }
        finally { setRetrying(p => ({ ...p, [sum.runId]: false })); }
    };

    return (
        <div className="space-y-5">
            <Panel accent={C.red}>
                <PanelHead title="Workflow Dispatch Agent" badge="Agent Control"
                    sub="Zero-setup re-runs or custom dispatch triggers for any connected repository." />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <RepoSel label="Active Repository" value={sel.fullName || ""}
                        onSelect={r => { setSel(r); setWorkflows([]); setSummaries([]); setWfId(""); loadAutomations(r); }} />
                    <Input label="Target Branch / Ref" value={ref} onChange={setRef} placeholder="main" />
                </div>

                {!sel.accountId ? (
                    <div className="py-10 text-center border border-dashed border-white/5 rounded-2xl bg-black/20">
                        <p className="text-gray-600 text-[10px] uppercase tracking-widest font-black">Select a repository to begin</p>
                    </div>
                ) : loading ? (
                    <div className="py-10 text-center">
                        <div className="animate-pulse text-red-500 font-black text-[10px] uppercase tracking-widest">Scanning Workflows...</div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* 1. Zero-Setup Re-Run Section */}
                        <section>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                                <span className="p-1 px-2 rounded bg-white/5 text-emerald-500">Mode A</span>
                                Quick Re-Run (No Setup Required)
                            </h4>
                            {summaries.length === 0 ? (
                                <p className="text-[10px] text-gray-700 font-mono italic">No previous runs found for this repo.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {summaries.map(s => (
                                        <div key={s.runId} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-white mb-0.5">{s.workflowName}</span>
                                                <span className="text-[9px] text-gray-600 font-mono">Last status: <span style={{ color: s.conclusion === "success" ? C.green : C.red }}>{s.conclusion || s.status}</span> • {new Date(s.updatedAt).toLocaleString()}</span>
                                            </div>
                                            <button
                                                onClick={() => rerun(s)}
                                                disabled={retrying[s.runId]}
                                                className="px-4 py-2 rounded-lg bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50">
                                                {retrying[s.runId] ? "Queueing..." : "⚡ Re-Run"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* 2. Custom Dispatch Section */}
                        <section className="border-t border-white/5 pt-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                                <span className="p-1 px-2 rounded bg-white/5 text-red-500">Mode B</span>
                                Custom Dispatch (Requires workflow_dispatch trigger)
                            </h4>
                            {workflows.length === 0 ? (
                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-500/80 text-[10px] font-mono leading-relaxed">
                                    No `workflow_dispatch` triggers found in this repo's YAML files.<br />
                                    Use Mode A above for instant re-runs of existing pipelines.
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex flex-wrap gap-2">
                                        {workflows.map(w => (
                                            <button key={w.id} onClick={() => setWfId(String(w.id))}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${wfId === String(w.id) ? "border-red-600/40 bg-red-600/10 text-red-400" : "border-white/[0.05] text-gray-600 hover:border-white/10 hover:text-white bg-[#080808]"}`}>
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: w.state === "active" ? C.green : C.amber }} />
                                                {w.name}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-4">
                                        <Input label="Dispatch Inputs (Optional JSON)" value={inputsRaw} onChange={setInputsRaw} placeholder='{"env": "staging"}' />
                                        <Btn onClick={dispatch} loading={dispatching} size="lg" disabled={!wfId}>🚀 Fire Dispatch Trigger</Btn>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </Panel>
            {toast && <Toast msg={toast.m} type={toast.ty} dismiss={() => setToast(null)} />}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/* TAB 2: RUN CONTROL                                              */
/* ──────────────────────────────────────────────────────────────── */
function RunControlTab() {
    const [selRepo, setSelRepo] = useState({ accountId: "", owner: "", name: "" });
    const [runs, setRuns] = useState([]);
    const [loadingRuns, setLoadingRuns] = useState(false);
    const [busy, setBusy] = useState({});
    const [toast, setToast] = useState(null);
    const t = (m, ty = "success") => { setToast({ m, ty }); setTimeout(() => setToast(null), 4000); };

    const fetchRuns = useCallback(async () => {
        setLoadingRuns(true);
        try {
            const p = selRepo.name ? `?repo=${selRepo.name}` : "?limit=40";
            const { data } = await api.get(`/api/github/runs${p}`);
            setRuns(data || []);
        } catch { t("Failed to load runs", "error"); }
        finally { setLoadingRuns(false); }
    }, [selRepo.name]);

    useEffect(() => { fetchRuns(); }, [fetchRuns]);

    const act = async (action, run) => {
        if (!selRepo.accountId) { t("Select a repository first to authorize actions", "warning"); return; }
        const key = run.runId + action;
        setBusy(p => ({ ...p, [key]: true }));
        try {
            const endpoint = { cancel: "/api/github/cancel", retry: "/api/github/retry", "retry-failed": "/api/github/retry-failed" }[action];
            await api.post(endpoint, { accountId: selRepo.accountId, owner: run.repoOwner || selRepo.owner, repo: run.repoName || selRepo.name, runId: run.runId });
            t(action === "cancel" ? "Cancel requested ✓" : "Re-queued ✓");
            setTimeout(fetchRuns, 2500);
        } catch (e) { t(e?.response?.data?.error || `${action} failed`, "error"); }
        finally { setBusy(p => { const n = { ...p }; delete n[key]; return n; }); }
    };

    const active = runs.filter(r => r.status === "in_progress" || r.status === "queued");
    const failed = runs.filter(r => r.conclusion === "failure").slice(0, 20);

    const RunRow = ({ r, actions }) => (
        <div className="flex items-center gap-4 px-5 py-3.5 bg-[#080808] rounded-2xl border border-white/[0.05] hover:border-white/[0.09] transition-all">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{r.workflowName}</p>
                <p className="text-[9px] text-gray-700 font-mono truncate mt-0.5">
                    {r.repoOwner}/{r.repoName} · #{r.runId} · {fmtDate(r.updatedAt)}
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <a href={r.htmlUrl} target="_blank" rel="noreferrer"
                    className="text-[9px] font-black text-gray-700 hover:text-white uppercase tracking-widest transition-colors">↗</a>
                {actions}
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
            {/* Repo selector */}
            <Panel accent={C.blue}>
                <PanelHead title="Run Control Agent" badge="Real-Time" badgeColor={C.blue}
                    sub="Cancel wasted CI runs or retry failures — without leaving this dashboard." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RepoSel label="Authorize Actions As" value={selRepo.fullName || ""} onSelect={r => setSelRepo(r)} />
                    <div className="flex items-end">
                        <Btn onClick={fetchRuns} variant="ghost" loading={loadingRuns}>Refresh Runs</Btn>
                    </div>
                </div>
                {selRepo.accountId && (
                    <p className="text-[9px] font-mono text-emerald-600 mt-3">● Authorized as {selRepo.owner}/{selRepo.name}</p>
                )}
            </Panel>

            {/* Active */}
            <Panel accent={C.amber}>
                <PanelHead title="Active Runs" badge={`${active.length} live`} badgeColor={C.amber}
                    sub="In-progress / queued — cancel to reclaim runner minutes." />
                {active.length === 0
                    ? <p className="text-[10px] text-gray-800 font-mono">No active runs.</p>
                    : <div className="space-y-2">{active.map(r => (
                        <RunRow key={r.runId} r={r} actions={
                            <Btn size="sm" variant="danger" loading={busy[r.runId + "cancel"]}
                                onClick={() => act("cancel", r)}>Cancel</Btn>
                        } />
                    ))}</div>
                }
            </Panel>

            {/* Failed */}
            <Panel accent={C.red}>
                <PanelHead title="Failed Runs" badge={`${failed.length} failures`} badgeColor={C.red}
                    sub="Retry only failed jobs (saves compute) or requeue all jobs." />
                {failed.length === 0
                    ? <p className="text-[10px] text-gray-800 font-mono">No recent failures.</p>
                    : <div className="space-y-2">{failed.map(r => (
                        <RunRow key={r.runId} r={r} actions={<>
                            <Btn size="sm" variant="warning" loading={busy[r.runId + "retry-failed"]}
                                onClick={() => act("retry-failed", r)}>Retry Failed</Btn>
                            <Btn size="sm" variant="ghost" loading={busy[r.runId + "retry"]}
                                onClick={() => act("retry", r)}>Retry All</Btn>
                        </>} />
                    ))}</div>
                }
            </Panel>
            {toast && <Toast msg={toast.m} type={toast.ty} dismiss={() => setToast(null)} />}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/* TAB 3: WEBHOOK AGENT                                            */
/* ──────────────────────────────────────────────────────────────── */
function WebhooksTab() {
    const [list, setList] = useState([]);
    const [busy, setBusy] = useState({});
    const [form, setForm] = useState({ label: "", url: "", events: "failure", format: "generic" });
    const [creating, setCreating] = useState(false);
    const [toast, setToast] = useState(null);
    const t = (m, ty = "success") => { setToast({ m, ty }); setTimeout(() => setToast(null), 4000); };

    const load = useCallback(() => api.get("/api/github/webhooks").then(r => setList(r.data || [])).catch(() => setList([])), []);
    useEffect(() => { load(); }, [load]);

    const create = async () => {
        if (!form.label || !form.url) { t("Label and URL required", "error"); return; }
        setCreating(true);
        try {
            await api.post("/api/github/webhooks", { label: form.label, url: form.url, events: form.events === "all" ? ["failure", "success", "all"] : [form.events], format: form.format });
            t("Webhook created ✓");
            setForm({ label: "", url: "", events: "failure", format: "generic" });
            load();
        } catch (e) { t(e?.response?.data?.error || "Failed", "error"); }
        finally { setCreating(false); }
    };

    const test = async (id) => {
        setBusy(p => ({ ...p, [id + "t"]: true }));
        try {
            const { data } = await api.post(`/api/github/webhooks/${id}/test`);
            t(data.message || "Test delivered ✓");
        } catch (e) { t(e?.response?.data?.error || "Test failed", "error"); }
        finally { setBusy(p => { const n = { ...p }; delete n[id + "t"]; return n; }); }
    };

    const del = async (id) => {
        setBusy(p => ({ ...p, [id + "d"]: true }));
        try { await api.delete(`/api/github/webhooks/${id}`); t("Deleted"); load(); }
        catch { t("Delete failed", "error"); }
        finally { setBusy(p => { const n = { ...p }; delete n[id + "d"]; return n; }); }
    };

    const eventColor = e => ({ failure: C.red, success: C.green, all: C.blue }[e] || C.purple);

    return (
        <div className="space-y-5">
            <Panel accent={C.green}>
                <PanelHead title="Webhook Alert Agent" badge="Auto-Delivery" badgeColor={C.green}
                    sub="VizOps POSTs structured JSON payloads to your endpoints on every failure. Slack Block Kit supported." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <Input label="Label" value={form.label} onChange={v => setForm(p => ({ ...p, label: v }))} placeholder="My Slack #alerts" />
                    <Input label="Webhook URL" value={form.url} onChange={v => setForm(p => ({ ...p, url: v }))} placeholder="https://hooks.slack.com/…" />
                    <Sel label="Events" value={form.events} onChange={v => setForm(p => ({ ...p, events: v }))} options={[
                        { value: "failure", label: "Failures only" },
                        { value: "success", label: "Successes only" },
                        { value: "all", label: "All events" },
                    ]} />
                    <Sel label="Payload Format" value={form.format} onChange={v => setForm(p => ({ ...p, format: v }))} options={[
                        { value: "generic", label: "Generic JSON" },
                        { value: "slack", label: "Slack Block Kit" },
                    ]} />
                </div>
                <Btn onClick={create} loading={creating}>Add Endpoint</Btn>
            </Panel>

            <Panel>
                <PanelHead title="Configured Endpoints" badge={`${list.length} active`} />
                {list.length === 0
                    ? <p className="text-[10px] text-gray-800 font-mono">No webhooks yet. Add one above.</p>
                    : <div className="space-y-3">{list.map(w => (
                        <div key={w.id} className="flex items-center gap-4 p-4 bg-[#080808] rounded-2xl border border-white/[0.05]">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <p className="text-xs font-black text-white">{w.label}</p>
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-600/25 text-blue-500 bg-blue-600/8">{w.format}</span>
                                    {(w.events || []).map(e => (
                                        <span key={e} className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border"
                                            style={{ color: eventColor(e), borderColor: `${eventColor(e)}30`, background: `${eventColor(e)}10` }}>{e}</span>
                                    ))}
                                </div>
                                <p className="text-[9px] text-gray-700 font-mono truncate">{w.url}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Btn size="sm" variant="success" loading={busy[w.id + "t"]} onClick={() => test(w.id)}>Test</Btn>
                                <Btn size="sm" variant="danger" loading={busy[w.id + "d"]} onClick={() => del(w.id)}>Delete</Btn>
                            </div>
                        </div>
                    ))}</div>
                }
            </Panel>
            {toast && <Toast msg={toast.m} type={toast.ty} dismiss={() => setToast(null)} />}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/* TAB 4: FAILURE WATCHDOG                                         */
/* ──────────────────────────────────────────────────────────────── */
function WatchdogTab() {
    const [escalations, setEscalations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Try sync first (reconciles with GitHub, slower)
            const r = await api.get("/api/github/tickets/sync");
            setEscalations((r.data.tickets || []).filter(t => t.status === "escalated"));
        } catch {
            // Fallback: fetch tickets directly without sync (faster)
            try {
                const r = await api.get("/api/github/tickets");
                setEscalations((r.data || []).filter(t => t.status === "escalated"));
            } catch {
                setError("Failed to load escalations");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-5">
            <Panel accent={C.amber}>
                <PanelHead title="Consecutive Failure Watchdog" badge="Auto-Escalate" badgeColor={C.amber}
                    sub="When the same workflow fails 3 times in a row, VizOps auto-creates a critical GitHub Issue and fires all webhooks at severity=critical." />
                <div className="grid grid-cols-3 gap-4 mt-5">
                    {[{ icon: "🎯", label: "Threshold", val: "3 consecutive" },
                    { icon: "⚡", label: "Action", val: "Issue + Webhooks" },
                    { icon: "🚨", label: "Severity", val: "Critical" }].map(s => (
                        <div key={s.label} className="bg-[#080808] rounded-2xl p-5 border border-amber-600/10 text-center">
                            <div className="text-2xl mb-2">{s.icon}</div>
                            <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest">{s.label}</p>
                            <p className="text-[10px] text-amber-400 font-black mt-1">{s.val}</p>
                        </div>
                    ))}
                </div>
            </Panel>

            <Panel>
                <div className="flex items-center justify-between mb-5">
                    <PanelHead title="Escalation Log" badge={loading ? "…" : `${escalations.length} events`} badgeColor={C.amber} />
                    <Btn size="sm" variant="ghost" onClick={load} loading={loading}>Refresh</Btn>
                </div>
                {loading ? <p className="text-[10px] text-gray-800 font-mono">Syncing with GitHub…</p>
                    : error ? (
                        <div className="flex flex-col items-center py-10 opacity-50">
                            <span className="text-3xl mb-3">⚠️</span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{error}</p>
                        </div>
                    ) : escalations.length === 0 ? (
                        <div className="flex flex-col items-center py-16 opacity-30">
                            <span className="text-4xl mb-3">🛡️</span>
                            <p className="text-[10px] font-black uppercase tracking-widest">No escalations yet — watchdog is monitoring</p>
                        </div>
                    ) : <div className="space-y-3">{escalations.map(e => (
                        <div key={e.id} className="flex items-center gap-4 p-4 bg-[#080808] rounded-2xl border border-amber-600/10">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-amber-400 truncate">🚨 {e.title}</p>
                                <p className="text-[9px] text-gray-700 font-mono mt-0.5">{e.repoOwner}/{e.repoName} · Issue #{e.issueNumber} · {fmtDate(e.createdAt)}</p>
                            </div>
                            <a href={e.issueUrl} target="_blank" rel="noreferrer"
                                className="shrink-0 px-3 py-2 bg-amber-900/20 border border-amber-600/20 rounded-xl text-[9px] font-black text-amber-400 uppercase tracking-widest hover:bg-amber-900/40 transition-all">
                                View ↗
                            </a>
                        </div>
                    ))}</div>
                }
            </Panel>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/* TAB 5: PR AUTO-COMMENT                                          */
/* ──────────────────────────────────────────────────────────────── */
function PRCommentTab() {
    const [stats, setStats] = useState(null);
    useEffect(() => {
        api.get("/api/github/tickets/sync").then(r => {
            const d = r.data.tickets || [];
            setStats({ total: d.length, open: d.filter(t => t.status === "open").length, escalated: d.filter(t => t.status === "escalated").length });
        }).catch(() => setStats({ total: 0, open: 0, escalated: 0 }));
    }, []);

    return (
        <div className="space-y-5">
            <Panel accent={C.blue}>
                <PanelHead title="PR Auto-Comment Agent" badge="Passive" badgeColor={C.blue}
                    sub="When a workflow tied to a Pull Request fails, VizOps automatically posts a structured failure summary directly on the PR — one comment per run, deduplicated." />

                <div className="grid grid-cols-3 gap-4 mt-5">
                    {[{ icon: "🔍", label: "Trigger", val: "PR workflow failure", c: C.red },
                    { icon: "💬", label: "Action", val: "Post PR comment", c: C.blue },
                    { icon: "🛡", label: "Dedup", val: "One comment / run", c: C.green }].map(s => (
                        <div key={s.label} className="bg-[#080808] rounded-2xl p-5 border border-white/[0.05] text-center">
                            <div className="text-2xl mb-2">{s.icon}</div>
                            <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest">{s.label}</p>
                            <p className="text-[10px] font-black mt-1" style={{ color: s.c }}>{s.val}</p>
                        </div>
                    ))}
                </div>

                {/* comment preview */}
                <div className="mt-6 bg-[#060606] rounded-2xl p-5 border border-blue-600/10 font-mono text-[10px] text-gray-500 leading-relaxed">
                    <p className="text-blue-400 font-black mb-2">## 🤖 VizOps: Pipeline Failure Detected</p>
                    <p><span className="text-gray-700">**Workflow:**</span> CI / Build & Test</p>
                    <p><span className="text-gray-700">**Run:**</span> [#4821](…) — ❌ Failed</p>
                    <p><span className="text-gray-700">**Commit:**</span> `a1b2c3d`</p>
                    <p className="mt-2 text-gray-700">### Failed Jobs / Steps</p>
                    <p className="text-red-400">**Job:** `build` → ❌ Step **Run tests** (step 4)</p>
                    <p className="mt-2 text-gray-700 text-[9px]">_[View full Root Cause Analysis →]_</p>
                </div>
            </Panel>

            {stats && (
                <Panel>
                    <PanelHead title="Automation Summary" />
                    <div className="grid grid-cols-3 gap-4">
                        {[{ label: "Total Issues", v: stats.total, c: C.red }, { label: "Open", v: stats.open, c: C.amber }, { label: "Escalated", v: stats.escalated, c: C.red }].map(s => (
                            <div key={s.label} className="bg-[#080808] rounded-2xl p-5 border border-white/[0.05] text-center">
                                <p className="text-3xl font-black" style={{ color: s.c }}>{s.v}</p>
                                <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </Panel>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/* ROOT COMPONENT                                                  */
/* ──────────────────────────────────────────────────────────────── */
const TABS = [
    { id: "dispatch", label: "Dispatch", icon: "⚡", color: C.red, sub: "Trigger workflows" },
    { id: "control", label: "Run Control", icon: "🎮", color: C.blue, sub: "Cancel · Retry" },
    { id: "webhooks", label: "Webhooks", icon: "🔔", color: C.green, sub: "Alert delivery" },
    { id: "watchdog", label: "Watchdog", icon: "🚨", color: C.amber, sub: "Auto-escalation" },
    { id: "pr", label: "PR Comments", icon: "💬", color: C.blue, sub: "Auto-post RCA" },
];

export default function GitHubAgentControl() {
    const [tab, setTab] = useState("dispatch");
    const active = TABS.find(t => t.id === tab);

    return (
        <div className="min-h-screen bg-[#060606] text-white">
            {/* ── HEADER ───────────────────────────────────────── */}
            <div className="px-8 pt-10 pb-7 border-b border-white/[0.04]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#dc2626]" />
                    <span className="text-[9px] font-black text-red-600/60 uppercase tracking-[0.4em]">Agentic Operations · GitHub Actions</span>
                </div>
                <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none text-white">
                    Agent <span className="text-red-600">Control</span>
                </h1>
                <p className="text-[10px] text-gray-700 font-mono uppercase tracking-widest mt-3">
                    Automation agents that take real action on your pipelines
                </p>

                {/* status strip */}
                <div className="flex flex-wrap items-center gap-6 mt-6 px-5 py-3 bg-[#0a0a0a] rounded-2xl border border-white/[0.04] w-fit">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">All Agents Active</span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">PR Auto-Comment: <span className="text-emerald-500">ON</span></span>
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Watchdog threshold: <span className="text-amber-400">3 runs</span></span>
                </div>
            </div>

            {/* ── TAB BAR ──────────────────────────────────────── */}
            <div className="px-8 py-5 border-b border-white/[0.04]">
                <div className="flex flex-wrap gap-2">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${tab === t.id
                                ? "text-white border-white/10"
                                : "text-gray-600 border-white/[0.04] bg-[#0a0a0a] hover:border-white/8 hover:text-gray-400"}`}
                            style={tab === t.id ? { background: `${t.color}12`, borderColor: `${t.color}30` } : {}}>
                            <span className="text-sm">{t.icon}</span>
                            <span>{t.label}</span>
                            <span className="text-[8px] opacity-50 normal-case font-bold">{t.sub}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── CONTENT ──────────────────────────────────────── */}
            <div className="px-8 py-7">
                {tab === "dispatch" && <DispatchTab />}
                {tab === "control" && <RunControlTab />}
                {tab === "webhooks" && <WebhooksTab />}
                {tab === "watchdog" && <WatchdogTab />}
                {tab === "pr" && <PRCommentTab />}
            </div>
        </div>
    );
}
