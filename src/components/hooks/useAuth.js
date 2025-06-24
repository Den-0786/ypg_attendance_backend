'use client';
import { useRouter } from 'next/navigation'; 
import { useAuthStore } from '@components/store/authStore';
import { toast } from 'react-hot-toast';

const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://ypg-attendance-backend-1.onrender.com'
    : 'http://localhost:8000';

export function useAuth() {
  const router = useRouter(); 
  const {
    loggedIn,
    setLoggedIn,
    setUserRole,
    setMeetingSet,
    userRole,
    meetingSet,
  } = useAuthStore();

  const checkSession = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/session-status/`, {
        credentials: 'include',
      });

      if (!res.ok) {
        toast.error(`Session check failed (${res.status})`);
        setLoggedIn(false);
        setUserRole(null);
        setMeetingSet(false);
        return;
      }

      const data = await res.json();
      console.log('LOGIN RESPONSE:', data);
      if (data.loggedIn) {
        setLoggedIn(true);
        setUserRole(data.role);
        setMeetingSet(data.role === 'admin' ? true : data.meetingSet || false);
      } else {
        setLoggedIn(false);
        setUserRole(null);
        setMeetingSet(false);
      }
    } catch (err) {
      toast.error('Network error during session check');
    }
  };

const handleLogin = async (username, password) => {
  try {
    const res = await fetch(`${BASE_URL}/api/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      let errorData = {};
      try {
        errorData = await res.json();
      } catch {}
      toast.error(errorData.error || `Login failed (${res.status})`);
      return false; // Return false to indicate failed login
    }

    const data = await res.json();
    setLoggedIn(true);
    setUserRole(data.role);
    // Always set meetingSet to true for admin
    setMeetingSet(data.role === 'admin' ? true : false);
    toast.success('Login successful!');
    
    // Return the role for immediate redirection
    return data.role;
  } catch (err) {
    toast.error('Login network error');
    return false;
  }
};
  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/api/logout/`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setLoggedIn(false);
    setUserRole(null);
    setMeetingSet(false);
    toast.success('Logged out');
    router.replace('/');
  };

  return {
    checkSession,
    handleLogin,
    handleLogout,
    loggedIn,
    userRole,
    meetingSet,
    setMeetingSet,
  };
}
