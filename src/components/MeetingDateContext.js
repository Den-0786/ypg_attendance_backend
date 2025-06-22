'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const MeetingDateContext = createContext();

export const MeetingDateProvider = ({ children }) => {
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');

  // Load from localStorage if set previously
  useEffect(() => {
    const savedDate = localStorage.getItem('meetingDate');
    const savedTitle = localStorage.getItem('meetingTitle');
    if (savedDate) setMeetingDate(savedDate);
    if (savedTitle) setMeetingTitle(savedTitle);
  }, []);

  return (
    <MeetingDateContext.Provider value={{ meetingDate, setMeetingDate, meetingTitle, setMeetingTitle }}>
      {children}
    </MeetingDateContext.Provider>
  );
};

export function useMeetingDate() {
  const context = useContext(MeetingDateContext);
  if (!context) {
    throw new Error('useMeetingDate must be used within a MeetingDateProvider');
  }
  return context;
}
