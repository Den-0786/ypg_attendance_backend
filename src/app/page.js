// ✅ TODO: After login is stable and project grows:

// 1. Move this logic to _app.js or layout.tsx for global auth protection.
// 2. Add route guards or middleware to redirect unauthenticated users.
// 3. Replace Zustand with Redux if you need more complex state handling.
// */

'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@components/hooks/useAuth';
import LoginForm from '@components/LoginForm';

export default function Page() {
  const { checkSession, handleLogin, loggedIn, userRole } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const hasCheckedSession = useRef(false);

  // List of executive roles
  const executiveRoles = [
    'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
    'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
  ];

  // Run session check once on mount only if not already logged in and we haven't checked yet
  useEffect(() => {
    if (!hasCheckedSession.current) {
      hasCheckedSession.current = true;
      if (!loggedIn) {
        checkSession().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect after session check is complete
  useEffect(() => {
    if (!isLoading && loggedIn) {
      if (executiveRoles.includes(userRole)) {
        router.replace('/dashboard');
      } else if (userRole === 'meeting_user' || userRole === 'user') {
        router.replace('/forms');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loggedIn, userRole]);

  const onLogin = async (username, password) => {
    setLoginLoading(true);
    const role = await handleLogin(username, password);
    if (executiveRoles.includes(role)) {
      router.replace('/dashboard');
    } else if (role === 'meeting_user' || role === 'user') {
      router.replace('/forms');
    }
  };

  // Prevent flashing anything until session is checked or during login
  if (isLoading || loginLoading || (loggedIn && userRole)) {
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
