'use client'
import { useState } from "react"


const ArgoCD = () => {
    const [token, setToken] = useState('');

  return (
    <div className="border flex flex-col rounded-md border-gray-500 shadow shadow-blue-500 p-5 sm:p-8 max-w-[450px] sm:py-12">
        <div className="mb-8">
            <p className="text-xl xs:text-2xl font-bold mb-3">ArgoCD Setup</p>
            <p>Ensure uninterrupted insights: Keep your monitoring current with a ArgoCD token, ensuring seamless access to real-time analytics for informed decision-making.</p>
        </div>
        <div className="w-[100%] flex flex-col mb-10">
          <label htmlFor="token" className="my-2 sm:text-lg">
            ArgoCD Token
          </label>
          <input
            className="border-2 w-full py-2 px-3 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
            placeholder="xxxxxx-xxxxxx-xxxxxx-xxxxxx"
            type="text"
            name="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <button className="bg-purple-600 py-2 rounded-lg text-lg font-semibold">Configure</button>
    </div>
  )
}

export default ArgoCD