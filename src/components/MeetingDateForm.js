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
  const [meetingType, setMeetingType] = useState('general');
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
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/api/set-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({
          title: titleInput,
          date: dateInput,
          meeting_type: meetingType,
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
        
       
        if (typeof onMeetingSet === 'function') {
          setTimeout(() => {
            onMeetingSet();
            
          }, 500);
        }
      } else {
        
        if (data.error && data.error.includes('Cannot set two meetings same day')) {

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

  const handleDeactivateWithPIN = async (pin) => {
    setDeactivating(true);
    try {
      if (!pin) {
        toast.error('PIN is required');
        setDeactivating(false);
        return;
      }
      
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/api/deactivate-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
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

  // PIN success handler
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="modern-card max-w-lg w-full space-y-6"
        autoComplete="off"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Set Meeting Details</h2>
          <p className="text-gray-600 text-sm">Configure the new meeting parameters</p>
        </div>

        {/* Deactivate Current Meeting Button */}
        <div className="flex items-center justify-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
          <button
            type="button"
            onClick={handleDeactivateMeeting}
            disabled={deactivating}
            className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition disabled:bg-red-400 disabled:cursor-not-allowed font-medium text-sm"
          >
            {deactivating ? 'Deactivating...' : 'Deactivate Current Meeting'}
          </button>
          
          <button
            type="button"
            onClick={handleBackToForms}
            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
          >
            Back to Forms
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Title</label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(toTitleCase(e.target.value))}
              placeholder="e.g. Emergency Meeting"
              className="modern-input w-full"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Date</label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="modern-input w-full"
              required
              min={new Date().toISOString().split('T')[0]}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Type</label>
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value)}
              className="modern-input w-full cursor-pointer"
              required
            >
              <option value="general">General Meeting (5 members per local cap)</option>
              <option value="council">Council Meeting (2 members per local cap)</option>
              <option value="emergency">Emergency Meeting (no cap)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {meetingType === 'general' 
                ? 'General meetings have a 5-member limit per local congregation.' 
                : meetingType === 'council'
                ? 'Council meetings have a 2-member limit per local congregation.'
                : 'Emergency meetings have no attendance limits.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Username</label>
            <input
              type="text"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="Admin username"
              className="modern-input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin password"
                className="modern-input w-full pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <HiEye size={20} /> : <HiEyeOff size={20} />}
              </button>
            </div>
          </div>
        </div>

        {authError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {authError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-6 rounded-xl text-white font-bold text-base transition-all duration-300 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          }`}
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