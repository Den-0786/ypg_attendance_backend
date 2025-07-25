/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@components/hooks/useAuth';
import { useAuthStore } from '@components/store/authStore';
import LoginForm from '@components/LoginForm';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function LoginPage() {
  const { handleLogin, loggedIn, userRole } = useAuth();
  const store = useAuthStore();

// sourcery skip: use-object-destructuring
  const setLoggedIn = store.setLoggedIn;
  const setUserRole = store.setUserRole;
  const setMeetingSet = store.setMeetingSet;
  
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const hasInitialized = useRef(false);

  
  const allowedRoles = ['admin', 'user'];


  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      setIsLoading(false);
    }
  }, [setLoggedIn, setUserRole, setMeetingSet]);

  // Remove the automatic redirect when already logged in
  // Users should always see the login form and enter credentials

  const onLogin = async (username, password) => {
    setLoginLoading(true);
    try {
      const role = await handleLogin(username, password);
      if (role === 'admin') {
        router.replace('/dashboard');
      } else if (role === 'user') {
        router.replace('/forms');
      }
    } catch (error) {

      if (error.isLoginError) {
        
      } else {
        
        console.error('Login failed:', error);
        
      }
    } finally {
      setLoginLoading(false);
    }
  };

  
  if (isLoading || loginLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-12 w-12 mb-4 animate-spin border-t-blue-600"></div>
        <span className="ml-4">Loading...</span>
      </div>
    );
  }

  return <LoginForm onLogin={onLogin} />;
} 