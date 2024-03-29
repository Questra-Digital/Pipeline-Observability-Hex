import { useState, useEffect } from "react";
import SettingsText from "@/components/atoms/SettingsText";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import usePost from "@/hooks/usePost";

const UpdateToken = () => {
  const [token, setToken] = useState("");
  const { loading, error, data, postData } = usePost();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (token) {
      await postData("/api/token", { token });
    } else {
      WarningToast("Enter Token First!");
    }
  };

  // Handle success and error messages after rendering is complete
  useEffect(() => {
    if (data && data.message === "Token Saved successfully") {
      SuccessToast("Token Updated successfully!");
      setToken("");
    } else if (error) {
      ErrorToast(error);
    }
  }, [data, error]);

  return (
    <div className="flex w-full flex-col p-2">
      <div className="self-end">
        <button
          className="bg-purple-600 h-fit px-3 py-1 rounded-md"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="flex w-full flex-col md:w-[60%] border border-gray-800 self-center shadow shadow-blue-950 p-2 xs:p-10 rounded-lg">
        <SettingsText
          Heading={"Token Settings"}
          Description={"Ensure uninterrupted insights: Keep your monitoring current with a renewed ArgoCD token, ensuring seamless access to real-time analytics for informed decision-making."}
        />
        <div className="w-[100%] flex flex-col my-3">
          <label htmlFor="token" className="my-2">
            Token
          </label>
          <input
            className="border-2 w-full sm:w-[70%] p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
            placeholder="ArgoCD Token"
            type="text"
            name="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default UpdateToken;
