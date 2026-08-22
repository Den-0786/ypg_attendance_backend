'use client';
import { useState } from 'react';
import { useMeetingDate } from '../context/MeetingDateContext';
import { toast } from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { capitalizeFirst, toTitleCase } from '../../lib/utils';
import PINModal from '../auth/PINModal';
import { BASE_URL } from '../../lib/config';
import { fetchWithAuth } from '../hooks/useAuth';

const API_URL = BASE_URL;

export default function MeetingDateForm({ onClose, onMeetingSet }) {
  const { setMeetingDate, setMeetingTitle } = useMeetingDate();
  const router = useRouter();
  const [dateInput, setDateInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [meetingUsername, setMeetingUsername] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [durationHours, setDurationHours] = useState(2);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [authError, setAuthError] = useState('');

  const [showPINModal, setShowPINModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'activate' or 'deactivate'

  const handleBackToForms = () => {
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPendingAction('activate');
    setShowPINModal(true);
  };

  const handleActivateWithPIN = async () => {
    setAuthError('');
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/set-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: titleInput,
          date: dateInput,
          start_time: startTime,
          duration_hours: durationHours,
          login_username: meetingUsername,
          login_password: meetingPassword,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Non-JSON response from set-meeting:', res.status, text.slice(0, 500));
        data = { error: `Server returned ${res.status} (${res.statusText}). Please check the backend is running.` };
      }
      if (res.ok) {
        toast.success('Meeting set successfully', { duration: 5000 });

        setMeetingDate(dateInput);
        setMeetingTitle(toTitleCase(titleInput));
        localStorage.setItem('meetingDate', dateInput);
        localStorage.setItem('meetingTitle', toTitleCase(titleInput));

        setDateInput('');
        setTitleInput('');
        setStartTime('08:00');
        setDurationHours(2);
        setMeetingUsername('');
        setMeetingPassword('');
        setAuthError('');

        if (typeof onMeetingSet === 'function') {
          setTimeout(() => {
            onMeetingSet();

          }, 500);
        }
      } else {

        if (data.error && data.error.includes('There is an active meeting')) {

          toast.custom((t) => (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      Active meeting in progress
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2 mb-2">
                <div className="bg-red-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
              <p className="text-sm text-red-700">
                There is an active meeting. New meeting cannot be initiated. Deactivate the current meeting before you can set another one.
              </p>
            </div>
          ), { duration: 8000 });
        } else {
          setAuthError(data.error || 'Failed to set meeting');
          toast.error(data.error || 'Failed to set meeting');
        }
      }
    } catch (error) {
      console.error('Meeting setting error:', error);
      setAuthError('Network error occurred. Please check your connection.');
      toast.error('Network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateMeeting = () => {
    setPendingAction('deactivate');
    setShowPINModal(true);
  };

  const handleDeactivateWithPIN = async (pin) => {
    setDeactivating(true);
    try {
      if (!pin) {
        toast.error('PIN is required');
        setDeactivating(false);
        return;
      }

      const res = await fetchWithAuth(`${API_URL}/api/deactivate-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });
      const contentType = res.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Non-JSON response from deactivate-meeting:', res.status, text.slice(0, 500));
        data = { error: `Server returned ${res.status} (${res.statusText}). Please check the backend is running.` };
      }
      if (res.ok) {
        toast.success('Current meeting deactivated', { duration: 5000 });
        setMeetingDate('');
        setMeetingTitle('');
        localStorage.removeItem('meetingDate');
        localStorage.removeItem('meetingTitle');
        if (typeof onMeetingSet === 'function') {
          setTimeout(() => {
            onMeetingSet();
          }, 500);
        }
      } else {
        if (res.status === 401 || res.status === 403) {
          toast.error('Session expired, please log in again.');
          return;
        }
        toast.error(data.error || 'Failed to deactivate meeting');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setDeactivating(false);
    }
  };

  const handlePINSuccess = (pin) => {
    if (pendingAction === 'activate') {
      handleActivateWithPIN(pin);
    } else if (pendingAction === 'deactivate') {
      handleDeactivateWithPIN(pin);
    }
    setPendingAction(null);
    setShowPINModal(false); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-white py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-2xl shadow-xl w-full max-w-md space-y-6 border-2 border-yellow-400"
        autoComplete="off"
      >
        <h2 className="text-2xl font-bold text-center text-yellow-700 mb-2">Set Meeting Details</h2>
        <p className="text-center text-gray-500 mb-4">Please enter the details for the new meeting</p>

        {/* Navigation button */}
        <div className="flex justify-center mb-4">
          <button
            type="button"
            onClick={handleBackToForms}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition cursor-pointer"
          >
            Back to Forms
          </button>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Meeting Title</label>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(toTitleCase(e.target.value))}
            placeholder="e.g. Emergency Meeting"
            className="w-full p-1 border border-yellow-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            required
            autoComplete="off"
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
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-1 border border-yellow-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Duration (hours)</label>
            <input
              type="number"
              min="1"
              max="72"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full p-1 border border-yellow-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
              required
              autoComplete="off"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Meeting Username</label>
          <input
            type="text"
            value={meetingUsername}
            onChange={(e) => setMeetingUsername(e.target.value)}
            placeholder="Username for members to log in"
            className="w-full p-1 border border-yellow-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            required
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Meeting Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
              value={meetingPassword}
              onChange={(e) => setMeetingPassword(e.target.value)}
              placeholder="Password for members to log in"
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

      {/* PIN Modal */}
      <PINModal
        className="text-gray-900"
        isOpen={showPINModal}
        onClose={() => {
          setShowPINModal(false);
          setPendingAction(null);
        }}
        onSuccess={handlePINSuccess}
        title={pendingAction === 'activate' ? 'Enter PIN to Activate Meeting' : 'Enter PIN to Deactivate Meeting'}
        message={pendingAction === 'activate' ? 'Please enter the 4-digit PIN to activate this meeting' : 'Please enter the 4-digit PIN to deactivate the current meeting'}
      />
    </div>
  );
}