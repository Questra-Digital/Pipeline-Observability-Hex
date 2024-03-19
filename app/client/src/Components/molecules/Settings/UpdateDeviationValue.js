import SettingsText from "@/Components/atoms/SettingsText";
import { useState } from "react";

const UpdateDeviationValue = () => {
    const [deviationValue, setDeviationValue] = useState(1);

    return (
        <div className="flex w-full flex-col p-2">
            <div className="self-end mb-2">
                <button className="bg-purple-600 px-3 py-1 rounded-md">
                    Save
                </button>
            </div>
            <div className="flex w-full flex-col md:w-[60%] border border-gray-800 self-center shadow shadow-blue-950 p-2 xs:p-10 rounded-lg">
                <SettingsText
                    Heading={"Deviation Settings"}
                    Description={
                        "Stay informed on your terms: Tailor your alerts by setting the Deviation Value, ensuring notifications align perfectly with your operational requirements and preferences."
                    }
                />
                <div className="w-[100%] flex flex-col my-3">
                    <label htmlFor="deviation" className="my-2">
                        Deviation Value
                    </label>
                    <input
                        className="border-2 w-full sm:w-[70%] p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
                        placeholder="10 s"
                        type="number"
                        name="deviation"
                        min="1"
                        inputmode="numeric"
                        value={deviationValue}
                        onChange={(e) => setDeviationValue(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default UpdateDeviationValue;
