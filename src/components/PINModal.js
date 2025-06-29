import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function PINModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "Enter Security PIN", 
  message = "Please enter the 4-digit PIN to continue" 
}) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/pin/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      
      if (res.ok && data.is_valid) {
        toast.success('PIN verified successfully');
        onSuccess();
        onClose();
      } else {
        toast.error('Invalid PIN');
        setPin('');
      }
    } catch (err) {
      toast.error('Failed to verify PIN');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-2xl max-w-xs w-full mx-2 border border-blue-200 dark:border-blue-700 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg font-bold focus:outline-none"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-lg font-bold mb-2 text-center text-blue-700 dark:text-blue-300 tracking-wide">{title}</h2>
        <p className="text-gray-500 dark:text-gray-300 mb-4 text-center text-xs">{message}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white text-center text-2xl tracking-widest bg-gray-50 dark:bg-gray-800 placeholder-gray-400"
              placeholder="••••"
              maxLength={4}
              autoFocus
              disabled={loading}
              style={{ letterSpacing: '0.5em' }}
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50"
              disabled={loading || pin.length !== 4}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-blue-500 rounded-full animate-spin"></span>
                  Verifying...
                </span>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 