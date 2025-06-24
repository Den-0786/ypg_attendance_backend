'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@components/hooks/useAuth';
import MeetingDateForm from '@components/MeetingDateForm';
import MainApp from '@components/MainApp';

export default function MeetingPage() {
  const { loggedIn, userRole, handleLogout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('attendance');
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [loadingMeeting, setLoadingMeeting] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
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
      fetch('/api/current-meeting/')
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
    if (loggedIn && userRole === 'meeting_user') {
      setLoadingMeeting(true);
      fetch('/api/current-meeting/')
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
      return <MeetingDateForm onContinue={() => {
        setShowMeetingForm(false);
        setLoadingMeeting(true);
        fetch('/api/current-meeting/')
          .then(res => res.json())
          .then(data => {
            if (data && !data.error) {
              setMeetingInfo(data);
            }
            setLoadingMeeting(false);
          })
          .catch(() => setLoadingMeeting(false));
      }} />;
    }
    if (!meetingInfo) {
      return <div className="min-h-screen flex items-center justify-center text-red-500">No active meeting set. Please contact an executive.</div>;
    }
    return <MainApp activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} meetingInfo={meetingInfo} />;
  }

  // Meeting user flow: fetch and use meeting info
  if (userRole === 'meeting_user') {
    if (loadingMeeting) {
      return <div className="min-h-screen flex items-center justify-center">Loading meeting info...</div>;
    }
    if (!meetingInfo) {
      return <div className="min-h-screen flex items-center justify-center text-red-500">No active meeting set. Please contact an executive.</div>;
    }
    return <MainApp activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} meetingInfo={meetingInfo} />;
  }

  return null;
}
