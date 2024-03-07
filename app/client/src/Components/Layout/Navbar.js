import ImageAtom from '@/Components/atoms/ImageAtom'
import React from 'react'

const Navbar = () => {
  return (
    <div className=" border-gray-600 bg-zinc-800 px-5 py-3 flex justify-between items-center">
        <p className='text-lg font-semibold'>Home</p>
        <div className='w-[30px] h-[30px] border-2 border-gray-600 rounded-full'>
        <ImageAtom
            src="/assets/Images/profile.png"
            width={100}
            height={100}
            alt="Profile"
        />
        </div>
    </div>
  )
}

export default Navbar