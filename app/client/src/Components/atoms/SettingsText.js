import React from 'react'

const SettingsText = ({Heading, Description}) => {
  return (
    <div>
    <p className="text-xl md:text-2xl font-semibold">{Heading}</p>
    <p className="text-gray-300 hidden xs:block mt-2 text-sm text-justify">
      {Description}
    </p>
  </div>
  )
}

export default SettingsText