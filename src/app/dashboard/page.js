'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@components/DashboardComponent';
import { useAuth } from '@components/hooks/useAuth';

export default function AdminPage() {
  const { checkSession, loggedIn, userRole, handleLogout } = useAuth();
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  // 1. Check session on mount
  useEffect(() => {
    checkSession().finally(() => setCheckingSession(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Redirect based on role
  useEffect(() => {
    if (!checkingSession) {
      if (!loggedIn) {
        router.replace('/');
      } else if (userRole && userRole !== 'admin') {
        router.replace('/forms');
      }
    }
  }, [loggedIn, userRole, checkingSession, router]);

  // 3. Show loading while verifying session or redirecting
  if (checkingSession || !loggedIn || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return <Dashboard onLogout={handleLogout} />;
}
