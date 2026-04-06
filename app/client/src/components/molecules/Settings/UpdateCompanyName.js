import { useState } from "react";
import SettingsText from "@/components/atoms/SettingsText";

const UpdateCompanyName = () => {
    const [companyName, setCompanyName] = useState("");
    return (
        <div className="flex w-full flex-col p-2">
            <div className="self-end mb-2">
                <button className="bg-purple-600 px-3 py-1 rounded-md">
                    Save
                </button>
            </div>
            <div className="flex w-full flex-col md:w-[60%] border border-red-900/10 self-center shadow-2xl shadow-red-900/5 p-6 xs:p-10 rounded-2xl bg-[#0a0a0a]">
                <SettingsText
                    Heading={"Company Name"}
                    Description={
                        "Craft your brand identity: Select a compelling Company Name that resonates with your values, vision, and mission, setting the tone for your organization's journey."
                    }
                />
                <div className="w-[100%] flex flex-col my-3">
                    <label htmlFor="company" className="my-2">
                        Company Name
                    </label>
                    <input
                        className="w-full sm:w-[80%] p-3 h-12 outline-none bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-red-600 transition-all"
                        placeholder="Vizops"
                        type="text"
                        name="company"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default UpdateCompanyName;
