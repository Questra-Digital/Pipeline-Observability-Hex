import { useState } from "react";
import instance from "@/axios/axios";

const usePost = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const postData = async (url, body, optionalHeaderValue = true) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const authToken = optionalHeaderValue
        ? JSON.parse(localStorage.getItem("userData")).token
        : {};
      const headers = {
        Authorization: `Bearer ${authToken}`,
      };
      const response = await instance.post(url, body, { headers });
      if (response.status === 200) setData(response.data);
      else setError("Failed. Please try again!");
    } catch (error) {
      if (error?.response?.status === 401) {
        setError(error.response.data.Error || error.response.statusText);
      } else setError("We are facing some issue. Try Again!");
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, postData };
};

export default usePost;
