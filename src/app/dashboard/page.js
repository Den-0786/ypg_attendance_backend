'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@components/DashboardComponent';
import { useAuth } from '@components/hooks/useAuth';

export default function AdminPage() {
  const { checkSession, loggedIn, userRole, handleLogout } = useAuth();
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const hasCheckedSession = useRef(false);

  // List of executive roles that can access dashboard
  const executiveRoles = [
    'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
    'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
  ];

  // 1. Check session on mount only if not already logged in and we haven't checked yet
  useEffect(() => {
    if (!hasCheckedSession.current) {
      hasCheckedSession.current = true;
      if (!loggedIn) {
        checkSession().finally(() => setCheckingSession(false));
      } else {
        setCheckingSession(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Redirect based on role
  useEffect(() => {
    if (!checkingSession) {
      if (!loggedIn) {
        router.replace('/');
      } else if (userRole && !executiveRoles.includes(userRole)) {
        router.replace('/forms');
      }
    }
  }, [loggedIn, userRole, checkingSession, router]);

  // 3. Show loading while verifying session or redirecting
  let loadingMessage = "Loading...";
  if (checkingSession) {
    loadingMessage = "Checking session...";
  } else if (!loggedIn) {
    loadingMessage = "Loading login page...";
  } else if (userRole && !executiveRoles.includes(userRole)) {
    loadingMessage = "Loading forms page...";
  } else {
    loadingMessage = "Loading dashboard...";
  }

  if (checkingSession || !loggedIn || !executiveRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        {loadingMessage}
      </div>
    );
  }

  return <Dashboard onLogout={handleLogout} />;
}
