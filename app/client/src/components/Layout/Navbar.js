'use client'
import ImageAtom from '@/components/atoms/ImageAtom'
import React, { useState, useEffect } from 'react'


const Navbar = () => {
  const [capitalizedFirstPart, setCapitalizedFirstPart] = useState('');
  const [email, setEmail] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // extract the browser url first part after hostname and capitalize it
    setCapitalizedFirstPart(window.location.pathname.split('/')[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
  }, []);

  useEffect(() => {
    // Fetch email from local storage
    const storedEmail = JSON.parse(localStorage.getItem('userData')).email;
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleImageHover = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div className=" border-gray-600 bg-[#212121] px-5 py-3 flex justify-between items-center">
      <p className='text-lg font-semibold capitalize'>{capitalizedFirstPart}</p>
      <div className='relative w-[30px] h-[30px] border-2 border-gray-600 rounded-full' onMouseOver={handleImageHover} onMouseLeave={handleMouseLeave}>
        <ImageAtom
          src="/assets/Images/profile.png"
          width={100}
          height={100}
          alt="Profile"
        />
        {showTooltip && (
          <div className="absolute -bottom-[10%] left-[0%] transform translate-x-[-100%] bg-gray-800 text-white px-2 py-1 rounded-md">
            {email}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
