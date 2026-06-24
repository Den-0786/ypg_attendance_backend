'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import PINModal from '../auth/PINModal';
import { BASE_URL } from '../../lib/config';
import { fetchWithAuth } from '../hooks/useAuth';

const API_URL = BASE_URL;

export default function MeetingConfigForm({ onMeetingConfigured, darkMode = false }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [meetingType, setMeetingType] = useState('general');
  const [customLimit, setCustomLimit] = useState('');
  const [meetingUsername, setMeetingUsername] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [durationHours, setDurationHours] = useState(2);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);

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
    setPendingAction('configure');
    setShowPINModal(true);
  };

  const [pendingAction, setPendingAction] = useState(null);

  const handleConfigureWithPIN = async () => {
    setLoading(true);
    try {
      const body = {
        title,
        date,
        meeting_type: meetingType,
        start_time: startTime,
        duration_hours: durationHours,
        login_username: meetingUsername,
        login_password: meetingPassword,
      };

      // Only include custom_limit if it's set and greater than 0
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
        toast.success('Meeting configured successfully', { duration: 5000 });
        
        // Clear form
        setTitle('');
        setDate('');
        setMeetingType('general');
        setCustomLimit('');
        setStartTime('08:00');
        setDurationHours(2);
        setMeetingUsername('');
        setMeetingPassword('');
        
        if (typeof onMeetingConfigured === 'function') {
          setTimeout(() => onMeetingConfigured(), 500);
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
          toast.error(data.error || 'Failed to configure meeting');
        }
      }
    } catch (error) {
      console.error('Meeting configuration error:', error);
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePINSuccess = (pin) => {
    if (pendingAction === 'configure') {
      handleConfigureWithPIN(pin);
    }
    setPendingAction(null);
    setShowPINModal(false);
  };

  return (
    <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="mb-6">
        <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Configure Meeting</h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Set meeting type and participant limits per local</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Meeting Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Monthly General Meeting"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Meeting Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Meeting Type</label>
          <select
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer ${darkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
            required
          >
            <option value="general">General Meeting (default: 5 per local)</option>
            <option value="council">Council Meeting (default: 2 per local)</option>
            <option value="emergency">Emergency Meeting (unlimited)</option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Custom Participant Limit per Local
            <span className={`font-normal ml-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>(optional, overrides default)</span>
          </label>
          <input
            type="number"
            min="1"
            value={customLimit}
            onChange={(e) => setCustomLimit(e.target.value)}
            placeholder="Leave empty for default limits"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
          />
          <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Effective limit: <span className={`font-semibold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{getEffectiveLimit()}</span> members per local
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Duration (hours)</label>
            <input
              type="number"
              min="1"
              max="72"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
              required
            />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Member Login Credentials</h4>
          <div className="space-y-3">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Meeting Username</label>
              <input
                type="text"
                value={meetingUsername}
                onChange={(e) => setMeetingUsername(e.target.value)}
                placeholder="Username for members to log in"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Meeting Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={meetingPassword}
                  onChange={(e) => setMeetingPassword(e.target.value)}
                  placeholder="Password for members to log in"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10 ${darkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-indigo-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <HiEye size={20} /> : <HiEyeOff size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-6 rounded-xl text-white font-bold text-base transition-all duration-300 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          }`}
        >
          {loading ? 'Configuring...' : 'Configure Meeting'}
        </button>
      </form>

      <PINModal
        isOpen={showPINModal}
        onClose={() => {
          setShowPINModal(false);
          setPendingAction(null);
        }}
        onSuccess={handlePINSuccess}
        title="Enter PIN to Configure Meeting"
        message="Please enter the 4-digit PIN to configure this meeting"
      />
    </div>
  );
}
