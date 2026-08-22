'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import PINModal from '../auth/PINModal';
import { BASE_URL } from '../../lib/config';
import { fetchWithAuth } from '../hooks/useAuth';

const API_URL = BASE_URL;

export default function EditMeetingForm({ onClose, onMeetingEdited, currentMeeting }) {
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
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    if (currentMeeting) {
      setTitle(currentMeeting.title || '');
      setDate(currentMeeting.date || '');
      setMeetingType(currentMeeting.meeting_type || 'general');
      setCustomLimit(currentMeeting.custom_participant_limit || '');
      setMeetingUsername(currentMeeting.login_username || '');
      setMeetingPassword(''); // Don't pre-populate password for security
      setStartTime(currentMeeting.start_time || '08:00');
      setDurationHours(currentMeeting.duration_hours || 2);
    }
  }, [currentMeeting]);

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
    setPendingAction('edit');
    setShowPINModal(true);
  };

  const handleEditWithPIN = async (pin) => {
    setLoading(true);
    try {
      const body = {
        pin,
      };

      if (title !== currentMeeting.title) {
        body.title = title;
      }
      if (date !== currentMeeting.date) {
        body.date = date;
      }
      if (meetingType !== currentMeeting.meeting_type) {
        body.meeting_type = meetingType;
      }
      if (customLimit !== currentMeeting.custom_participant_limit) {
        body.custom_participant_limit = customLimit ? parseInt(customLimit) : null;
      }
      if (startTime !== currentMeeting.start_time) {
        body.start_time = startTime;
      }
      if (durationHours !== currentMeeting.duration_hours) {
        body.duration_hours = parseInt(durationHours);
      }
      if (meetingUsername !== currentMeeting.login_username) {
        body.login_username = meetingUsername;
      }
      if (meetingPassword) {
        body.login_password = meetingPassword;
      }

      const res = await fetchWithAuth(`${API_URL}/api/edit-meeting`, {
        method: 'PUT',
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
        console.error('Non-JSON response from edit-meeting:', res.status, text.slice(0, 500));
        data = { error: `Server returned ${res.status} (${res.statusText}). Please check the backend is running.` };
      }

      if (res.ok) {
        toast.success('Meeting updated successfully', { duration: 5000 });
        if (typeof onMeetingEdited === 'function') {
          setTimeout(() => onMeetingEdited(), 500);
        }
        onClose();
      } else {
        toast.error(data.error || 'Failed to update meeting');
      }
    } catch (error) {
      console.error('Meeting edit error:', error);
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePINSuccess = (pin) => {
    if (pendingAction === 'edit') {
      handleEditWithPIN(pin);
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
              Edit Meeting
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
                onChange={(e) => setTitle(e.target.value)}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
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
                    <span className="text-gray-500 font-normal ml-2">(leave empty to keep current)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                      value={meetingPassword}
                      onChange={(e) => setMeetingPassword(e.target.value)}
                      placeholder="Enter new password to change"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-10"
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
                {loading ? 'Updating...' : 'Update Meeting'}
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
          title="Enter PIN to Edit Meeting"
          message="Please enter the 4-digit PIN to edit this meeting"
        />
      </div>
    </div>
  );
}