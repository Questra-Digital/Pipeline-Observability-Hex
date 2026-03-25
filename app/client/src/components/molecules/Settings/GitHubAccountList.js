"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import useFetch from "@/hooks/useFetch";
import instance from "@/axios/axios";

const getToken = () => {
    try {
        const userData = localStorage.getItem("userData");
        if (!userData) return "";
        return JSON.parse(userData)?.token || "";
    } catch { return ""; }
};

const GitHubAccountList = () => {
    const [accounts, setAccounts] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, account: null, stage: 1, confirmInput: "" });
    const [mounted, setMounted] = useState(false);

    const { data, error, loading, fetchData } = useFetch("/api/github/accounts");

    useEffect(() => {
        setMounted(true);
        fetchData();
        return () => setMounted(false);
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

    const closeModal = () => setDeleteModal({ open: false, account: null, stage: 1, confirmInput: "" });

    const handleDeleteAccount = async () => {
        if (!deleteModal.account) return;

        const expected = `DELETE ${deleteModal.account.label}`.trim().toUpperCase();
        const actual = deleteModal.confirmInput.trim().toUpperCase();

        if (actual !== expected) {
            WarningToast("Verification Mismatch: Code does not match sequence.");
            return;
        }

        const accountId = deleteModal.account.id || deleteModal.account._id;
        if (!accountId) {
            ErrorToast("System Error: Account ID not found.");
            return;
        }

        const token = getToken();
        if (!token) {
            ErrorToast("Session Expired: Please log in again.");
            return;
        }

        const deletedLabel = deleteModal.account.label || "Account";

        // Close modal immediately and mark as deleting
        setIsDeleting(true);
        closeModal();

        try {
            await instance.delete(
                `/api/github/account/${accountId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Remove from local state
            setAccounts(prev => prev.filter(acc => (acc.id || acc._id) !== accountId));
            SuccessToast(`✓ Account "${deletedLabel}" has been deleted successfully.`);
        } catch (err) {
            console.error("Delete Error:", err.response);
            const errMsg = err.response?.data?.error || err.message || "Unknown Failure";
            ErrorToast(`Failed to delete account: ${errMsg}`);
            // Refetch to restore correct state
            fetchData();
        } finally {
            setIsDeleting(false);
        }
    };

    const renderDeleteAccountModal = () => {
        if (!deleteModal.open || !mounted || !deleteModal.account) return null;

        const expectedCode = `DELETE ${deleteModal.account.label}`.toUpperCase();
        const isMatch = deleteModal.confirmInput.trim().toUpperCase() === expectedCode;

        const modalContent = (
            <div
                className="fixed inset-0 z-[99999] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/90 animate-in fade-in duration-300"
                onClick={() => closeModal()}
            >
                <div
                    className="bg-[#0a0a0a] w-full max-w-2xl rounded-[3rem] p-16 relative overflow-hidden border-2 border-red-600/30 shadow-[0_0_150px_rgba(220,38,38,0.15)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>

                    <div className="relative z-10 font-Ubuntu">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                                    {deleteModal.stage === 1 ? "Confirm Deletion" : "Type to Confirm"}
                                </h2>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                                    <span className="text-[10px] text-red-600 font-black uppercase tracking-[0.5em]">Irreversible Action</span>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:bg-white/10 hover:text-white transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {deleteModal.stage === 1 ? (
                            <div className="space-y-10">
                                <p className="text-gray-400 font-medium leading-relaxed">
                                    You are about to delete <span className="text-white font-black italic">"{deleteModal.account.label}"</span>. This will permanently remove the account, all its repositories, and all recorded pipeline runs from the database.
                                </p>
                                <div className="p-8 rounded-[2rem] bg-red-950/10 border border-red-900/20">
                                    <h4 className="text-xs font-black text-red-600 uppercase tracking-widest mb-4">What will be deleted</h4>
                                    <ul className="grid grid-cols-2 gap-4">
                                        {["GitHub Account Link", "Connected Repositories", "Workflow Run History", "Analytics Data"].map((asset, i) => (
                                            <li key={i} className="flex items-center gap-3 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                                <div className="w-1 h-1 rounded-full bg-red-900"></div>
                                                {asset}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    onClick={() => setDeleteModal(prev => ({ ...prev, stage: 2 }))}
                                    className="w-full py-6 rounded-2xl bg-red-600 text-white font-black uppercase tracking-[0.4em] italic text-[11px] transition-all hover:bg-red-700 active:scale-95 shadow-[0_20px_40px_rgba(220,38,38,0.2)]"
                                >
                                    I Understand, Proceed
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                <div className="flex flex-col gap-6">
                                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 text-center group cursor-help transition-colors hover:border-red-600/30">
                                        <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.5em] mb-3 group-hover:text-red-900 transition-colors">Type this exactly to confirm</p>
                                        <p className="text-2xl font-black text-white font-mono tracking-widest select-all group-hover:scale-105 transition-transform uppercase">DELETE {deleteModal.account.label}</p>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="text"
                                            className={`w-full bg-black/60 border-2 rounded-3xl py-7 px-8 text-xl font-black text-white outline-none transition-all placeholder:text-gray-800 font-mono tracking-wider caret-red-600 ${isMatch ? 'border-green-600/40 focus:border-green-600' : 'border-red-600/20 focus:border-red-600'}`}
                                            placeholder="Enter sequence..."
                                            value={deleteModal.confirmInput}
                                            onChange={(e) => setDeleteModal(prev => ({ ...prev, confirmInput: e.target.value }))}
                                            autoFocus
                                        />
                                        {isMatch && (
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-green-600 animate-in zoom-in duration-300">
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <button
                                        onClick={() => setDeleteModal(prev => ({ ...prev, stage: 1 }))}
                                        className="flex-1 py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.4em] italic text-[11px] hover:bg-white/10 transition-all font-Ubuntu"
                                    >
                                        Go Back
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={!isMatch}
                                        className={`flex-[2] py-6 rounded-2xl bg-red-600 text-white font-black uppercase tracking-[0.4em] italic text-[11px] transition-all shadow-[0_20px_40px_rgba(220,38,38,0.4)] ${isMatch ? 'hover:bg-red-700 active:scale-95' : 'opacity-40 grayscale cursor-not-allowed'}`}
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );

        return createPortal(modalContent, document.body);
    };

    if (loading && accounts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"></div>
                <p className="text-gray-500 text-sm font-medium animate-pulse">Loading accounts...</p>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col p-2 max-h-[85vh] overflow-hidden font-Ubuntu">
            <div className="mb-6 shrink-0">
                <SettingsText
                    Heading={"Connected Accounts"}
                    Description={
                        "View and manage all GitHub accounts connected to your profile. Deleting an account will permanently remove all its repositories and pipeline run history."
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

            {isDeleting && (
                <div className="mb-4 shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl bg-red-950/20 border border-red-600/30 text-red-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                    <div className="w-3 h-3 rounded-full border-2 border-red-400 border-t-transparent animate-spin"></div>
                    Deleting account...
                </div>
            )}

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
                    {accounts.map(acc => {
                        const accountId = acc.id || acc._id;
                        return (
                            <div
                                key={accountId}
                                className="group relative bg-[#1c1c1c] border border-gray-800 rounded-2xl p-6 flex items-center justify-between transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_30px_-10px_rgba(220,38,38,0.15)]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center shadow-inner group-hover:border-red-500/30 transition-colors">
                                        <span className="text-xl font-black text-gray-400 group-hover:text-red-400 transition-colors uppercase">
                                            {(acc.label || acc.name || "G").charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-lg font-bold text-gray-100 tracking-tight group-hover:text-white transition-colors">
                                            {acc.label || "Untitled Account"}
                                        </p>
                                        <p className="text-xs text-gray-500 font-mono">ID: {accountId}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setDeleteModal({ open: true, account: acc, stage: 1, confirmInput: "" })}
                                    disabled={isDeleting}
                                    className="px-4 py-2 rounded-lg bg-red-600/10 border border-red-600/30 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Delete Account
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            {renderDeleteAccountModal()}
        </div>
    );
};

export default GitHubAccountList;
