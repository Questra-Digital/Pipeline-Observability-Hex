"use client";
import { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast } from "@/components/atoms/toastUtils/Toast";
import useFetch from "@/hooks/useFetch";
import ToggleButton from "@/components/atoms/ToggleButton";
import instance from "@/axios/axios";

const GitHubRepoSelector = () => {
    const [accounts, setAccounts] = useState([]);
    const [activeAccount, setActiveAccount] = useState("");

    // Using the real useFetch hook for backend integration
    const { data, error, loading, fetchData } = useFetch("/api/github/repos");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (data && Array.isArray(data)) {
            setAccounts(data);
            if (data.length > 0 && !activeAccount) {
                setActiveAccount(data[0].id);
            }
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            ErrorToast("Failed to fetch GitHub repositories.");
        }
    }, [error]);

    const handleToggleRepo = async (accountId, repoId) => {
        try {
            // Get token for the header
            const getToken = () => {
                try {
                    return JSON.parse(localStorage.getItem("userData"))?.token || "";
                } catch { return ""; }
            };

            // Optimization: Optimistically update UI
            const updatedAccounts = accounts.map(acc => {
                if (acc.id === accountId) {
                    return {
                        ...acc,
                        repositories: (acc.repositories || []).map(repo => {
                            if (repo.repoId === repoId) {
                                return { ...repo, enabled: !repo.enabled };
                            }
                            return repo;
                        })
                    };
                }
                return acc;
            });
            setAccounts(updatedAccounts);

            // Real API call to persist the toggle
            await instance.post(
                "/api/github/repos/toggle",
                { accountId, repoId },
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                }
            );
            SuccessToast("Update successful");
        } catch (err) {
            console.error("Failed to update repository status:", err);
            ErrorToast("Failed to update repository status.");
            fetchData(); // Revert on failure
        }
    };

    const totalRepos = accounts.reduce((sum, acc) => sum + (acc.repositories?.length || 0), 0);
    const currentAccount = accounts.find(acc => acc.id === activeAccount);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]"></div>
                <p className="text-gray-500 text-sm font-medium animate-pulse">Syncing with GitHub...</p>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col p-2 max-h-[85vh] overflow-hidden">
            <div className="mb-6 shrink-0">
                <SettingsText
                    Heading={"Repository Management"}
                    Description={
                        "Configure which repositories are monitored under each account. We automatically categorize them so you know exactly which account owns which pipeline."
                    }
                />
            </div>

            {/* Summary Stat Card - Shrink-0 to prevent compression */}
            <div className="flex items-center gap-5 mb-8 bg-[#0a0a0a] p-6 rounded-2xl border border-red-900/20 shadow-xl overflow-hidden relative group shrink-0">
                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-red-600/5 to-transparent"></div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-600/10 text-red-500 border border-red-500/30 group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                </div>
                <div className="z-10">
                    <p className="text-3xl font-black text-white leading-tight">{totalRepos}</p>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-[2px] mt-0.5">Connected Repositories</p>
                </div>
            </div>

            {accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-800 rounded-3xl bg-[#111112]">
                    <div className="h-16 w-16 rounded-full bg-gray-900 flex items-center justify-center mb-4 text-gray-600 border border-gray-800">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <p className="text-gray-400 font-semibold text-lg">No accounts connected yet</p>
                    <p className="text-gray-500 text-sm mt-1">Connect your GitHub account in the Integrations tab to start.</p>
                </div>
            ) : (
                <>
                    {/* Account Tabs */}
                    <div className="flex border-b border-gray-800 mb-8 overflow-x-auto no-scrollbar scroll-smooth shrink-0">
                        {accounts.map(acc => (
                            <button
                                key={acc.id}
                                onClick={() => setActiveAccount(acc.id)}
                                className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeAccount === acc.id ? "text-white" : "text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                {acc.name}
                                <span className="ml-2 text-[10px] opacity-60">({acc.repositories?.length || 0})</span>
                                {activeAccount === acc.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Repositories for Current Account - Scrollable Area */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5 pb-4">
                        <div className="flex items-center justify-between px-2 mb-2 sticky top-0 bg-[#0b0c15] py-2 z-10">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                {currentAccount?.owner}'s Repositories
                            </h3>
                            <button
                                onClick={() => fetchData(`?refresh=true`)}
                                className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-red-600/30 transition-all flex items-center gap-2"
                            >
                                <svg className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                {loading ? "Syncing..." : "Sync Repos"}
                            </button>
                        </div>

                        {currentAccount?.repositories?.map(repo => (
                            <div
                                key={repo.repoId}
                                className="group relative bg-[#1c1c1c] border border-gray-800 rounded-2xl p-6 flex items-center justify-between transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)]"
                            >
                                {/* Hover Indicator Line */}
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-l-2xl"></div>

                                <div className="flex flex-col pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-xl font-bold text-gray-100 uppercase tracking-tight group-hover:text-white transition-colors">
                                            {repo.name}
                                        </p>
                                        {repo.enabled && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed max-w-lg">{repo.description}</p>
                                </div>

                                <div className="flex flex-col items-end min-w-[100px]">
                                    <span className={`text-[9px] font-black uppercase tracking-[2px] mb-3 transition-colors ${repo.enabled ? "text-emerald-400" : "text-gray-600"}`}>
                                        {repo.enabled ? "Monitoring" : "Ignored"}
                                    </span>
                                    <label className="inline-flex items-center cursor-pointer scale-110">
                                        <input
                                            type="checkbox"
                                            checked={repo.enabled}
                                            onChange={() => handleToggleRepo(activeAccount, repo.repoId)}
                                            className="sr-only peer"
                                        />
                                        <ToggleButton />
                                    </label>
                                </div>
                            </div>
                        ))}

                        {(currentAccount?.repositories?.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-800 rounded-2xl">
                                <p className="text-gray-500 font-medium">No repositories found for this account.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default GitHubRepoSelector;
