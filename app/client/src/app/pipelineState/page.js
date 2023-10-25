"use client";
import axios from '../../axios';
import { useEffect, useState } from 'react';

function Page() {
  const [pipelineData, setPipelineData] = useState(null);
  const pipelineName = localStorage.getItem('pipeline');

  useEffect(() => {
    async function fetchPipelineData() {
      try {
        const response = await axios.get('/pipeline_state', {
          params: {
            pipeline: `${pipelineName}`,
          },
        });

        setPipelineData(response.data);

        console.log(response.data);
      } catch (error) {
        console.error('Error fetching pipeline data:', error.message);
      }
    }

    fetchPipelineData();
  }, []);

  return (
    <div>
      <h1 className='text-center mt-5 font-semibold text-2xl text-red-600'>Pipeline State: {pipelineName}</h1>
      {pipelineData && (
        <pre>{JSON.stringify(pipelineData, null, 2)}</pre>
      )}
    </div>
  );
}

export default Page;
