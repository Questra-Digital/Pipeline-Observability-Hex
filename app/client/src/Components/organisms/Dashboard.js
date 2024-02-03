'use client'
import { useEffect, useState } from 'react';
import CardContainer from '@/Components/molecules/Dashboard/CardContainer';
import TimeSeriesGraph from '@/Components/molecules/Dashboard/TimeSeriesGraph';
import TextAtom from '../atoms/TextAtom';

function Dashboard() {
  const [pipelineData, setPipelineData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [pipelineName, setPipelineName] = useState('');

  useEffect(() => {
    setPipelineName(localStorage.getItem('pipeline'));
    // Web Socket Connection
    const ws = new WebSocket('ws://localhost:8000/pipeline_state');

    // On connection open sending data(pipeline name)
    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({ Name: pipelineName }));
    };

    // Receving data from the server
    ws.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);
      console.log(receivedData);

      const updatedData = {
        ...receivedData,
        timestamp: new Date().toISOString(),
      };

      // Update pipelineData in increasing order
      setPipelineData((prevData) => [...prevData, updatedData]);
      setCurrentData(receivedData);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      console.log('Closing WebSocket Connection!');
      ws.close();
    };
  }, [pipelineName]);

  return (
    <div>
        <TextAtom properties={"pl-4 sm:pl-10 md:pl-20 font-semibold text-2xl my-10"} text={"Dashboard | "}>
        <span className='text-gray-400 text-2xl'>{pipelineName}</span>
        </TextAtom>
      <CardContainer data={currentData} />
      <div className='flex justify-center items-center my-7'>
    <div className='md:w-[70vw]'>
      <TimeSeriesGraph data={pipelineData} />
    </div>
  </div>
    </div>
  );
}

export default Dashboard;
