"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorToast } from "@/components/atoms/toastUtils/Toast";
import ImageAtom from "@/components/atoms/ImageAtom";
import useFetch from "@/hooks/useFetch";

const Pipelines = () => {
  const [pipelines, setPipelines] = useState([]);
  const [filteredPipelines, setFilteredPipelines] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();

  const { data: pipelineData, error, loading, fetchData } = useFetch("/all_pipelines");

  useEffect(() => {
    if (!loading) {
      setLoading(false);
      if (pipelineData) {
        setPipelines(pipelineData.available_pipeline);
        setFilteredPipelines(pipelineData.available_pipeline);
      }
      if(error)
        ErrorToast("Error fetching Pipelines!");
    }
  }, [pipelineData, loading]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleDashboardClick = (pipelineName) => {
    router.push(`/dashboard/pipeline?pipeline=${encodeURIComponent(pipelineName)}`);
  };
  const handleHistoryClick = (pipelineName) => {
    router.push(`pipelineHistory?pipeline=${encodeURIComponent(pipelineName)}`);
  };

  const handleChange = (e) => {
    const search = e.target.value.toLowerCase();
    if (search === "") {
      setFilteredPipelines(pipelines);
    } else {
      const filtered = pipelines.filter(pipeline =>
        pipeline.toLowerCase().startsWith(search)
      );
      setFilteredPipelines(filtered);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center">
      {!isLoading && (
        <div className="border-2 w-[90%] mt-4 px-3 py-1 flex rounded-lg border-gray-700 active:border-purple-600">
          <ImageAtom
            src={"/assets/Images/search.png"}
            width={40}
            height={40} 
            alt={"Search Icon"}
          />
          <input className="w-full outline-none bg-transparent px-4 py-2" placeholder="Search Your Pipeline" onChange={handleChange}/>
        </div>
      )}
      <div className="h-full w-full md:w-[80%] p-2 xs:p-5 overflow-x-auto">
        {loading && <p className="text-center">Loading Your Pipelines...</p>}
        {!loading && (
          <table className="w-full text-sm text-left text-gray-400 table-auto shadow-md shadow-purple-900">
            <thead className="uppercase bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3">
                  pipeline name
                </th>
                <th scope="col" className="px-6 py-3 text-center w-[50%] md:w-[30%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPipelines.map((pipeline, index) => (
                <tr
                  key={index}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                  >
                    {pipeline}
                  </th>
                  <td className="flex justify-center py-2 px-3 gap-5 z-20">
                    <span
                      className={`px-5 py-3 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700`}
                      onClick={() => handleDashboardClick(pipeline)}
                    >
                      Dashboard
                    </span>
                    <span
                      className={`px-5 py-3 rounded-md font-semibold text-white bg-blue-700 hover:bg-blue-500`}
                      onClick={() => handleHistoryClick(pipeline)}
                    >
                      History
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Pipelines;
