'use client';

import { useAuthStore } from './store/authStore';
import AutoLogout from './AutoLogout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function AutoLogoutWrapper() {
  const store = useAuthStore();
  const loggedIn = store.loggedIn;
  const setLoggedIn = store.setLoggedIn;
  const setUserRole = store.setUserRole;
  
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
        }
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (typeof setLoggedIn === 'function') {
        setLoggedIn(false);
      }
      if (typeof setUserRole === 'function') {
        setUserRole(null);
      }
      window.location.href = '/';
    }
  };

  return <AutoLogout loggedIn={loggedIn} onLogout={handleLogout} />;
} 