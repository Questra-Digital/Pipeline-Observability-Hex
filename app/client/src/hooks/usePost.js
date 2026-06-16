import { useState } from "react";
import instance from "@/axios/axios";

const AUTH_TOKEN_KEY = "userData";

const getAuthHeaders = () => {
  try {
    const raw = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed.token ? { Authorization: `Bearer ${parsed.token}` } : {};
  } catch {
    return {};
  }
};

const usePost = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const postData = async (url, body, includeAuth = true) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const headers = includeAuth ? getAuthHeaders() : {};
      const response = await instance.post(url, body, { headers });
      if (response.status === 200) setData(response.data);
      else setError("Failed. Please try again!");
    } catch (err) {
      if (err?.response?.status === 401) {
        setError(err.response.data?.Error || err.response?.statusText || "Unauthorized");
        localStorage.removeItem(AUTH_TOKEN_KEY);
      } else if (err?.response) {
        setError(err.response.data?.error || err.response?.statusText || "Request failed");
      } else if (err?.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, postData };
};

export default usePost;
