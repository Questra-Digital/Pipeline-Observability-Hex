'use client'
import Login from '@/components/organisms/Login'
import React from 'react'
import withAuth from '@/components/withAuth'

const page = () => {
  return (
    <Login/>
  )
}

export default withAuth(page);