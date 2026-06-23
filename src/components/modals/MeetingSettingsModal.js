'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import PINModal from '../auth/PINModal';
import { toTitleCase } from '../lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function MeetingSettingsModal({ onClose, onSettingsUpdated }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [meetingType, setMeetingType] = useState('general');
  const [customLimit, setCustomLimit] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
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
      const token = localStorage.getItem('access_token');
      const body = {
        title,
        date,
        meeting_type: meetingType,
        admin_username: adminUsername,
        admin_password: adminPassword,
      };

      if (customLimit && parseInt(customLimit) > 0) {
        body.custom_participant_limit = parseInt(customLimit);
      }

      const res = await fetch(`${API_URL}/api/set-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Meeting activated successfully', { duration: 5000 });
        if (typeof onSettingsUpdated === 'function') {
          setTimeout(() => onSettingsUpdated(), 500);
        }
        onClose();
      } else {
        toast.error(data.error || 'Failed to activate meeting');
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Admin Username
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Admin username"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin password"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                required
              />
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
