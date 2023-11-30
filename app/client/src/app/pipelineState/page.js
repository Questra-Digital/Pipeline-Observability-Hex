'use client'
import { useEffect, useState } from 'react';

function Page() {
  // State to store Pipeline Data
  const [pipelineData, setPipelineData] = useState([]);

  // Getting Pipeline Names from localStorage
  const pipelineName = localStorage.getItem('pipeline');

  useEffect(() => {
    // Websocket Connection
    const ws = new WebSocket('ws://localhost:8000/pipeline_state');

    // Sending pipeline name as message
    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({ Name: pipelineName }));
    };

    // Listening for Any message received from server
    ws.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);
      console.log(receivedData);
      
      // Update pipelineData
      setPipelineData(prevData => [...prevData, receivedData]);
    };

    // Handling Any error in websocket
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Closing connection while unmounting the courrent page.
    return () => {
      console.log('Closing WebSocket Connection!');
      ws.close();
    };
  }, [pipelineName]);

  return (
    <div>
      <h1 className='text-center mt-5 font-semibold text-2xl text-red-600'>Pipeline State: {pipelineName}</h1>
      {pipelineData.map((data, index) => (
        <pre key={index}>{JSON.stringify(data, null, 2)}</pre>
      ))}
    </div>
  );
}

export default Page;
