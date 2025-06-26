'use client';
import { useState } from 'react';
import { useMeetingDate } from './MeetingDateContext';
import { toast } from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { useRouter } from 'next/navigation';

export default function MeetingDateForm({ onClose, onMeetingSet }) {
  const { setMeetingDate, setMeetingTitle } = useMeetingDate();
  const router = useRouter();
  const [dateInput, setDateInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleBackToForms = () => {
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    // if (!dateInput || !usernameInput || !passwordInput || !adminUsername || !adminPassword) {
    //   toast.error('Please fill in all fields');
    //   return;
    // }
    setLoading(true);
    try {
      const res = await fetch(`/api/set-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: titleInput,
          date: dateInput,
          login_username: usernameInput,
          login_password: passwordInput,
          admin_username: adminUsername,
          admin_password: adminPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Meeting set successfully');
        setMeetingDate(dateInput);
        setMeetingTitle(titleInput);
        localStorage.setItem('meetingDate', dateInput);
        localStorage.setItem('meetingTitle', titleInput);
        setDateInput('');
        setTitleInput('');
        setUsernameInput('');
        setPasswordInput('');
        setAdminUsername('');
        setAdminPassword('');
        setAuthError('');
        onClose();
        onMeetingSet();
      } else {
        setAuthError(data.error || 'Failed to set meeting');
        toast.error(data.error || 'Failed to set meeting');
      }
    } catch (error) {
      setAuthError('Network error occurred');
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateMeeting = async () => {
    setDeactivating(true);
    try {
      const res = await fetch(`/api/deactivate-meeting`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Current meeting deactivated');
        // Clear context and localStorage
        setMeetingDate('');
        setMeetingTitle('');
        localStorage.removeItem('meetingDate');
        localStorage.removeItem('meetingTitle');
      } else {
        toast.error(data.error || 'Failed to deactivate meeting');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-white py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-2xl shadow-xl w-full max-w-md space-y-6 border-2 border-yellow-400"
      >
        <h2 className="text-2xl font-bold text-center text-yellow-700 mb-2">Set Meeting Details</h2>
        <p className="text-center text-gray-500 mb-4">Please enter the details for the new meeting</p>

        {/* Deactivate Current Meeting Button */}
        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={handleDeactivateMeeting}
            disabled={deactivating}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition disabled:bg-red-400"
          >
            {deactivating ? 'Deactivating...' : 'Deactivate Current Meeting'}
          </button>
          
          {/* Navigation button aligned with deactivate */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleBackToForms}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition cursor-pointer"
            >
              Back to Forms
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Meeting Title</label>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="e.g. Emergency Meeting"
            className="w-full p-1 border border-yellow-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Meeting Date</label>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="w-full p-1 border border-yellow-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Login Username</label>
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="e.g. districtypg2025"
            className="w-full p-1 border border-yellow-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Login Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Set a password for this meeting"
              className="w-full p-1 border border-yellow-300 rounded-xl text-gray-900 pr-10 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-2 text-gray-500 hover:text-yellow-600"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <HiEye size={20} /> : <HiEyeOff size={20} />}
            </button>
          </div>
        </div> */}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Admin Username</label>
          <input
            type="text"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
            placeholder="Admin username"
            className="w-full p-1 border border-yellow-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Admin Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full p-1 border border-yellow-300 rounded-xl text-gray-900 pr-10 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-2 text-gray-500 hover:text-yellow-600"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <HiEye size={20} /> : <HiEyeOff size={20} />}
            </button>
          </div>
        </div>
        {authError && <p className="text-red-500 text-sm mt-1">{authError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-1 rounded-xl text-white font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg transition-colors text-base mt-2"
        >
          {loading ? 'Setting...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}