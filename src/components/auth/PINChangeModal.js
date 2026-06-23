import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function PINChangeModal({ isOpen, onClose }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4) {
      toast.error('All PINs must be 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      toast.error('New PIN and confirm PIN do not match');
      return;
    }

    if (currentPin === newPin) {
      toast.error('New PIN must be different from current PIN');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/pin/change/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          current_pin: currentPin, 
          new_pin: newPin 
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success('PIN changed successfully');
        onClose();
      } else {
        // Handle different types of error responses
        if (res.status === 429) {
          // Rate limited - show the specific error message
          toast.error(data.error || 'Too many PIN attempts. Please wait before trying again.');
        } else {
          // Regular PIN error
          toast.error(data.error || 'Failed to change PIN');
        }
      }
    } catch (err) {
      toast.error('Failed to change PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    // Only allow numbers
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-2xl max-w-[280px] w-full mx-2 border border-blue-200 dark:border-blue-700 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg font-bold focus:outline-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-base font-bold mb-1 text-center text-blue-700 dark:text-blue-300 tracking-wide">Change PIN</h2>
        <p className="text-gray-500 dark:text-gray-300 mb-3 text-center text-xs">
          Enter current PIN and new 4-digit PIN
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Current PIN</label>
            <input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.slice(0, 4))}
              onKeyPress={handleKeyPress}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400  dark:text-white text-center  tracking-widest bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-sm"
              placeholder="••••"
              maxLength={4}
              autoFocus
              disabled={loading}
              style={{ letterSpacing: '0.2em' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">New PIN</label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.slice(0, 4))}
              onKeyPress={handleKeyPress}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400  dark:text-white text-center  tracking-widest bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-sm"
              placeholder="••••"
              maxLength={4}
              disabled={loading}
              style={{ letterSpacing: '0.2em' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Confirm PIN</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.slice(0, 4))}
              onKeyPress={handleKeyPress}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400  dark:text-white text-center tracking-widest bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-sm"
              placeholder="••••"
              maxLength={4}
              disabled={loading}
              style={{ letterSpacing: '0.2em' }}
            />
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-2 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 text-xs font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50 text-xs font-medium"
              disabled={loading || currentPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-blue-500 rounded-full animate-spin"></span>
                  <span>Changing...</span>
                </span>
              ) : (
                'Change PIN'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 