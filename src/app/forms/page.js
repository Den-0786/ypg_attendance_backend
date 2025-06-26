'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@components/hooks/useAuth';
import { useMeetingDate } from '@components/MeetingDateContext';
import MeetingDateForm from '@components/MeetingDateForm';
import MainApp from '@components/MainApp';

export default function MeetingPage() {
  const { loggedIn, userRole, handleLogout } = useAuth();
  const { meetingDate: contextMeetingDate, meetingTitle: contextMeetingTitle } = useMeetingDate();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('attendance');
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [loadingMeeting, setLoadingMeeting] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingSet, setMeetingSet] = useState(false);
  const executiveRoles = [
    'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
    'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
  ];

  useEffect(() => {
    if (!loggedIn) {
      router.replace('/');
    }
    if (loggedIn && executiveRoles.includes(userRole)) {
      // Executives: fetch current meeting to decide what to show
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
    if (loggedIn && (userRole === 'meeting_user' || userRole === 'user')) {
      setLoadingMeeting(true);
      fetch(`/api/current-meeting`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setMeetingInfo(data);
          }
          setLoadingMeeting(false);
        })
        .catch(() => setLoadingMeeting(false));
    }
  }, [loggedIn, userRole, router]);

  // Don't render anything until login state is confirmed
  if (!loggedIn || userRole === null) {
    return null;
  }

  // Executive flow: show MeetingDateForm if no meeting, else MainApp
  if (executiveRoles.includes(userRole)) {
    if (loadingMeeting) {
      return <div className="min-h-screen flex items-center justify-center">Loading meeting info...</div>;
    }
    if (showMeetingForm) {
      return <MeetingDateForm 
        onClose={() => {
          setShowMeetingForm(false);
          // For executives, if they close without setting a meeting, 
          // show the MainApp with a message that they can logout
          if (executiveRoles.includes(userRole)) {
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
          fetch(`/api/current-meeting`, {
            credentials: 'include'
          })
            .then(res => res.json())
            .then(data => {
              if (data && !data.error) {
                setMeetingInfo(data);
              }
              setLoadingMeeting(false);
            })
            .catch(() => setLoadingMeeting(false));
        }} 
      />;
    }
    if (!meetingInfo) {
      // Use context data as fallback
      if (contextMeetingDate && contextMeetingTitle) {
        const fallbackMeetingInfo = {
          date: contextMeetingDate,
          title: contextMeetingTitle
        };
        return <MainApp activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} meetingInfo={fallbackMeetingInfo} />;
      }
      // For executives, show MainApp even without meeting info so they can logout
      if (executiveRoles.includes(userRole)) {
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
      return <div className="min-h-screen flex items-center justify-center text-red-500">No active meeting set. Please contact an executive.</div>;
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

  // Meeting user flow: fetch and use meeting info
  if (userRole === 'meeting_user' || userRole === 'user') {
    if (loadingMeeting) {
      return <div className="min-h-screen flex items-center justify-center">Loading meeting info...</div>;
    }
    if (!meetingInfo) {
      // Use context data as fallback
      if (contextMeetingDate && contextMeetingTitle) {
        const fallbackMeetingInfo = {
          date: contextMeetingDate,
          title: contextMeetingTitle
        };
        return <MainApp activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} meetingInfo={fallbackMeetingInfo} />;
      }
      return <div className="min-h-screen flex items-center justify-center text-red-500">No active meeting set. Please contact an executive.</div>;
    }
    return <MainApp activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} meetingInfo={meetingInfo} />;
  }

  return null;
}
