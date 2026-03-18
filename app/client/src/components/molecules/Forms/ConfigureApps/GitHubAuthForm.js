"use client";
import instance from "@/axios/axios";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addApp } from "@/redux/features/apps/appsSlice";
import { useRouter } from "next/navigation";

const getToken = () => {
    try {
        return JSON.parse(localStorage.getItem("userData"))?.token || "";
    } catch { return ""; }
};

const GitHubAuthForm = ({ closeModal }) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [pat, setPat] = useState("");
    const [accountName, setAccountName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfigure = async (e) => {
        e.preventDefault();
        if (!pat) {
            WarningToast("Please enter your Personal Access Token!");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await instance.post(
                "/api/github/auth",
                { pat, label: accountName },
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                }
            );
            if (response?.status === 200) {
                SuccessToast(`GitHub Account ${accountName || 'Connected'}!`);
                dispatch(addApp({ name: "github" }));
                setPat("");
                setAccountName("");
                if (closeModal) closeModal();
            } else {
                ErrorToast("Authentication failed. Please check your token.");
            }
        } catch (error) {
            console.error("GitHub Auth Error:", error);
            ErrorToast(error.response?.data?.message || "Could not connect to GitHub. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col bg-[#0b0b0c] p-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="mb-6">
                <p className="text-2xl font-black text-white mb-2 tracking-tight">Connect GitHub Account</p>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Link multiple accounts (Personal, Work, etc.) to monitor all your pipelines.
                    We'll fetch repositories with active workflow runs.
                </p>
            </div>

            <form onSubmit={handleConfigure} className="space-y-6">
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Account Label</label>
                    <input
                        className="bg-[#1c1c1c] border border-gray-800 rounded-xl py-4 px-5 text-white outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/50 transition-all shadow-inner placeholder:text-gray-600"
                        placeholder="e.g. My Personal Account"
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Personal Access Token (PAT)</label>
                    <input
                        className="bg-[#1c1c1c] border border-gray-800 rounded-xl py-4 px-5 text-white outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/50 transition-all shadow-inner placeholder:text-gray-600 font-mono"
                        placeholder="github_pat_..."
                        type="password"
                        value={pat}
                        onChange={(e) => setPat(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                    <div className="mt-3 p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg">
                        <p className="text-[11px] text-purple-300 leading-tight">
                            <span className="font-bold">Required scopes:</span> repo, workflow. Your token is stored securely per-user.
                        </p>
                    </div>
                </div>

                <button
                    type="submit"
                    className={`group mt-4 relative w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/40 active:scale-[0.98] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Connecting...</span>
                        </div>
                    ) : (
                        <span>Link Account</span>
                    )}
                </button>
            </form>
        </div>
    );
};

export default GitHubAuthForm;
