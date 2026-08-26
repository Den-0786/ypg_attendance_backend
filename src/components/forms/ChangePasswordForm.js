"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaSave,
  FaTimes,
  FaUsers,
  FaCrown,
} from "react-icons/fa";
import toast from "react-hot-toast";
import PasswordInput from "./PasswordInput";
import { getPasswordStrength, validatePassword } from "../../lib/utils";
import { BASE_URL } from "../../lib/config";

const API_URL = BASE_URL;

export default function ChangePasswordForm({
  onClose,
  currentUser: propCurrentUser,
  darkMode = false,
}) {
  const [formData, setFormData] = useState({
    currentUsername: "",
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    confirmPassword: "",
    newPIN: "",
    confirmPIN: "",
    currentPIN: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
    pin: false,
    confirmPin: false,
    currentPin: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPINModal, setShowPINModal] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(propCurrentUser || null);
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [pinStatus, setPinStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("credentials");
  const [users, setUsers] = useState([]);
  const [selectedTargetUser, setSelectedTargetUser] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [verifiedPIN, setVerifiedPIN] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [profileData, setProfileData] = useState({ phone_number: "", email: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (propCurrentUser) {
      setCurrentUser(propCurrentUser);
      if (propCurrentUser.role === "admin") {
        fetchAllUsers();
      }
    } else {
      fetchCurrentUser();
    }
    checkPINStatus();
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propCurrentUser]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/session-status`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      setCurrentUser(data);
      if (data.role === "admin") {
        fetchAllUsers();
      }
    } catch (err) {
      setCurrentUser(null);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/get-all-users`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          Accept: "application/json",
        },
      });
      const data = await response.json();

      if (response.ok) {
        const sortedUsers = data.users.sort((a, b) => {
          if (a.role === "admin" && b.role !== "admin") return -1;
          if (a.role !== "admin" && b.role === "admin") return 1;
          return a.username.localeCompare(b.username);
        });
        setUsers(sortedUsers);
      } else {
        console.error("Failed to fetch users:", data.error);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    }
  };

  const checkPINStatus = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/pin/status/`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      setPinStatus(data.pin_setup ? "exists" : "not_setup");
    } catch (err) {
      console.error("Error checking PIN status:", err);
      setPinStatus("not_setup");
    }
  };

  const setupInitialPIN = async (pin) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/pin/setup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json();
      if (data.message) {
        setPinStatus("exists");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error setting PIN:", err);
      toast.error("Network error occurred");
      setPinStatus("not_setup");
      return false;
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          Accept: "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData({ phone_number: data.phone_number || "", email: data.email || "" });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileData.phone_number) {
      toast.error("Phone number is required for SMS verification");
      return;
    }
    setProfileLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(profileData),
      });
      if (response.ok) {
        toast.success("Profile updated successfully");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update profile");
      }
    } catch (err) {
      toast.error("Network error occurred");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePINSuccess = (pin) => {
    setVerifiedPIN(pin);
    setShowPINModal(false);
    setShowForm(true);
  };

  const handleRequestOTP = async () => {
    setOtpLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/password/otp/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        toast.success(data.message || "Verification code sent via SMS");
      } else {
        toast.error(data.error || "Failed to send SMS code");
      }
    } catch (err) {
      toast.error("Network error while sending SMS code");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === "credentials") {
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }

      if (!isNewPasswordValid) {
        const validation = validatePassword(formData.newPassword);
        const errorMsg = validation.error || "Password doesn't meet requirements";
        setPasswordError(errorMsg);
        setShowPasswordError(true);
        toast.error(errorMsg);
        return;
      }

      if (!formData.currentPassword) {
        toast.error("Current password is required");
        return;
      }

      if (!otpCode || otpCode.length !== 6) {
        toast.error("Enter the 6-digit SMS verification code");
        return;
      }

      setLoading(true);
      try {
        const requestBody = {
          current_username: formData.currentUsername,
          current_password: formData.currentPassword,
          new_username: formData.newUsername,
          new_password: formData.newPassword,
          pin: verifiedPIN,
          otp_code: otpCode,
        };

        if (isAdminMode && selectedTargetUser) {
          requestBody.target_user_id = selectedTargetUser.id;
        }

        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/api/change-credentials`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (response.ok) {
          const successMessage =
            isAdminMode && selectedTargetUser
              ? `Successfully updated credentials for ${data.updated_user?.username || selectedTargetUser.username}`
              : "Credentials changed successfully";
          toast.success(successMessage);
          setFormData({
            currentUsername: "",
            currentPassword: "",
            newUsername: "",
            newPassword: "",
            confirmPassword: "",
            newPIN: "",
            confirmPIN: "",
            currentPIN: "",
          });
          setSelectedTargetUser(null);
          setIsAdminMode(false);
          setOtpCode("");
          setOtpSent(false);
          onClose();
        } else {
          if (response.status === 429) {
            toast.error(
              data.error ||
                "Too many PIN attempts. Please wait before trying again."
            );
          } else {
            toast.error(data.error || "Failed to change credentials");
          }
        }
      } catch (error) {
        console.error("Error changing credentials:", error);
        toast.error("Network error occurred");
      } finally {
        setLoading(false);
      }
    } else {
      if (formData.newPIN !== formData.confirmPIN) {
        toast.error("PINs do not match");
        return;
      }

      if (formData.newPIN.length !== 4) {
        toast.error("PIN must be exactly 4 digits");
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/api/pin/change/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          credentials: "include",
          body: JSON.stringify({
            current_pin: formData.currentPIN,
            new_pin: formData.newPIN,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("PIN changed successfully");
          setFormData((prev) => ({
            ...prev,
            newPIN: "",
            confirmPIN: "",
            currentPIN: "",
          }));
          onClose();
        } else {
          if (response.status === 429) {
            toast.error(
              data.error ||
                "Too many PIN attempts. Please wait before trying again."
            );
          } else {
            toast.error(data.error || "Failed to change PIN");
          }
        }
      } catch (error) {
        console.error("Error changing PIN:", error);
        toast.error("Network error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleClose = () => {
    setShowPINModal(false);
    setShowForm(false);
    setSelectedTargetUser(null);
    setIsAdminMode(false);
    onClose();
  };

  const handleUserSelect = (user) => {
    setSelectedTargetUser(user);
    setIsAdminMode(true);
    setFormData((prev) => ({
      ...prev,
      currentUsername: user.username,
      newUsername: user.username,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      currentPIN: "",
    }));
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  useEffect(() => {
    setIsNewPasswordValid(passwordStrength.isValid);
  }, [formData.newPassword, passwordStrength.isValid]);

  const passwordErrorTimerRef = useRef(null);
  const passwordHideTimerRef = useRef(null);
  useEffect(() => {
    if (passwordErrorTimerRef.current) clearTimeout(passwordErrorTimerRef.current);
    if (passwordHideTimerRef.current) clearTimeout(passwordHideTimerRef.current);

    if (!formData.newPassword || passwordStrength.isValid) {
      setShowPasswordError(false);
      setPasswordError("");
      return;
    }

    passwordErrorTimerRef.current = setTimeout(() => {
      const validation = validatePassword(formData.newPassword);
      setPasswordError(validation.error || "Password doesn't meet requirements");
      setShowPasswordError(true);

      passwordHideTimerRef.current = setTimeout(() => {
        setShowPasswordError(false);
      }, 10000);
    }, 800);

    return () => {
      if (passwordErrorTimerRef.current) clearTimeout(passwordErrorTimerRef.current);
      if (passwordHideTimerRef.current) clearTimeout(passwordHideTimerRef.current);
    };
  }, [formData.newPassword, passwordStrength.isValid]);

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg p-6 w-full max-w-sm shadow-xl`}>
          <div className="text-center">
            <FaTimes className="text-red-500 text-3xl mx-auto mb-4" />
            <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Access Denied
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Only administrators can change credentials.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* PIN Modal */}
      {showPINModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg p-3 w-full max-w-xs shadow-xl`}>
            {pinStatus === null ? (
              <div className="text-center py-4">
                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Checking PIN status...
                </p>
              </div>
            ) : (
              <>
                <h2 className={`text-lg font-bold mb-2 text-center ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  {pinStatus === "not_setup" ? "Setup PIN" : "Enter PIN"}
                </h2>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 text-center text-sm`}>
                  {pinStatus === "not_setup"
                    ? "Setup a 4-digit PIN for credential changes"
                    : "Enter 4-digit PIN to access credential change"}
                </p>

                <PINInput
                  onSuccess={handlePINSuccess}
                  onCancel={handleClose}
                  pinStatus={pinStatus}
                  onSetupPIN={setupInitialPIN}
                  darkMode={darkMode}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Credentials Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg p-3 w-full max-w-xs shadow-xl`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className={`text-base font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                Change Credentials
              </h3>
              <button
                onClick={handleClose}
                className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} text-lg font-bold focus:outline-none`}
              >
                <FaTimes />
              </button>
            </div>

            {/* User Selection */}
            {!isAdminMode && (
              <div className={`mb-2 p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <h4 className={`text-xs font-semibold mb-1 flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaUsers /> Select User to Manage
                </h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full text-left p-1.5 rounded border hover:transition ${darkMode ? 'bg-gray-700 border-amber-500/30 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 text-white rounded-full flex items-center justify-center text-xs font-bold ${
                            user.role === "admin"
                              ? "bg-purple-500"
                              : "bg-blue-500"
                          }`}
                        >
                          {user.role === "admin" ? (
                            <FaCrown className="text-xs" />
                          ) : (
                            user.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user.username}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {user.role === "admin" ? "Administrator" : "User"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected User Display */}
            {isAdminMode && selectedTargetUser && (
              <div className={`mb-2 p-1.5 rounded border ${darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  <strong>Managing:</strong> {selectedTargetUser.username} (
                  {selectedTargetUser.role === "admin"
                    ? "Administrator"
                    : "User"}
                  )
                </p>
              </div>
            )}

            {/* Tab Navigation */}
            <div className={`flex gap-1 mb-2 rounded-lg p-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                type="button"
                onClick={() => setActiveTab("credentials")}
                className={`flex-1 px-2 py-1 text-xs rounded-md transition ${
                  activeTab === "credentials"
                    ? "bg-blue-600 text-white"
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`
                }`}
              >
                Username/Password
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pin")}
                className={`flex-1 px-2 py-1 text-xs rounded-md transition ${
                  activeTab === "pin"
                    ? "bg-blue-600 text-white"
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`
                }`}
              >
                PIN
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex-1 px-2 py-1 text-xs rounded-md transition ${
                  activeTab === "profile"
                    ? "bg-blue-600 text-white"
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`
                }`}
              >
                Profile
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-1.5">
              {activeTab === "credentials" ? (
                <>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Current Username
                    </label>
                    <input
                      type="text"
                      value={formData.currentUsername}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          currentUsername: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${darkMode ? 'border-gray-700 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                      placeholder="Current username"
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                          autoComplete="current-password"
                        value={formData.currentPassword}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${darkMode ? 'border-gray-700 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                        placeholder="Current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("current")}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showPasswords.current ? <FaEye /> : <FaEyeSlash />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      New Username
                    </label>
                    <input
                      type="text"
                      value={formData.newUsername}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          newUsername: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${darkMode ? 'border-gray-700 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                      placeholder="New username"
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                          autoComplete="new-password"
                        value={formData.newPassword}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${darkMode ? 'border-gray-700 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                        placeholder="New password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("new")}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showPasswords.new ? <FaEye /> : <FaEyeSlash />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.newPassword && (
                      <div className="mt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex gap-1 flex-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`h-1.5 flex-1 rounded ${
                                  passwordStrength.score >= level
                                    ? passwordStrength.score <= 2
                                      ? "bg-red-500"
                                      : passwordStrength.score <= 3
                                        ? "bg-yellow-500"
                                        : passwordStrength.score <= 4
                                          ? "bg-green-400"
                                          : "bg-green-600"
                                    : "bg-gray-300 dark:bg-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              passwordStrength.score <= 2
                                ? "text-red-600"
                                : passwordStrength.score <= 3
                                  ? "text-yellow-600"
                                  : passwordStrength.score <= 4
                                    ? "text-green-500"
                                    : "text-green-700"
                            }`}
                          >
                            {passwordStrength.score}/5
                          </span>
                        </div>
                        <p
                          className={`text-xs ${
                            passwordStrength.isValid
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {passwordStrength.message}
                        </p>
                        {passwordError && showPasswordError && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {passwordError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                          autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${darkMode ? 'border-gray-700 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("confirm")}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showPasswords.confirm ? <FaEye /> : <FaEyeSlash />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      SMS Verification Code
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm tracking-widest ${darkMode ? 'border-gray-700 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                        placeholder="6-digit code"
                        maxLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleRequestOTP}
                        disabled={otpLoading}
                        className={`px-2 py-2 whitespace-nowrap rounded-lg transition text-xs font-medium ${
                          otpSent
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-amber-500 text-white hover:bg-amber-600"
                        } disabled:opacity-50`}
                      >
                        {otpLoading
                          ? "Sending..."
                          : otpSent
                            ? "Resend Code"
                            : "Send Code"}
                      </button>
                    </div>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      A 6-digit code will be sent to your registered phone number.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Update
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Current PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.currentPin ? "text" : "password"}
                        value={formData.currentPIN || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            currentPIN: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${darkMode ? 'border-gray-700 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                        placeholder="Enter current 4-digit PIN"
                        maxLength={4}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("currentPin")}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showPasswords.currentPin ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      New PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.pin ? "text" : "password"}
                        value={formData.newPIN}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            newPIN: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${darkMode ? 'border-gray-700 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                        placeholder="4-digit PIN"
                        maxLength={4}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("pin")}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showPasswords.pin ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Confirm New PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirmPin ? "text" : "password"}
                        value={formData.confirmPIN}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            confirmPIN: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${darkMode ? 'border-gray-700 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                        placeholder="Confirm 4-digit PIN"
                        maxLength={4}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("confirmPin")}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showPasswords.confirmPin ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 text-sm"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Update PIN
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : activeTab === "profile" ? (
                <>
                  <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Set your phone number so you can receive SMS verification codes.
                  </p>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone_number}
                      onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${darkMode ? 'border-gray-700 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                      placeholder="0241234567 or +233241234567"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${darkMode ? 'border-gray-700 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-gray-50'}`}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                      disabled={profileLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      disabled={profileLoading}
                    >
                      {profileLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Save Profile
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function PINInput({ onSuccess, onCancel, pinStatus, onSetupPIN, darkMode = false }) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }

    setLoading(true);
    try {
      if (pinStatus === "not_setup") {
        const success = await onSetupPIN(pin);
        if (success) {
          onSuccess(pin);
        }
      } else {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/api/pin/verify/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          credentials: "include",
          body: JSON.stringify({ pin }),
        });

        const data = await res.json();

        if (res.ok && data.is_valid) {
          onSuccess(pin);
        } else {
          if (res.status === 429) {
            toast.error(
              data.error ||
                "Too many PIN attempts. Please wait before trying again."
            );
          } else {
            toast.error(data.error || "Invalid PIN");
          }
        }
      }
    } catch (err) {
      toast.error("Failed to verify PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const getButtonText = () => {
    if (loading) {
      return (
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 border-2 border-white border-t-blue-500 rounded-full animate-spin"></span>
          <span>
            {pinStatus === "not_setup" ? "Setting up..." : "Verifying..."}
          </span>
        </span>
      );
    }
    return pinStatus === "not_setup" ? "Setup PIN" : "Verify PIN";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.slice(0, 4))}
          onKeyPress={handleKeyPress}
          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400  dark:text-white text-center tracking-widest bg-gray-800 placeholder-gray-400 text-sm"
          placeholder="••••"
          maxLength={4}
          autoFocus
          disabled={loading}
          style={{ letterSpacing: "0.2em" }}
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
          {getButtonText()}
        </button>
      </div>
    </form>
  );
}