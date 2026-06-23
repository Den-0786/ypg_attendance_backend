'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import PINModal from '../auth/PINModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function MeetingConfigForm({ onMeetingConfigured }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [meetingType, setMeetingType] = useState('general');
  const [customLimit, setCustomLimit] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
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
      const token = localStorage.getItem('access_token');
      const body = {
        title,
        date,
        meeting_type: meetingType,
        admin_username: adminUsername,
        admin_password: adminPassword,
      };

      // Only include custom_limit if it's set and greater than 0
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
        toast.success('Meeting configured successfully', { duration: 5000 });
        
        // Clear form
        setTitle('');
        setDate('');
        setMeetingType('general');
        setCustomLimit('');
        setAdminUsername('');
        setAdminPassword('');
        
        if (typeof onMeetingConfigured === 'function') {
          setTimeout(() => onMeetingConfigured(), 500);
        }
      } else {
        toast.error(data.error || 'Failed to configure meeting');
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
    <div className="modern-card p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Configure Meeting</h3>
        <p className="text-gray-600 text-sm">Set meeting type and participant limits per local</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Monthly General Meeting"
            className="modern-input w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="modern-input w-full"
            required
            min={new Date().toISOString().split('T')[0]}
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
            <option value="general">General Meeting (default: 5 per local)</option>
            <option value="council">Council Meeting (default: 2 per local)</option>
            <option value="emergency">Emergency Meeting (unlimited)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Custom Participant Limit per Local
            <span className="text-gray-500 font-normal ml-2">(optional, overrides default)</span>
          </label>
          <input
            type="number"
            min="1"
            value={customLimit}
            onChange={(e) => setCustomLimit(e.target.value)}
            placeholder="Leave empty for default limits"
            className="modern-input w-full"
          />
          <p className="text-xs text-gray-500 mt-2">
            Effective limit: <span className="font-semibold text-indigo-600">{getEffectiveLimit()}</span> members per local
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
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Admin password"
            className="modern-input w-full"
            required
          />
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
