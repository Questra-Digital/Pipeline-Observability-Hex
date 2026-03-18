"use client";
import { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast } from "@/components/atoms/toastUtils/Toast";
import useFetch from "@/hooks/useFetch";
import instance from "@/axios/axios";

const getToken = () => {
    try {
        return JSON.parse(localStorage.getItem("userData"))?.token || "";
    } catch { return ""; }
};

const GitHubAccountList = () => {
    const [accounts, setAccounts] = useState([]);
    const [isDeleting, setIsDeleting] = useState(null); // Track which ID is being deleted

    const { data, error, loading, fetchData } = useFetch("/api/github/accounts");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (data && Array.isArray(data)) {
            setAccounts(data);
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            ErrorToast("Failed to fetch connected GitHub accounts.");
        }
    }, [error]);

    const handleDisconnect = async (accountId, accountName) => {
        if (!window.confirm(`Are you sure you want to disconnect the account "${accountName}"? All associated repository monitoring will be stopped.`)) {
            return;
        }

        setIsDeleting(accountId);
        try {
            const response = await instance.delete(
                `/api/github/accounts/${accountId}`,
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                }
            );
            if (response?.status === 200) {
                SuccessToast(`Account "${accountName}" disconnected.`);
                setAccounts(accounts.filter(acc => acc.id !== accountId));
            }
        } catch (err) {
            // Simplified for now, real implementation would handle errors better
            ErrorToast(`Failed to disconnect account "${accountName}".`);
            fetchData(); // Sync with server for safety
        } finally {
            setIsDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"></div>
                <p className="text-gray-500 text-sm font-medium animate-pulse">Loading accounts...</p>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col p-2 max-h-[85vh] overflow-hidden">
            <div className="mb-6 shrink-0">
                <SettingsText
                    Heading={"Connected Accounts"}
                    Description={
                        "View and manage all GitHub accounts connected to your profile. You can see the account labels you provided during setup."
                    }
                />
            </div>

            {/* Total Count Card */}
            <div className="flex items-center gap-5 mb-8 bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800 shadow-xl overflow-hidden relative group shrink-0">
                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-blue-600/5 to-transparent"></div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.34-3.369-1.34-.454-1.152-1.11-1.458-1.11-1.458-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" /></svg>
                </div>
                <div className="z-10">
                    <p className="text-3xl font-black text-white leading-tight">{accounts.length}</p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[2px] mt-0.5">Total Connected Accounts</p>
                </div>
            </div>

            {accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-800 rounded-3xl bg-[#111112]">
                    <div className="h-16 w-16 rounded-full bg-gray-900 flex items-center justify-center mb-4 text-gray-600 border border-gray-800">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </div>
                    <p className="text-gray-400 font-semibold text-lg">No accounts linked</p>
                    <p className="text-gray-500 text-sm mt-1">Connect your first account in the Integrations tab.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-4">
                    {accounts.map(acc => (
                        <div
                            key={acc.id}
                            className="group relative bg-[#1c1c1c] border border-gray-800 rounded-2xl p-6 flex items-center justify-between transition-all duration-300 hover:border-blue-500/40 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.15)]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center shadow-inner group-hover:border-blue-500/30 transition-colors">
                                    <span className="text-xl font-black text-gray-400 group-hover:text-blue-400 transition-colors">
                                        {(acc.label || acc.name || "G").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-lg font-bold text-gray-100 tracking-tight group-hover:text-white transition-colors">
                                        {acc.label || "Untitled Account"}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono">ID: {acc.id}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDisconnect(acc.id, acc.label || acc.name)}
                                className="px-4 py-2 rounded-lg bg-red-500/5 border border-red-500/20 text-xs font-bold text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-all active:scale-95 disabled:opacity-50"
                                disabled={isDeleting === acc.id}
                            >
                                {isDeleting === acc.id ? "Disconnecting..." : "Disconnect"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GitHubAccountList;
