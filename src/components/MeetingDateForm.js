'use client';
import { useState } from 'react';
import { useMeetingDate } from './MeetingDateContext';
import { toast } from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';

export default function MeetingDateForm({ onContinue }) {
  const { setMeetingDate, setMeetingTitle } = useMeetingDate();
  const [dateInput, setDateInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dateInput) {
      toast.error('Please select a date');
      return;
    }

    if (!titleInput.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    if (!usernameInput.trim()) {
      toast.error('Please enter a meeting login username');
      return;
    }

    if (!passwordInput.trim()) {
      toast.error('Please enter a meeting login password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/set-meeting/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleInput.trim(),
          date: dateInput,
          login_username: usernameInput.trim(),
          login_password: passwordInput.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to set meeting');
        setLoading(false);
        return;
      }
      toast.success('Meeting info set successfully!');
      onContinue();
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-white py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-2xl shadow-xl w-full max-w-md space-y-4 border-2 border-yellow-400"
      >
        <h2 className="text-2xl font-bold text-center text-yellow-700 mb-2">Set Meeting Details</h2>
        <p className="text-center text-gray-500 mb-4">Please enter the details for the new meeting</p>

        <label className="block text-sm  font-medium text-gray-700">Meeting Title</label>
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="e.g. Emergency Meeting"
          className="w-full mt-1 p-1 border  border-yellow-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
          required
        />

        <label className="block text-sm font-medium text-gray-700">Meeting Date</label>
        <input
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          className="w-full mt-1 p-1 border border-yellow-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
          required
          min={new Date().toISOString().split('T')[0]}
        />

        <label className="block text-sm font-medium text-gray-700">Meeting Login Username</label>
        <input
          type="text"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          placeholder="e.g. districtypg2025"
          className="w-full mt-1 p-1 border border-yellow-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
          required
        />

        <label className="block text-sm font-medium text-gray-700">Meeting Login Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Set a password for this meeting"
            className="w-full mt-1 p-1 border border-yellow-300 rounded-xl text-gray-900 pr-10 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
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
