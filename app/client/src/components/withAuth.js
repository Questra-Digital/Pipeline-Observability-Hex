'use client';
import { useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const withAuth = WrappedComponent => {
  return (props) => {
    const Router = useRouter();
    const [loading, setLoading] = useState(true);

    useLayoutEffect(() => {
      const path = window.location.pathname;
      const userDataStr = localStorage.getItem('userData');
      let token = null;

      if (userDataStr) {
        try {
          token = JSON.parse(userDataStr)?.token;
        } catch (e) {
          console.error("Error parsing userData from localStorage", e);
        }
      }

      if (!token && (!path?.includes('/login') && !path?.includes('/register') && path !== '/')) {
        Router.replace('/login');
      } else if (token && (path?.includes('/login') || path?.includes('/register'))) {
        Router.replace('/home');
      }

      // Set loading to false after 1.5 seconds
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1500);

      return () => clearTimeout(timer);
    }, [Router]);

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;