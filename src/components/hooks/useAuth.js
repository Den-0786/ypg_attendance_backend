'use client';
import { useRouter } from 'next/navigation'; 
import { useAuthStore } from '@components/store/authStore';
import { toast } from 'react-hot-toast';


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
      const res = await fetch(`/api/session-status`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });

      if (!res.ok) {
        // Don't show error for 401/403 as it's normal for non-logged in users
        if (res.status !== 401 && res.status !== 403) {
          toast.error(`Session check failed (${res.status})`);
        }
        setLoggedIn(false);
        setUserRole(null);
        setMeetingSet(false);
        return;
      }

      const data = await res.json();
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
      // Only show error if it's not a network connectivity issue
      if (err.name !== 'TypeError' || !err.message.includes('fetch')) {
        toast.error('Network error during session check');
      }
      setLoggedIn(false);
      setUserRole(null);
      setMeetingSet(false);
    }
  };

const handleLogin = async (username, password) => {
  try {
    const res = await fetch(`/api/login-django`, {
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
    
    // Set auth state immediately
    setLoggedIn(true);
    setUserRole(data.role);
    // Always set meetingSet to true for admin
    setMeetingSet(data.role === 'admin' ? true : false);
    
    // Wait a moment for session to be set, then verify
    setTimeout(() => {
      checkSession();
    }, 500); // Increased delay to 500ms
    
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
      await fetch(`/api/logout`, {
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
