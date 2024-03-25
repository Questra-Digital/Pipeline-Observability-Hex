import React from 'react'
import ImageAtom from './ImageAtom'

const BackButton = () => {
  return (
    <div className='self-start px-7 py-3'>
        <button onClick={() => window.history.back()}>
            <ImageAtom src='/assets/Images/back.png' width={30} height={30} alt='back button' />
        </button>
    </div>
  )
}

export default BackButton