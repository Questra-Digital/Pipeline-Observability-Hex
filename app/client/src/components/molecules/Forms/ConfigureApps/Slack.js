'use client'
import { useState } from "react"

const Slack = () => {
    const [botToken, setBotToken] = useState('');
    const [channelID, setChannelID] = useState('');

  return (
    <div className="border flex flex-col rounded-md border-gray-500 shadow shadow-blue-500 p-5 sm:p-8 max-w-[450px] sm:py-12">
    <div className="mb-8">
        <p className="text-xl xs:text-2xl font-bold mb-3">Slack Setup</p>
        <p>Empower your communication flow: Stay synced across platforms by Setting up Slack, empowering your team with synchronized communication channels for efficient collaboration.</p>
    </div>
    <div className="w-[100%] flex flex-col mb-10">
      <label htmlFor="botToken" className="my-2 sm:text-lg">
        Bot Token
      </label>
      <input
        className="border-2 w-full py-2 px-3 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
        placeholder="xxxxxx-xxxxxx-xxxxxx-xxxxxx"
        type="text"
        name="botToken"
        value={botToken}
        onChange={(e) => setBotToken(e.target.value)}
      />
            <label htmlFor="botToken" className="my-2 sm:text-lg">
        Channel ID
      </label>
      <input
        className="border-2 w-full py-2 px-3 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
        placeholder="CXXXXXXXXXX"
        type="text"
        name="botToken"
        value={botToken}
        onChange={(e) => setBotToken(e.target.value)}
      />
    </div>
    <button className="bg-purple-600 py-2 rounded-lg text-lg font-semibold">Configure</button>
</div>
  )
}

export default Slack