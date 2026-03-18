import { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast } from "@/components/atoms/toastUtils/Toast";
import useFetch from "@/hooks/useFetch";
import ToggleButton from "@/components/atoms/ToggleButton";
import instance from "@/axios/axios";

const getToken = () => {
    try {
        return JSON.parse(localStorage.getItem("userData"))?.token || "";
    } catch { return ""; }
};

const UpdateGitHubStatus = () => {
    const [observabilityStatus, setObservabilityStatus] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { data, error, loading, fetchData } = useFetch("/api/github/status");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (data) {
            setObservabilityStatus(data.status === "active" || data.status === true);
        }
    }, [data]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await instance.post(
                "/api/github/status",
                { status: observabilityStatus ? "active" : "inactive" },
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                }
            );
            if (response?.status === 200) {
                SuccessToast("GitHub Actions Status Updated!");
            }
        } catch (error) {
            ErrorToast("Failed to update status.");
            fetchData(); // Reset to server state
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex w-full flex-col p-2 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="self-end mb-4">
                <button
                    className="bg-gradient-to-r from-red-600 to-red-900 h-fit px-8 py-2.5 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-red-950/40 active:scale-95 disabled:opacity-50"
                    onClick={handleSave}
                    disabled={loading || isSaving}
                >
                    {isSaving ? "Syncing..." : "Apply Changes"}
                </button>
            </div>
            <div className="flex w-full flex-col md:w-[85%] lg:w-[70%] border border-red-900/20 self-center shadow-2xl shadow-red-900/10 p-6 xs:p-10 rounded-2xl bg-[#0a0a0a]">
                <SettingsText
                    Heading={"GitHub Actions Observability"}
                    Description={
                        "Enable or disable real-time monitoring for your GitHub Actions workflows. When active, the system will track runs, jobs, and steps to provide deep insights."
                    }
                />
                <div className="w-full flex flex-col xs:flex-row items-center justify-between border border-[#1a1a1a] bg-[#0d0d0d] p-6 rounded-xl mt-10 hover:border-red-900/30 transition-colors">
                                       <div className="flex flex-col">
                        <p className="text-gray-100 font-bold text-lg tracking-tight">Observability Status</p>
                        <p className="text-sm text-gray-500">Global toggle for all GitHub monitoring</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer mt-4 xs:mt-0">
                        <input
                            type="checkbox"
                            checked={observabilityStatus}
                            onChange={(e) => setObservabilityStatus(e.target.checked)}
                            className="sr-only peer"
                            disabled={isSaving}
                        />
                        <ToggleButton />
                    </label>
                </div>
            </div>
        </div>
    );
};

export default UpdateGitHubStatus;
