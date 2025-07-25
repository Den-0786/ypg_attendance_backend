'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AutoLogout({ loggedIn, onLogout }) {
  const logoutTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const [warningShown, setWarningShown] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const WARNING_TIMEOUT = 4 * 60 * 1000; // 4 minutes (1 minute before logout)

  const clearTimers = () => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  };

  const resetInactivityTimer = () => {
    clearTimers();
    setWarningShown(false);
    setLogoutPending(false);
    if (loggedIn) {
      // Set warning timer (1 minute before logout)
      warningTimerRef.current = setTimeout(() => {
        setWarningShown(true);
        setLogoutPending(true);
        toast((t) => (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Session Timeout Warning
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                You will be logged out in 1 minute due to inactivity.<br />
                <span className="font-semibold">Please click on the screen or press any key to stay logged in, or you will be logged out.</span>
              </p>
            </div>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                handleUserActivity();
              }}
              className="flex-shrink-0 text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ), {
          duration: 60000, // 1 minute
          style: {
            background: '#fef3c7',
            border: '1px solid #f59e0b',
          }
        });
        // Set logout timer for 1 minute after warning
        logoutTimerRef.current = setTimeout(() => {
          if (logoutPending) {
            toast.error('Session expired. You have been logged out due to inactivity.');
            onLogout();
          }
        }, 60 * 1000);
      }, WARNING_TIMEOUT);
    } else {
      // User not logged in, not starting timer
    }
  };

  // Handles any user activity (click, keypress, etc.)
  const handleUserActivity = () => {
    if (warningShown) {
      // If warning was shown and user interacts, cancel logout and reset everything
      setWarningShown(false);
      setLogoutPending(false);
      clearTimers();
      toast.dismiss(); // Dismiss all toasts on user activity
      resetInactivityTimer();
    } else {
      // If no warning, just reset timer as usual
      resetInactivityTimer();
    }
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });
    if (loggedIn) {
      resetInactivityTimer();
    }
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      clearTimers();
    };
  }, [loggedIn]);

  // This component doesn't render anything
  return null;
} 