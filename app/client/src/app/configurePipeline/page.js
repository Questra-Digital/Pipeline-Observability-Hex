'use client';
import { useRouter } from 'next/navigation';
import axios from '../../axios/axios';
import React, { useState } from 'react';

function Page() {
  const [token, setToken] = useState('');
  const router = useRouter();

  const handleTokenSubmission = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/storetoken', { token }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const message = response.data.message;
      // console.log(response.data);
      console.log(message);
      if(message == "Token inserted successfully")
      {
        router.push('/pipelines');
      }
      else{
        setToken('');
        alert('Try Again!!!')
      }

    } catch (error) {
      const message = error.response.data.message;
      console.log(error);
      console.log(message);
      if(message === "Email already registered")
      {
        router.push('/pipelines');
      }
      else{
        setToken('');
        alert('Try Again!!!')
      }
    }
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <form className="h-[400px] w-[250px] sm:w-[300px] md:w-[400px] border-solid border-gray-100 border-2 rounded-sm items-center flex flex-col flex-wrap p-5" onSubmit={handleTokenSubmission}>
        <h1 className="text-xl mt-5 mb-10 font-semibold">Configure ArgoCD</h1>
        <input
          className="inline-block placeholder:text-gray-500 px-2 py-2 w-[100%] rounded-sm outline-none text-black"
          type="text"
          required
          placeholder="Enter ArgoCD Token"
          value={token}
          onChange={(e) => { setToken(e.target.value) }}
        />
        <input
          className="inline-block bg-green-600 px-6 py-2 text-lg my-5 cursor-pointer hover:bg-green-500 shadow-md shadow-gray-500 rounded transform duration-300"
          type="submit"
          value="Submit"
        />
      </form>
    </div>
  );
}

export default Page;
