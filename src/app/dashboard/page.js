'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@components/DashboardComponent';
import { useAuth } from '@components/hooks/useAuth';
import { toast } from 'react-hot-toast';

// Custom toast component for no meeting notification (same as in useAuth)
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
            Please set up a meeting for council members to submit attendance
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

export default function AdminPage() {
  const { checkSession, loggedIn, userRole, handleLogout } = useAuth();
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const hasShownNoMeetingToast = useRef(false);
  const hasCheckedSession = useRef(false);
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [loadingMeeting, setLoadingMeeting] = useState(false);

  // Check localStorage for toast state on mount
  useEffect(() => {
    const hasShown = localStorage.getItem('hasShownNoMeetingToast');
    if (hasShown === 'true') {
      hasShownNoMeetingToast.current = true;
    }
  }, []);

  // List of executive roles that can access dashboard
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const executiveRoles = [
    'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
    'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
  ];

  // Check if there's an active meeting
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkActiveMeeting = async () => {
    try {
      const res = await fetch('/api/current-meeting', {
        credentials: 'include'
      });
      const data = await res.json();
      
      // Show notification if no meeting is set and we haven't shown it yet
      if ((!data || data.error) && !hasShownNoMeetingToast.current) {
        toast.custom((t) => (
          <NoMeetingToast onClose={() => toast.dismiss(t.id)} />
        ), { duration: 6000 });
        hasShownNoMeetingToast.current = true;
        localStorage.setItem('hasShownNoMeetingToast', 'true');
      }
    } catch (error) {
      // Show notification on error too if we haven't shown it yet
      if (!hasShownNoMeetingToast.current) {
        toast.custom((t) => (
          <NoMeetingToast onClose={() => toast.dismiss(t.id)} />
        ), { duration: 6000 });
        hasShownNoMeetingToast.current = true;
        localStorage.setItem('hasShownNoMeetingToast', 'true');
      }
    }
  };

  // 1. Check session on mount only if not already logged in and we haven't checked yet
  useEffect(() => {
    if (!hasCheckedSession.current) {
      hasCheckedSession.current = true;
      // Always check session to ensure we have valid credentials
      checkSession().finally(() => setCheckingSession(false));
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
      } else if (loggedIn && executiveRoles.includes(userRole)) {
        // Check for active meeting when executive logs in
        checkActiveMeeting();
      }
    }
  }, [loggedIn, userRole, checkingSession, router, checkActiveMeeting, executiveRoles]);

  // 3. Admin meeting check - always called but only executes when conditions are met
  useEffect(() => {
    if (loggedIn && userRole === 'admin') {
      // Admin: fetch current meeting to decide what to show
      setLoadingMeeting(true);
      fetch(`/api/current-meeting`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setMeetingInfo(data);
            setShowMeetingForm(false);
          } else {
            setMeetingInfo(null);
            setShowMeetingForm(true);
          }
          setLoadingMeeting(false);
        })
        .catch(() => {
          setMeetingInfo(null);
          setShowMeetingForm(true);
          setLoadingMeeting(false);
        });
    }
  }, [loggedIn, userRole]);

  // 4. Redirect if not logged in - always called
  useEffect(() => {
    if (!loggedIn) {
      router.replace('/');
    }
  }, [loggedIn, router]);

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
