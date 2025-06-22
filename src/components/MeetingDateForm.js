'use client';
import { useState } from 'react';
import { useMeetingDate } from './MeetingDateContext';
import { toast } from 'react-hot-toast';

export default function MeetingDateForm({ onContinue }) {
  const { setMeetingDate, setMeetingTitle } = useMeetingDate();
  const [dateInput, setDateInput] = useState('');
  const [titleInput, setTitleInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!dateInput) {
      toast.error('Please select a date');
      return;
    }

    if (!titleInput.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    const formattedTitle = titleInput.trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

    setMeetingDate(dateInput);
    setMeetingTitle(formattedTitle);

    localStorage.setItem('meetingDate', dateInput);
    localStorage.setItem('meetingTitle', titleInput.trim());
    localStorage.setItem('meetingSet', 'true');

    toast.success('Meeting info set successfully!');
    onContinue();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 text-center">Set Meeting Details</h2>

        <label className="block text-sm font-medium text-gray-700">Meeting Title</label>
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="e.g. Emergency Meeting"
          className="w-full p-2 border rounded text-gray-900"
          required
        />

        <label className="block text-sm font-medium text-gray-700">Meeting Date</label>
        <input
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          className="w-full p-2 border rounded text-gray-900"
          required
          min={new Date().toISOString().split('T')[0]}
        />

        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
