"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaBars,
  FaHome,
  FaChartBar,
  FaMapMarkedAlt,
  FaBook,
  FaCogs,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
} from "react-icons/fa";

import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import toast from "react-hot-toast";
import ChangePasswordForm from "../forms/ChangePasswordForm";
import RecordsLibrary from "../records/RecordsLibrary";
import PINModal from "../auth/PINModal";
import MeetingConfigForm from "../forms/MeetingConfigForm";
import DashboardHome from "./DashboardHome";
import DashboardLocal from "./DashboardLocal";
import DashboardDistrict from "./DashboardDistrict";
import { BASE_URL } from "../../lib/config";

const API_URL = BASE_URL;

export default function Dashboard({ onLogout }) {
  const [view, setView] = useState("home");
  const [darkMode, setDarkMode] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [apologyData, setApologyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showManageMeetingModal, setShowManageMeetingModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showMeetingConfigModal, setShowMeetingConfigModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentUser, setCurrentUser] = useState(null);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [loadingMeeting, setLoadingMeeting] = useState(false);
  const router = useRouter();
  const sidebarRef = useRef(null);

  // Add click outside handler for sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showSidebar && 
        isMobile && 
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest('.sidebar-toggle-button')
      ) {
        setShowSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSidebar, isMobile]);

  // Get available years from attendance data
  const getAvailableYears = () => {
    const years = new Set();
    const currentYear = new Date().getFullYear();

    // Always include current year
    years.add(currentYear);

    // Add years from attendance data, but only current year and future years
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach((entry) => {
        if (entry.meeting_date) {
          const date = new Date(entry.meeting_date);
          const entryYear = date.getFullYear();
          // Only include current year and future years, exclude 2024 and earlier
          if (entryYear >= currentYear) {
            years.add(entryYear);
          }
        }
      });
    }

    return Array.from(years).sort((a, b) => b - a);
  };

  const availableYears = getAvailableYears();

  // Defensive: ensure availableYears is always an array
  const availableYearsArray = Array.isArray(availableYears)
    ? availableYears
    : [];

  // Update selected year if current selection is not available
  useEffect(() => {
    if (!availableYearsArray.includes(selectedYear)) {
      setSelectedYear(availableYearsArray[0] || new Date().getFullYear());
    }
  }, [availableYearsArray, selectedYear]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const fetchCurrentMeeting = async () => {
    setLoadingMeeting(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/api/current-meeting`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
        }
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setCurrentMeeting(data);
      } else {
        setCurrentMeeting(null);
      }
    } catch (error) {
      console.error('Error fetching current meeting:', error);
      setCurrentMeeting(null);
    } finally {
      setLoadingMeeting(false);
    }
  };

  useEffect(() => {
    fetchCurrentMeeting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch current user info
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/session-status`, {
        headers: {
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      const data = await response.json();
      setCurrentUser(data);
    } catch (err) {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/attendance-summary`, {
        headers: {
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      const data = await response.json();
      setAttendanceData(Array.isArray(data) ? data : []);
    } catch (err) {
      setAttendanceData([]);
    }
  };

  const fetchApologies = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/apology-summary`, {
        headers: {
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      const data = await response.json();
      setApologyData(Array.isArray(data) ? data : []);
    } catch (err) {
      setApologyData([]);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchAttendance(), fetchApologies()]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem("role");
    onLogout();
  };

  const handleManageMeeting = () => {
    setShowManageMeetingModal(true);
  };

  const handleDeactivateMeeting = () => {
    setShowManageMeetingModal(false);
    setShowPINModal(true);
  };

  const handleDeactivateWithPIN = async (pin) => {
    setDeactivating(true);
    try {
      if (!pin) {
        toast.error("PIN is required");
        setDeactivating(false);
        return;
      }

      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/api/deactivate-meeting`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        toast.success("Meeting deactivated successfully!");
        setShowPINModal(false);
        setCurrentMeeting(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to deactivate meeting");
      }
    } catch (err) {
      toast.error("Network error occurred");
    } finally {
      setDeactivating(false);
    }
  };

  const handlePINSuccess = (pin) => {
    handleDeactivateWithPIN(pin);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-12 w-12 mb-4 animate-spin border-t-blue-600"></div>
        <span className="ml-4">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-screen relative",
        darkMode ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-900"
      )}
    >
      {/* Mobile hamburger */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className={cn(
          "fixed top-4 left-4 z-50 p-2 rounded-lg border transition-all duration-300 sidebar-toggle-button md:hidden",
          darkMode ? "bg-gray-800 text-amber-400 border-amber-500/30 hover:bg-gray-700" : "bg-white text-amber-600 border-gray-300 hover:bg-gray-100"
        )}
        aria-label={showSidebar ? "Close menu" : "Open menu"}
      >
        <FaBars size={20} />
      </button>

      {/* Fixed Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-40 h-screen border-r flex flex-col justify-between transition-all duration-300 overflow-y-auto border-amber-500/30",
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900",
          isMobile ? (showSidebar ? "translate-x-0 w-64 p-4" : "-translate-x-full w-64 p-4") : (sidebarCollapsed ? "translate-x-0 w-20 p-2" : "translate-x-0 w-64 p-4")
        )}
        ref={sidebarRef}
      >
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className={cn(
              "font-bold transition-all duration-300",
              darkMode ? 'text-amber-400' : 'text-amber-600',
              sidebarCollapsed && !isMobile ? "text-lg text-center w-full" : "text-2xl"
            )}>
              {sidebarCollapsed && !isMobile ? "D" : "Dashboard"}
            </h2>
            <div className="flex items-center gap-2">
              {/* Desktop collapse/expand toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={cn(
                  "hidden md:flex items-center justify-center p-1.5 rounded-lg transition-colors",
                  darkMode ? "text-gray-400 hover:text-amber-400 hover:bg-gray-800" : "text-gray-500 hover:text-amber-600 hover:bg-gray-100"
                )}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
              </button>
              {/* Mobile close */}
              <button className={`md:hidden ${darkMode ? 'text-gray-400 hover:text-amber-400' : 'text-gray-500 hover:text-amber-600'}`} onClick={() => setShowSidebar(false)}>
                <FaTimes size={20} />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                setView("home");
                if (isMobile) setShowSidebar(false);
              }}
              className={cn(
                "w-full rounded-lg transition-all duration-300 flex items-center font-medium border",
                sidebarCollapsed && !isMobile ? "justify-center px-2 py-3" : "text-left px-4 py-3 gap-3",
                view === "home"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/30"
                  : darkMode ? "bg-transparent text-gray-300 border-gray-700 hover:border-amber-500 hover:text-amber-400" : "bg-transparent text-gray-700 border-gray-300 hover:border-amber-500 hover:text-amber-600"
              )}
              title="Home"
            >
              <FaHome size={18} />
              {(!sidebarCollapsed || isMobile) && <span>Home</span>}
            </button>
            <button
              onClick={() => {
                setView("local");
                if (isMobile) setShowSidebar(false);
              }}
              className={cn(
                "w-full rounded-lg transition-all duration-300 flex items-center font-medium border",
                sidebarCollapsed && !isMobile ? "justify-center px-2 py-3" : "text-left px-4 py-3 gap-3",
                view === "local"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/30"
                  : darkMode ? "bg-transparent text-gray-300 border-gray-700 hover:border-amber-500 hover:text-amber-400" : "bg-transparent text-gray-700 border-gray-300 hover:border-amber-500 hover:text-amber-600"
              )}
              title="Local"
            >
              <FaChartBar size={18} />
              {(!sidebarCollapsed || isMobile) && <span>Local</span>}
            </button>
            <button
              onClick={() => {
                setView("district");
                if (isMobile) setShowSidebar(false);
              }}
              className={cn(
                "w-full rounded-lg transition-all duration-300 flex items-center font-medium border",
                sidebarCollapsed && !isMobile ? "justify-center px-2 py-3" : "text-left px-4 py-3 gap-3",
                view === "district"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/30"
                  : darkMode ? "bg-transparent text-gray-300 border-gray-700 hover:border-amber-500 hover:text-amber-400" : "bg-transparent text-gray-700 border-gray-300 hover:border-amber-500 hover:text-amber-600"
              )}
              title="District"
            >
              <FaMapMarkedAlt size={18} />
              {(!sidebarCollapsed || isMobile) && <span>District</span>}
            </button>
            <button
              onClick={() => {
                setView("records");
                if (isMobile) setShowSidebar(false);
              }}
              className={cn(
                "w-full rounded-lg transition-all duration-300 flex items-center font-medium border",
                sidebarCollapsed && !isMobile ? "justify-center px-2 py-3" : "text-left px-4 py-3 gap-3",
                view === "records"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/30"
                  : darkMode ? "bg-transparent text-gray-300 border-gray-700 hover:border-amber-500 hover:text-amber-400" : "bg-transparent text-gray-700 border-gray-300 hover:border-amber-500 hover:text-amber-600"
              )}
              title="Records"
            >
              <FaBook size={18} />
              {(!sidebarCollapsed || isMobile) && <span>Records</span>}
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {/* Year Selector - hidden when collapsed on desktop */}
          {(!sidebarCollapsed || isMobile) && (
            <div className={`space-y-2 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-amber-500/30' : 'bg-gray-100 border-gray-300'}`}>
              <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                Year
              </h3>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md text-sm ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              >
                {Array.isArray(availableYearsArray) &&
                  availableYearsArray.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Current Meeting Info - hidden when collapsed on desktop */}
          {(!sidebarCollapsed || isMobile) && (
            <div className={`space-y-2 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-amber-500/30' : 'bg-gray-100 border-gray-300'}`}>
              <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                Current Meeting
              </h3>
              {loadingMeeting ? (
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</p>
              ) : currentMeeting ? (
                <div className="space-y-2">
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Title</p>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentMeeting.title || '—'}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</p>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentMeeting.date || '—'}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Member Login</p>
                    <p className={`text-sm font-semibold break-all ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{currentMeeting.login_username || '—'}</p>
                  </div>
                </div>
              ) : (
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No active meeting.</p>
              )}
            </div>
          )}

          {/* Actions accordion - hidden until toggled */}
          {(!sidebarCollapsed || isMobile) && (
            <div className={`rounded-xl border ${darkMode ? 'bg-gray-800 border-amber-500/30' : 'bg-gray-100 border-gray-300'}`}>
              <button
                onClick={() => setShowActions(!showActions)}
                className={`w-full flex items-center justify-between p-4 text-sm font-semibold ${darkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'} transition-colors`}
              >
                <span>Actions</span>
                {showActions ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
              </button>
              {showActions && (
                <div className="px-4 pb-4 space-y-2">
                  <button
                    onClick={() => setShowChangePasswordModal(true)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 font-medium border ${darkMode ? 'text-gray-300 bg-transparent border-gray-700 hover:bg-gray-700 hover:border-amber-500' : 'text-gray-700 bg-transparent border-gray-300 hover:bg-gray-200 hover:border-amber-500'}`}
                  >
                    Change Credentials
                  </button>
                  <button
                    onClick={() => router.push("/forms")}
                    className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-blue-700 to-blue-900 text-white hover:from-blue-800 hover:to-blue-900 transition-all duration-200 font-medium shadow-md hover:shadow-lg border border-blue-600"
                  >
                    Go to Form
                  </button>
                  <button
                    onClick={() => setShowMeetingConfigModal(true)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg border border-amber-500"
                  >
                    Set Meeting
                  </button>
                  <button
                    onClick={handleManageMeeting}
                    className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-blue-700 to-blue-900 text-white hover:from-blue-800 hover:to-blue-900 transition-all duration-200 font-medium shadow-md hover:shadow-lg border border-blue-600"
                  >
                    Manage Meeting
                  </button>
                </div>
              )}
            </div>
          )}

          {/* When collapsed on desktop, show a compact Actions icon to expand the sidebar and reveal actions */}
          {sidebarCollapsed && !isMobile && (
            <button
              onClick={() => {
                setSidebarCollapsed(false);
                setShowActions(true);
              }}
              className={cn(
                "w-full flex items-center justify-center py-3 rounded-lg border font-medium",
                darkMode ? "text-amber-400 border-gray-700 hover:border-amber-500 hover:bg-gray-800" : "text-amber-600 border-gray-300 hover:border-amber-500 hover:bg-gray-100"
              )}
              title="Open actions"
            >
              <FaCogs size={18} />
            </button>
          )}

          <button
            onClick={toggleDarkMode}
            className={cn(
              "w-full flex items-center rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg border border-amber-500 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700",
              sidebarCollapsed && !isMobile ? "justify-center px-2 py-3" : "justify-between px-4 py-3"
            )}
            title="Toggle dark mode"
          >
            {(!sidebarCollapsed || isMobile) && <span>Toggle Mode</span>}
            {darkMode ? <FaMoon size={18} /> : <FaSun size={18} />}
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg border border-red-600 bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800",
              sidebarCollapsed && !isMobile ? "justify-center px-2 py-3" : "justify-between px-4 py-3"
            )}
            title="Logout"
          >
            {(!sidebarCollapsed || isMobile) && <span>Logout</span>}
            <FaSignOutAlt size={18} />
          </button>
        </div>
      </div>

      {/* Main scrollable content area */}
      <div className={cn(
        "flex-1 p-3 md:p-6 overflow-y-auto transition-all duration-300",
        darkMode ? 'bg-gray-900' : 'bg-gray-100',
        isMobile ? "md:ml-0" : (sidebarCollapsed ? "md:ml-20" : "md:ml-64")
      )}>
        {view === "home" ? (
          <DashboardHome
            darkMode={darkMode}
            attendanceData={attendanceData}
            apologyData={apologyData}
            currentYear={selectedYear}
            onEdit={() => {}}
            onDelete={() => {}}
            refetchAttendanceData={fetchAttendance}
            refetchApologyData={fetchApologies}
          />
        ) : view === "local" ? (
          <DashboardLocal
            darkMode={darkMode}
            attendanceData={attendanceData}
            apologyData={apologyData}
            onEdit={() => {}}
            onDelete={() => {}}
            refetchAttendanceData={fetchAttendance}
            refetchApologyData={fetchApologies}
          />
        ) : view === "district" ? (
          <DashboardDistrict
            darkMode={darkMode}
            attendanceData={attendanceData}
            apologyData={apologyData}
            onEdit={() => {}}
            onDelete={() => {}}
            refetchAttendanceData={fetchAttendance}
            refetchApologyData={fetchApologies}
          />
        ) : view === "records" ? (
          <RecordsLibrary
            darkMode={darkMode}
            attendanceData={attendanceData}
            apologyData={apologyData}
          />
        ) : null}
      </div>

      {/* Manage Meeting Modal */}
      {showManageMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Manage Meeting
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to deactivate the current meeting? This will
              allow you to set a new meeting with different details.
            </p>
            {deactivating ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-12 w-12 mb-4 animate-spin border-t-blue-600"></div>
                <span className="text-blue-600 dark:text-blue-300 font-semibold">
                  Deactivating meeting...
                </span>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowManageMeetingModal(false)}
                  className="px-4 py-2 bg-gray-400 rounded text-white hover:bg-gray-500"
                  disabled={deactivating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivateMeeting}
                  className="px-4 py-2 bg-red-600 rounded text-white hover:bg-red-700"
                  disabled={deactivating}
                >
                  Deactivate Meeting
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change Credentials Modal */}
      {showChangePasswordModal && (
        <ChangePasswordForm
          onClose={() => setShowChangePasswordModal(false)}
          currentUser={currentUser}
          darkMode={darkMode}
        />
      )}

      {/* Meeting Config Modal */}
      {showMeetingConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set Meeting</h2>
                <button
                  onClick={() => setShowMeetingConfigModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <MeetingConfigForm
                onMeetingConfigured={() => {
                  setShowMeetingConfigModal(false);
                  // Refresh data
                  fetchAttendance();
                  fetchCurrentMeeting();
                }}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      <PINModal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        onSuccess={handlePINSuccess}
        title="Enter PIN to Deactivate Meeting"
        message="Please enter the 4-digit PIN to deactivate the current meeting"
      />
    </div>
  );
} 