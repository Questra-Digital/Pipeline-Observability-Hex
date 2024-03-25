import { useState, useEffect } from "react";
import instance from "@/axios/axios";

const useFetch = (url, optionalHeaderValue = true) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
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
      const response = await instance.get(url, { headers });
      if (response.status === 200) setData(response.data);
      else setError("Failed. Please try again!");
      console.log(response);
    } catch (error) {
      console.log(error);
      if (error?.response?.status === 401) {
        setError(error.response.data.Error || error.response.statusText);
      } else setError("We are facing some issue. Try Again!");
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, fetchData };
};

export default useFetch;
