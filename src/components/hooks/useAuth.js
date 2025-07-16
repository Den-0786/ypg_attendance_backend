'use client';
import { useRouter } from 'next/navigation'; 
import { useAuthStore } from '@components/store/authStore';
import { toast } from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { useMeetingDate } from '../MeetingDateContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Custom toast component for no meeting notification
const NoMeetingToast = ({ onClose }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onClose, 500); // Close after animation completes
          return 100;
        }
        return prev + 2; // Increment by 2% every 100ms for 5 second duration
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onClose]);

  return (
    <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 max-w-sm w-full shadow-lg">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            No Active Meeting
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
            Please contact an executive to set up a meeting
          </p>
          {/* Progress bar */}
          <div className="mt-3 bg-blue-200 dark:bg-blue-700 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export function useAuth() {
  const router = useRouter(); 
  const store = useAuthStore();
  const loggedIn = store.loggedIn;
  const setLoggedIn = store.setLoggedIn;
  const setUserRole = store.setUserRole;
  const setMeetingSet = store.setMeetingSet;
  const userRole = store.userRole;
  const meetingSet = store.meetingSet;
  const { setMeetingDate, setMeetingTitle } = useMeetingDate ? useMeetingDate() : { setMeetingDate: () => {}, setMeetingTitle: () => {} };

  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      // Check if API_URL is set
      if (!API_URL) {
        console.error('API_URL is not set. Please check your environment variables.');
        throw new Error('API_URL not configured');
      }
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_URL}/api/session-status`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.loggedIn) {
        if (typeof setLoggedIn === 'function') {
          setLoggedIn(true);
        }
        if (typeof setUserRole === 'function') {
          setUserRole(data.role);
        }
      } else {
        if (typeof setLoggedIn === 'function') {
          setLoggedIn(false);
        }
        if (typeof setUserRole === 'function') {
          setUserRole(null);
        }
      }
    } catch (err) {
      console.error('Session check failed:', err);
      // Don't automatically set loggedIn to false on network errors
      // Only set to false if we get a clear response that user is not logged in
      if (err.message.includes('401') || err.message.includes('403')) {
        if (typeof setLoggedIn === 'function') {
          setLoggedIn(false);
        }
        if (typeof setUserRole === 'function') {
          setUserRole(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      toast.success('Logged out successfully');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hasShownNoMeetingToast');
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
      }
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed');
    } finally {
      if (typeof setLoggedIn === 'function') {
        setLoggedIn(false);
      }
      if (typeof setUserRole === 'function') {
        setUserRole(null);
      }
      router.replace('/login');
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.access) {
        localStorage.setItem(TOKEN_KEY, data.access);
        localStorage.setItem(REFRESH_KEY, data.refresh);
        if (typeof setLoggedIn === 'function') {
          setLoggedIn(true);
        }
        // Get role from session-status endpoint
        let role = 'user';
        try {
          const sessionRes = await fetch(`${API_URL}/api/session-status`, {
            headers: {
              'Authorization': `Bearer ${data.access}`,
              'Accept': 'application/json',
            },
          });
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            if (sessionData.role) {
              role = sessionData.role;
              if (typeof setUserRole === 'function') {
                setUserRole(role);
              }
            }
          }
        } catch (e) {
          // fallback to default role
        }
        toast.success('Login successful');
        // Redirect based on role
        if (role === 'admin') {
          router.replace('/dashboard');
        } else {
          router.replace('/forms');
        }
        return role;
      } else {
        toast.error(data.detail || 'Invalid credentials');
        const error = new Error(data.detail || 'Invalid credentials');
        error.isLoginError = true;
        throw error;
      }
    } catch (err) {
      toast.error('Login failed. Please try again.');
      err.isLoginError = true;
      throw err;
    }
  };

  useEffect(() => {
    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loggedIn, userRole, loading, handleLogout, handleLogin, checkSession };
}
