import { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast } from "@/components/atoms/toastUtils/Toast";
import useFetch from "@/hooks/useFetch";
import ToggleButton from "@/components/atoms/ToggleButton";
import instance from "@/axios/axios";
import { useSelector } from "react-redux";

const UpdateGitHubStatus = () => {
    const [observabilityStatus, setObservabilityStatus] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const authToken = useSelector((state) => state.user.token);

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
                        Authorization: `Bearer ${authToken}`,
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
                    className="bg-purple-600 hover:bg-purple-700 h-fit px-6 py-2 rounded-lg text-white font-bold transition-all shadow-lg shadow-purple-900/40 active:scale-95 disabled:opacity-50"
                    onClick={handleSave}
                    disabled={loading || isSaving}
                >
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>
            <div className="flex w-full flex-col md:w-[85%] lg:w-[70%] border border-gray-800 self-center shadow-2xl shadow-purple-900/10 p-6 xs:p-10 rounded-2xl bg-[#141414]">
                <SettingsText
                    Heading={"GitHub Actions Observability"}
                    Description={
                        "Enable or disable real-time monitoring for your GitHub Actions workflows. When active, the system will track runs, jobs, and steps to provide deep insights."
                    }
                />
                <div className="w-full flex flex-col xs:flex-row items-center justify-between border border-gray-800 bg-[#1c1c1c] p-6 rounded-xl mt-10 hover:border-gray-700 transition-colors">
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
