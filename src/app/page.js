// ✅ TODO: After login is stable and project grows:

// 1. Move this logic to _app.js or layout.tsx for global auth protection.
// 2. Add route guards or middleware to redirect unauthenticated users.
// 3. Replace Zustand with Redux if you need more complex state handling.
// */

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@components/hooks/useAuth';
import LoginForm from '@components/LoginForm';

export default function Page() {
  const { checkSession, handleLogin, loggedIn, userRole } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // List of executive roles
  const executiveRoles = [
    'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
    'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
  ];

  // Run session check once on mount
  useEffect(() => {
    checkSession().finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect after session check is complete
  useEffect(() => {
    if (!isLoading && loggedIn) {
      if (executiveRoles.includes(userRole)) {
        router.replace('/dashboard');
      } else if (userRole === 'meeting_user') {
        router.replace('/forms');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loggedIn, userRole]);

  const onLogin = async (username, password) => {
    const role = await handleLogin(username, password);
    if (executiveRoles.includes(role)) {
      router.replace('/dashboard');
    } else if (role === 'meeting_user') {
      router.replace('/forms');
    }
  };

  // Prevent flashing anything until session is checked
  if (isLoading || (loggedIn && userRole)) return null;

  return <LoginForm onLogin={onLogin} />;
}
