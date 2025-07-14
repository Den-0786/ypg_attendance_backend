'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@components/hooks/useAuth';
import { useMeetingDate } from '@components/MeetingDateContext';
import MeetingDateForm from '@components/MeetingDateForm';
import MainApp from '@components/MainApp';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
            Please contact the executive to set up a meeting detail
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

export default function MeetingPage() {
  const { loggedIn, userRole, handleLogout } = useAuth();
  const { meetingDate: contextMeetingDate, meetingTitle: contextMeetingTitle } = useMeetingDate();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('attendance');
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [loadingMeeting, setLoadingMeeting] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingSet, setMeetingSet] = useState(false);
  const hasShownNoMeetingToast = useRef(false);

  // Check localStorage for toast state on mount
  useEffect(() => {
    const hasShown = localStorage.getItem('hasShownNoMeetingToast');
    if (hasShown === 'true') {
      hasShownNoMeetingToast.current = true;
    }
  }, []);

  // Only admin and user roles are supported
  const allowedRoles = ['admin', 'user'];

  useEffect(() => {
    if (!loggedIn) {
      router.replace('/');
    }
    // Remove the check that only shows set meeting form for admin
    // Always allow showing the set meeting form for both admin and user
    setLoadingMeeting(true);
    fetch(`${API_URL}/api/current-meeting`, {
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
  }, [loggedIn, userRole, router]);

  // Don't render anything until login state is confirmed
  if (!loggedIn || userRole === null) {
    return null;
  }

  // Show MeetingDateForm if showMeetingForm is true (for all users)
  if (showMeetingForm) {
    return <MeetingDateForm 
      onClose={() => {
        setShowMeetingForm(false);
        if (userRole === 'admin') {
          setMeetingInfo({ 
            date: 'No Meeting Set', 
            title: 'No Active Meeting',
            allowLogout: true 
          });
        }
      }}
      onMeetingSet={() => {
        setShowMeetingForm(false);
        setLoadingMeeting(true);
        
        // Multiple attempts to fetch meeting info for Chrome compatibility
        const fetchMeetingInfo = async (attempt = 1) => {
          try {
            const res = await fetch(`${API_URL}/api/current-meeting`, { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              if (data.meeting) {
                setMeetingInfo(data.meeting);
                setLoadingMeeting(false);
              } else {
                setMeetingInfo(null);
                setLoadingMeeting(false);
              }
            } else {
              throw new Error(`HTTP ${res.status}`);
            }
          } catch (error) {
            if (attempt < 3) {
              setTimeout(() => fetchMeetingInfo(attempt + 1), 1000);
            } else {
              console.error('Error fetching meeting:', error);
              setLoadingMeeting(false);
              
              // Chrome-specific fix for meeting info issues
              if (navigator.userAgent.includes('Chrome')) {
                window.location.reload();
              }
            }
          }
        };
        
        // Start fetching with delay
        setTimeout(() => fetchMeetingInfo(), 500);
      }} 
    />;
  }

  // Admin flow: show MeetingDateForm if no meeting, else MainApp
  if (userRole === 'admin') {
    if (loadingMeeting) {
      return <div className="min-h-screen flex items-center justify-center">Loading meeting info...</div>;
    }
    if (!meetingInfo) {
      if (contextMeetingDate && contextMeetingTitle) {
        const fallbackMeetingInfo = {
          date: contextMeetingDate,
          title: contextMeetingTitle
        };
        return <MainApp activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} meetingInfo={fallbackMeetingInfo} showManageMeeting={true} onManageMeeting={() => setShowMeetingForm(true)} />;
      }
      if (userRole === 'admin') {
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">No Active Meeting</h2>
              <p className="text-gray-600 mb-6">
                There is currently no active meeting set. You can set a new meeting or logout.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowMeetingForm(true)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Set New Meeting
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        );
      }
      return <div className="min-h-screen flex items-center justify-center text-red-500">No active meeting set. Please contact the admin.</div>;
    }
    // Show MainApp with meeting info and add a "Manage Meeting" button
    return (
      <div>
        <MainApp 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          handleLogout={handleLogout} 
          meetingInfo={meetingInfo}
          showManageMeeting={true}
          onManageMeeting={() => setShowMeetingForm(true)}
        />
      </div>
    );
  }

  // User flow: show MainApp with Manage Meeting button for all users
  if (userRole === 'user') {
    if (loadingMeeting) {
      return <div className="min-h-screen flex items-center justify-center">Loading meeting info...</div>;
    }
    if (!meetingInfo) {
      if (contextMeetingDate && contextMeetingTitle) {
        const fallbackMeetingInfo = {
          date: contextMeetingDate,
          title: contextMeetingTitle
        };
        return <MainApp activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} meetingInfo={fallbackMeetingInfo} showManageMeeting={true} onManageMeeting={() => setShowMeetingForm(true)} />;
      }
      // For users with no meeting, show MainApp with Manage Meeting button (toast will handle the notification)
      return <MainApp activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} meetingInfo={null} showManageMeeting={true} onManageMeeting={() => setShowMeetingForm(true)} />;
    }
    return <MainApp activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} meetingInfo={meetingInfo} showManageMeeting={true} onManageMeeting={() => setShowMeetingForm(true)} />;
  }

  return null;
}
