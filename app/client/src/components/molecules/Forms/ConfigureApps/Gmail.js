'use client'
import { useState } from "react";


const Gmail = () => {
    const [email, setEmail] = useState('');
  return (
    <div className="border flex flex-col rounded-md border-gray-500 shadow shadow-blue-500 p-5 sm:p-8 max-w-[450px] sm:py-12">
    <div className="mb-8">
        <p className="text-xl xs:text-2xl font-bold mb-3">Gmail Setup</p>
        <p>Stay connected with ease: Configure your email effortlessly to ensure continuity in receiving updates, alerts, and communications regarding your account and activities.</p>
    </div>
    <div className="w-[100%] flex flex-col mb-10">
      <label htmlFor="email" className="my-2 sm:text-lg">
        Email
      </label>
      <input
        className="border-2 w-full py-2 px-3 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
        placeholder="example@gmail.com"
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </div>
    <button className="bg-purple-600 py-2 rounded-lg text-lg font-semibold">Configure</button>
</div>
  )
}

export default Gmail