"use client";

import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaSave, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import PasswordInput from "./PasswordInput";

export default function ChangePasswordForm({ onClose }) {
  const [formData, setFormData] = useState({
    currentUsername: "",
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPINModal, setShowPINModal] = useState(true); // Start with PIN modal
  const [showForm, setShowForm] = useState(false); // Control form visibility
  const [currentUser, setCurrentUser] = useState(null);
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);

  // Fetch current user info when component mounts
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/session-status', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.loggedIn) {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handlePINSuccess = () => {
    setShowPINModal(false);
    setShowForm(true);
    // Pre-fill current username if available
    if (currentUser && currentUser.username) {
      setFormData(prev => ({ ...prev, currentUsername: currentUser.username }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (!isNewPasswordValid) {
      toast.error("Password doesn't meet requirements");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/change-credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_username: formData.newUsername,
          new_password: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Credentials changed successfully");
        setFormData({
          currentUsername: "",
          currentPassword: "",
          newUsername: "",
          newPassword: "",
          confirmPassword: "",
        });
        onClose();
      } else {
        toast.error(data.error || "Failed to change credentials");
      }
    } catch (error) {
      console.error("Error changing credentials:", error);
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleClose = () => {
    setShowPINModal(false);
    setShowForm(false);
    onClose();
  };

  return (
    <>
      {/* PIN Modal for initial verification */}
      {showPINModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-2xl max-w-[280px] w-full mx-2 border border-blue-200 dark:border-blue-700 relative animate-fadeIn">
            <h2 className="text-base font-bold mb-1 text-center text-blue-700 dark:text-blue-300 tracking-wide">Enter PIN</h2>
            <p className="text-gray-500 dark:text-gray-300 mb-3 text-center text-xs">
              Enter 4-digit PIN to access credential change
            </p>
            
            <PINInput 
              onSuccess={handlePINSuccess}
              onCancel={handleClose}
            />
          </div>
        </div>
      )}

      {/* Credentials Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 w-full max-w-xs shadow-2xl border border-blue-200 dark:border-blue-700 relative animate-fadeIn">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-bold text-blue-700 dark:text-blue-300 text-center w-full">
                Change Credentials
          </h3>
          <button
                onClick={handleClose}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg font-bold focus:outline-none"
                aria-label="Close"
          >
            <FaTimes />
          </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Username
                </label>
                <input
                  type="text"
                  value={formData.currentUsername}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentUsername: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white text-sm bg-gray-50 dark:bg-gray-700"
                  placeholder="Current username"
                  required
                  readOnly
                />
        </div>

          <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white pr-10 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Username
                </label>
                <input
                  type="text"
                  value={formData.newUsername}
                  onChange={(e) => setFormData(prev => ({ ...prev, newUsername: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white text-sm"
                  placeholder="Enter new username"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <PasswordInput
                  value={formData.newPassword}
                  onChange={(value) => setFormData(prev => ({ ...prev, newPassword: value }))}
                  placeholder="Enter new password"
                  label=""
                  required={true}
                  showStrength={true}
                  maxLength={8}
                  onValidationChange={setIsNewPasswordValid}
                />
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900 p-2 rounded">
                <strong>Password Requirements:</strong> Exactly 8 characters with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
              </div>

          <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white pr-10 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

              <div className="flex gap-2">
            <button
              type="button"
                  onClick={handleClose}
                  className="px-3 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 text-xs"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-blue-500 rounded-full animate-spin"></span>
                      Changing...
                    </span>
                  ) : (
                    <><FaSave /> Change Credentials</>
                  )}
            </button>
          </div>
        </form>
      </div>
    </div>
      )}
    </>
  );
}

// PIN Input Component
function PINInput({ onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      
      if (res.ok && data.valid) {
        onSuccess();
      } else {
        toast.error('Invalid PIN');
      }
    } catch (err) {
      toast.error('Failed to verify PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.slice(0, 4))}
          onKeyPress={handleKeyPress}
          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white text-center text-lg tracking-widest bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-sm"
          placeholder="••••"
          maxLength={4}
          autoFocus
          disabled={loading}
          style={{ letterSpacing: '0.2em' }}
        />
      </div>
      
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-2 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 text-xs font-medium"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50 text-xs font-medium"
          disabled={loading || pin.length !== 4}
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 border-2 border-white border-t-blue-500 rounded-full animate-spin"></span>
              <span>Verifying...</span>
            </span>
          ) : (
            'Verify PIN'
          )}
        </button>
      </div>
    </form>
  );
} 