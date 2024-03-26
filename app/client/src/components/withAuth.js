'use client';
import { useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const withAuth = WrappedComponent => {
    return (props) => {
      const Router = useRouter();
      const path = window.location.pathname;
      const [loading, setLoading] = useState(true);
  
      useLayoutEffect(() => {        
        const token = JSON.parse(localStorage.getItem('userData')).token;
        if (!token && (!path?.includes('/login') || !path?.match('login') || !path?.match('/') )) {
          Router.replace('/login');
        } else if(token && (path?.includes('/login') || path?.match('login'))){
          Router.replace('/home');
        }
        
        // Set loading to false after 1 seconds
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      }, []);
  
      return <WrappedComponent {...props} />;
    };
};

export default withAuth;