'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import PINModal from '../auth/PINModal';
import { toTitleCase } from '../../lib/utils';
import { BASE_URL } from '../../lib/config';
import { fetchWithAuth } from '../hooks/useAuth';

const API_URL = BASE_URL;

export default function MeetingSettingsModal({ onClose, onSettingsUpdated }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [meetingType, setMeetingType] = useState('general');
  const [customLimit, setCustomLimit] = useState('');
  const [meetingUsername, setMeetingUsername] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const getEffectiveLimit = () => {
    if (customLimit && customLimit > 0) {
      return parseInt(customLimit);
    }
    if (meetingType === 'general') return 5;
    if (meetingType === 'council') return 2;
    return 'Unlimited';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPendingAction('activate');
    setShowPINModal(true);
  };

  const handleActivateWithPIN = async () => {
    setLoading(true);
    try {
      const body = {
        title,
        date,
        meeting_type: meetingType,
        login_username: meetingUsername,
        login_password: meetingPassword,
      };

      if (customLimit && parseInt(customLimit) > 0) {
        body.custom_participant_limit = parseInt(customLimit);
      }

      const res = await fetchWithAuth(`${API_URL}/api/set-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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
        toast.success('Meeting activated successfully', { duration: 5000 });
        if (typeof onSettingsUpdated === 'function') {
          setTimeout(() => onSettingsUpdated(), 500);
        }
        onClose();
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
                    <p className="text-sm font-medium text-red-800">Active meeting in progress</p>
                  </div>
                </div>
                <button onClick={() => toast.dismiss(t.id)} className="text-red-400 hover:text-red-600">✕</button>
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
          toast.error(data.error || 'Failed to activate meeting');
        }
      }
    } catch (error) {
      console.error('Meeting activation error:', error);
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePINSuccess = (pin) => {
    if (pendingAction === 'activate') {
      handleActivateWithPIN(pin);
    }
    setPendingAction(null);
    setShowPINModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Activate Meeting
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Meeting Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(toTitleCase(e.target.value))}
                placeholder="e.g. Monthly General Meeting"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Meeting Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Meeting Type
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="general">General Meeting (default: 5 per local)</option>
                <option value="council">Council Meeting (default: 2 per local)</option>
                <option value="emergency">Emergency Meeting (unlimited)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Select the type of meeting to set default participant limits
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Custom Participant Limit per Local
                <span className="text-gray-500 font-normal ml-2">(optional, overrides default)</span>
              </label>
              <input
                type="number"
                min="1"
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
                placeholder="Leave empty for default limits"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Effective limit: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{getEffectiveLimit()}</span> members per local
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Member Login Credentials
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Meeting Username
                  </label>
                  <input
                    type="text"
                    value={meetingUsername}
                    onChange={(e) => setMeetingUsername(e.target.value)}
                    placeholder="Username for members to log in"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    required
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Meeting Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={meetingPassword}
                      onChange={(e) => setMeetingPassword(e.target.value)}
                      placeholder="Password for members to log in"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-10"
                      required
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3.5 text-gray-500 hover:text-indigo-600"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <HiEye size={20} /> : <HiEyeOff size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-4 py-3 rounded-xl text-white font-bold transition-all ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 transform hover:scale-[1.02] shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? 'Activating...' : 'Activate Meeting'}
              </button>
            </div>
          </form>
        </div>

        <PINModal
          isOpen={showPINModal}
          onClose={() => {
            setShowPINModal(false);
            setPendingAction(null);
          }}
          onSuccess={handlePINSuccess}
          title="Enter PIN to Activate Meeting"
          message="Please enter the 4-digit PIN to activate this meeting"
        />
      </div>
    </div>
  );
}
