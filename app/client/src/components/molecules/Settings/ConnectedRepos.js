"use client";
import { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast } from "@/components/atoms/toastUtils/Toast";
import useFetch from "@/hooks/useFetch";
import ToggleButton from "@/components/atoms/ToggleButton";
import instance from "@/axios/axios";

const ConnectedRepos = () => {
    const [connectedRepos, setConnectedRepos] = useState([]);
    const { data, error, loading, fetchData } = useFetch("/api/github/repos");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (data && Array.isArray(data)) {
            // Flatten and filter for enabled repos only
            const enabled = data.flatMap(acc =>
                (acc.repositories || [])
                    .filter(repo => repo.enabled)
                    .map(repo => ({ ...repo, accountId: acc.id, accountOwner: acc.owner }))
            );
            setConnectedRepos(enabled);
        }
    }, [data]);

    const handleToggleRepo = async (accountId, repoId) => {
        try {
            const getToken = () => {
                try {
                    return JSON.parse(localStorage.getItem("userData"))?.token || "";
                } catch { return ""; }
            };

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

            // Optimistically or after-the-fact update (here we just refetch or filter out)
            setConnectedRepos(prev => prev.filter(r => r.repoId !== repoId));
            SuccessToast("Repository disconnected");
        } catch (err) {
            ErrorToast("Failed to disconnect repository.");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]"></div>
                <p className="text-gray-500 text-sm">Loading connected repositories...</p>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col p-2">
            <div className="mb-6">
                <SettingsText
                    Heading={"Connected Repositories"}
                    Description={
                        "View and manage all repositories currently being monitored across your connected GitHub accounts."
                    }
                />
            </div>

            {connectedRepos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-800 rounded-3xl bg-[#111112]">
                    <p className="text-gray-400 font-semibold text-lg">No repositories are currently connected</p>
                    <p className="text-gray-500 text-sm mt-1">Enable monitoring for repositories in the 'Manage Repositories' section.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {connectedRepos.map(repo => (
                        <div
                            key={repo.repoId}
                            className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 flex items-center justify-between transition-all hover:border-red-600/50 hover:shadow-[0_0_20px_rgba(220,38,38,0.1)]"
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">{repo.accountOwner}</span>
                                <p className="text-xl font-bold text-gray-100 uppercase tracking-tight">{repo.name}</p>
                                <p className="text-sm text-gray-500 line-clamp-1">{repo.description}</p>
                            </div>

                            <div className="flex flex-col items-end">
                                <span className="text-[9px] text-emerald-400 font-black uppercase tracking-[2px] mb-3">
                                    Connected
                                </span>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={true}
                                        onChange={() => handleToggleRepo(repo.accountId, repo.repoId)}
                                        className="sr-only peer"
                                    />
                                    <ToggleButton />
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ConnectedRepos;
