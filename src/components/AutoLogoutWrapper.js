'use client';

import { useAuthStore } from './store/authStore';
import AutoLogout from './AutoLogout';

export default function AutoLogoutWrapper() {
  const store = useAuthStore();
  const loggedIn = store.loggedIn;
  const setLoggedIn = store.setLoggedIn;
  const setUserRole = store.setUserRole;
  
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
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