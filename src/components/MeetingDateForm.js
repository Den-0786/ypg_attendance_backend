'use client';
import { useState } from 'react';
import { useMeetingDate } from './MeetingDateContext';
import { toast } from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { capitalizeFirst, toTitleCase } from '../lib/utils';
import PINModal from './PINModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function MeetingDateForm({ onClose, onMeetingSet }) {
  const { setMeetingDate, setMeetingTitle } = useMeetingDate();
  const router = useRouter();
  const [dateInput, setDateInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // PIN verification states
  const [showPINModal, setShowPINModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'activate' or 'deactivate'

  const handleBackToForms = () => {
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Show PIN modal for activation
    setPendingAction('activate');
    setShowPINModal(true);
  };

  const handleActivateWithPIN = async () => {
    setAuthError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/set-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: titleInput,
          date: dateInput,
          admin_username: adminUsername,
          admin_password: adminPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Meeting set successfully', { duration: 5000 });
        
        // Update context and localStorage
        setMeetingDate(dateInput);
        setMeetingTitle(toTitleCase(titleInput));
        localStorage.setItem('meetingDate', dateInput);
        localStorage.setItem('meetingTitle', toTitleCase(titleInput));
        
        // Clear form
        setDateInput('');
        setTitleInput('');
        setAdminUsername('');
        setAdminPassword('');
        setAuthError('');
        
        // Do NOT call onClose() or navigate away
        // Optionally, you can close the modal if you use one, but do not redirect
        // Optionally, refresh meeting info in parent if needed
        if (typeof onMeetingSet === 'function') {
          setTimeout(() => {
            onMeetingSet();
            // Removed window.location.reload() for Chrome to prevent unnecessary reload
          }, 500);
        }
      } else {
        // Check if it's the duplicate meeting error
        if (data.error && data.error.includes('Cannot set two meetings same day')) {
          // Show special toast with loading bar
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
                      Cannot set two meetings same day
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
                Deactivate the current meeting details before you can set another one.
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
    // Show PIN modal for deactivation
    setPendingAction('deactivate');
    setShowPINModal(true);
  };

  const handleDeactivateWithPIN = async () => {
    setDeactivating(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/api/deactivate-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Current meeting deactivated', { duration: 5000 });
        // Clear context and localStorage
        setMeetingDate('');
        setMeetingTitle('');
        localStorage.removeItem('meetingDate');
        localStorage.removeItem('meetingTitle');
        
        // Call onMeetingSet to refresh the parent component's meeting state
        if (typeof onMeetingSet === 'function') {
          setTimeout(() => {
            onMeetingSet();
          }, 500);
        }
      } else {
        if (res.status === 401 || res.status === 403) {
          toast.error('Session expired, please log in again.');
          // Optionally redirect to login page here
          // router.push('/login');
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

  // PIN success handler
  const handlePINSuccess = () => {
    if (pendingAction === 'activate') {
      handleActivateWithPIN();
    } else if (pendingAction === 'deactivate') {
      handleDeactivateWithPIN();
    }
    setPendingAction(null);
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