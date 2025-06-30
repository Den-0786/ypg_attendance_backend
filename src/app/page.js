// ✅ TODO: After login is stable and project grows:

// 1. Move this logic to _app.js or layout.tsx for global auth protection.
// 2. Add route guards or middleware to redirect unauthenticated users.
// 3. Replace Zustand with Redux if you need more complex state handling.
// */

'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@components/hooks/useAuth';
import { useAuthStore } from '@components/store/authStore';
import LoginForm from '@components/LoginForm';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function Page() {
  const { handleLogin, loggedIn, userRole } = useAuth();
  const store = useAuthStore();
  const setLoggedIn = store.setLoggedIn;
  const setUserRole = store.setUserRole;
  const setMeetingSet = store.setMeetingSet;
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const hasInitialized = useRef(false);

  // Only admin and user roles are supported
  const allowedRoles = ['admin', 'user'];

  // Always start fresh - clear any existing session state
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      
      // Clear any existing session state immediately
      if (typeof setLoggedIn === 'function') {
        setLoggedIn(false);
      }
      if (typeof setUserRole === 'function') {
        setUserRole(null);
      }
      if (typeof setMeetingSet === 'function') {
        setMeetingSet(false);
      }
      
      // Clear any stored session data
      if (typeof window !== 'undefined') {
        // Clear localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear server-side session
        fetch(`${API_URL}/api/logout`, {
          method: 'POST',
          credentials: 'include',
        }).catch(() => {
          // Ignore errors - we just want to clear any existing session
        });
      }
      
      setIsLoading(false);
    }
  }, [setLoggedIn, setUserRole, setMeetingSet]);

  // Redirect after successful login
  useEffect(() => {
    if (!isLoading && loggedIn && userRole) {
      if (userRole === 'admin') {
        router.replace('/dashboard');
      } else if (userRole === 'user') {
        router.replace('/forms');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loggedIn, userRole]);

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
      // Handle login errors gracefully without logging to console
      if (error.isLoginError) {
        // This is a login error, toast is already shown in useAuth
        // Don't log to console or show duplicate toast
      } else {
        // This is a different type of error, log it for debugging
        console.error('Login failed:', error);
        // Don't show duplicate toast since useAuth already handles it
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Show loading only during login process
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

// Add spinner CSS if not present
// .loader { border-style: solid; border-radius: 50%; border-width: 8px; border-top-width: 8px; animation: spin 1s linear infinite; }
// @keyframes spin { 100% { transform: rotate(360deg); } }
