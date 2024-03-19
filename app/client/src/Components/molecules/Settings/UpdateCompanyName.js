import { useState } from "react";
import SettingsText from "@/Components/atoms/SettingsText";

const UpdateCompanyName = () => {
    const [companyName, setCompanyName] = useState("");
    return (
        <div className="flex w-full flex-col p-2">
            <div className="self-end mb-2">
                <button className="bg-purple-600 px-3 py-1 rounded-md">
                    Save
                </button>
            </div>
            <div className="flex w-full flex-col md:w-[60%] border border-gray-800 self-center shadow shadow-blue-950 p-2 xs:p-10 rounded-lg">
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
                        className="border-2 w-full sm:w-[70%] p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
                        placeholder="Datalogs"
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
