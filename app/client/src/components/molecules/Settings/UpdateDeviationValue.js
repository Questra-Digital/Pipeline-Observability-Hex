import instance from "@/axios/axios";
import SettingsText from "@/components/atoms/SettingsText";
import {
  ErrorToast,
  SuccessToast,
  WarningToast,
} from "@/components/atoms/toastUtils/Toast";
import { useState } from "react";

const UpdateDeviationValue = () => {
  const [deviationValue, setDeviationValue] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (deviationValue) {
      try {
        const authToken = JSON.parse(localStorage.getItem("userData")).token;
        const response = await instance.post(
          "/api/daviation-value",
          { deviation_value: deviationValue },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        if (
          response.status === 200 &&
          response.data.message === "Deviation Value inserted...."
        ) {
          SuccessToast("Deviation Value Updated!");
        } else {
          ErrorToast("Failed to updated deviation. Please try again.");
        }
      } catch (error) {
        console.log(error);
        if (error?.response?.status == 401) {
          ErrorToast(error.response.data.error);
        } else ErrorToast("We are facing some issue. Try Again!");
      }
    } else {
      WarningToast("Enter Value First!");
    }
  };

  return (
    <div className="flex w-full flex-col p-2">
      <div className="self-end mb-2">
        <button
          className="bg-purple-600 px-3 py-1 rounded-md"
          onClick={handleSubmit}
        >
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
            placeholder="10"
            type="number"
            name="deviation"
            min="1"
            value={deviationValue}
            onChange={(e) => setDeviationValue(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default UpdateDeviationValue;
