"use client";
import React, { useState, useEffect } from "react";
import instance from "@/axios/axios";
import { useRouter } from "next/navigation";
import { ErrorToast } from "@/components/atoms/toastUtils/Toast";

const Pipelines = () => {
  const [pipelines, setPipelines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    async function fetchPipelines() {
      try {
        const token = localStorage.getItem('token');
        console.log(token);
        const response = await instance.get("/all_pipelines", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept'       : 'application/json'
           }
        });
        setPipelines(response.data.available_pipeline);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching files:", error);
        if (error.response.status == 401) {
          ErrorToast('Token Missing!');
        }
        else if(error.response.status == 500){
          ErrorToast('Server Error!')
        }
      }
      finally{
        setIsLoading(false);
      }
    }
    fetchPipelines();
  }, []);

  const handleRowClick = (pipelineName) => {
    router.push(
      `/dashboard/pipeline?pipeline=${encodeURIComponent(pipelineName)}`
    );
  };

  return (
    <div className="h-full w-full md:w-[80%] p-2 xs:p-5 md:p-10 overflow-x-auto">
      {isLoading && <p className="text-center">Loading Your Pipelines...</p>}
      {!isLoading && (
        <table className="w-full text-sm text-left text-gray-400 table-auto shadow-md shadow-purple-900">
          <thead className="uppercase bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3">
                pipeline name
              </th>
              <th scope="col" className="px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pipelines.map((pipeline, index) => (
              <tr
                key={index}
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                onClick={() => handleRowClick(pipeline)}
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  {pipeline}
                </th>
                <td className="px-6 py-4">
                  <span
                    className={`px-5 py-3 rounded-md text-white bg-green-600`}
                  >
                    Dashboard
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Pipelines;
