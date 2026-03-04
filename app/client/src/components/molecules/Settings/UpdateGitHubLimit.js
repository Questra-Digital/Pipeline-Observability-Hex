import { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast } from "@/components/atoms/toastUtils/Toast";
import useFetch from "@/hooks/useFetch";
import instance from "@/axios/axios";
import { useSelector } from "react-redux";

const UpdateGitHubLimit = () => {
    const [limit, setLimit] = useState(5);
    const [isSaving, setIsSaving] = useState(false);
    const authToken = useSelector((state) => state.user.token);

    const { data, error, loading, fetchData } = useFetch("/api/github/limit");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (data && data.limit !== undefined) {
            setLimit(data.limit);
        }
    }, [data]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await instance.post(
                "/api/github/limit",
                { limit },
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );
            if (response?.status === 200) {
                SuccessToast("GitHub Pipeline Limit Updated!");
            }
        } catch (error) {
            ErrorToast("Failed to update limit.");
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
                    Heading={"Monitoring Limit"}
                    Description={
                        "Set the maximum number of GitHub Action pipelines to monitor. This helps manage performance and API quota usage."
                    }
                />
                <div className="w-full flex flex-col xs:flex-row items-center justify-between border border-gray-800 bg-[#1c1c1c] p-6 rounded-xl mt-10 hover:border-gray-700 transition-colors">
                    <div className="flex flex-col">
                        <p className="text-gray-100 font-bold text-lg tracking-tight">Maximum Pipelines</p>
                        <p className="text-sm text-gray-500">Number of pipelines to track across all accounts</p>
                    </div>
                    <div className="relative mt-4 xs:mt-0 w-full xs:w-40">
                        <select
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="w-full bg-[#252525] border border-gray-700 text-white text-sm rounded-xl focus:ring-purple-600 focus:border-purple-600 block p-4 outline-none appearance-none cursor-pointer transition-all hover:bg-[#2a2a2a]"
                            disabled={isSaving}
                        >
                            {[1, 5, 10, 20, 50, 100].map((val) => (
                                <option key={val} value={val}>
                                    {val} Pipelines
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateGitHubLimit;
