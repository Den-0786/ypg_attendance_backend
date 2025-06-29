"use client";

import { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaBars,
  FaDatabase,} from "react-icons/fa";

import { useRouter } from "next/navigation";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import ChangePasswordForm from "./ChangePasswordForm";
import MonthlyAttendanceTrendChart from './dashboard/MonthlyAttendanceTrendChart';
import RecordsLibrary from "./RecordsLibrary";

import DistrictExecutiveChart from './dashboard/DistrictExecutiveChart';
import YearEndChart from './dashboard/YearEndChart';
import MonthlyAttendanceGrid from './dashboard/MonthlyAttendanceGrid';
import DashboardLocal from "./DashboardLocal";
import DashboardDistrict from "./DashboardDistrict";
import DashboardHome from "./DashboardHome";
import PINModal from "./PINModal";

const Sidebar = ({
  view,
  setView,
  darkMode,
  toggleDarkMode,
  handleLogout,
  isMobile,
  setShowSidebar,
  onManageMeeting,
  onShowChangePassword,
  router,
  selectedYear,
  setSelectedYear,
}) => (
  <div
    className={cn(
      "fixed md:static z-50 h-screen w-64 p-4 border-r flex flex-col justify-between transition-transform duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white md:translate-x-0",
      isMobile ? "translate-x-0" : "-translate-x-full"
    )}
  >
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <button className="md:hidden" onClick={() => setShowSidebar(false)}>
          ✖
        </button>
      </div>
      <div className="space-y-2 mt-4">
        <button
          onClick={() => {
            setView("home");
            if (isMobile) setShowSidebar(false);
          }}
          className={cn(
            "w-full text-left px-4 py-2 rounded",
            view === "home"
              ? "bg-blue-600 text-white"
              : "hover:bg-blue-100 dark:hover:bg-gray-800"
          )}
        >
          Home
        </button>
        <button
          onClick={() => {
            setView("local");
            if (isMobile) setShowSidebar(false);
          }}
          className={cn(
            "w-full text-left px-4 py-2 rounded",
            view === "local"
              ? "bg-blue-600 text-white"
              : "hover:bg-blue-100 dark:hover:bg-gray-800"
          )}
        >
          Local
        </button>
        <button
          onClick={() => {
            setView("district");
            if (isMobile) setShowSidebar(false);
          }}
          className={cn(
            "w-full text-left px-4 py-2 rounded",
            view === "district"
              ? "bg-blue-600 text-white"
              : "hover:bg-blue-100 dark:hover:bg-gray-800"
          )}
        >
          District
        </button>
        <button
          onClick={() => {
            setView("records");
            if (isMobile) setShowSidebar(false);
          }}
          className={cn(
            "w-full text-left px-4 py-2 rounded flex items-center gap-2",
            view === "records"
              ? "bg-blue-600 text-white"
              : "hover:bg-blue-100 dark:hover:bg-gray-800"
          )}
        >
          <FaDatabase /> Records
        </button>
      </div>
    </div>
    <div className="space-y-3">
      {/* Year Selector */}
      <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Year Selection</h3>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Data closes on Dec 31st of each year
        </p>
      </div>

      {/* Action Buttons Group */}
      <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Actions</h3>
        <button
          onClick={() => setShowChangePasswordModal(true)}
          className="w-full text-left px-4 py-2 rounded hover:bg-blue-300 dark:hover:bg-gray-800"
        >
          Change Credentials
        </button>
        <button
          onClick={() => router.push('/forms')}
          className="w-full text-left px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Set Meeting
        </button>
        <button
          onClick={onManageMeeting}
          className="w-full text-left px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          Manage Meeting
        </button>
      </div>
      
      {/* Utility Buttons */}
      <div className="space-y-2">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          Toggle Mode {darkMode ? <FaMoon /> : <FaSun />}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Logout <FaSignOutAlt />
        </button>
      </div>
    </div>
  </div>
);

// Helper to get month names
const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function getTopAttendee(attendanceData, year) {
  const counts = {};
  attendanceData.forEach(entry => {
    const date = new Date(entry.meeting_date);
    if (date.getFullYear() === year) {
      const key = entry.name || entry.congregation;
      counts[key] = (counts[key] || 0) + 1;
    }
  });
  let topPerson = null, max = 0;
  for (const [person, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      topPerson = person;
    }
  }
  return { topPerson, max, counts };
}

// Add function to get top 3 congregations
function getTopCongregations(attendanceData, year) {
  const counts = {};
  attendanceData.forEach(entry => {
    const date = new Date(entry.meeting_date);
    if (date.getFullYear() === year && entry.congregation) {
      counts[entry.congregation] = (counts[entry.congregation] || 0) + 1;
    }
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
}

function handleEditAttendance(id) {
  toast(`Edit functionality for entry ${id} - not implemented yet`);
}

function handleDeleteAttendance(id) {
  toast(`Delete functionality for entry ${id} - not implemented yet`);
}

export default function Dashboard({ onLogout }) {
  const [view, setView] = useState("home");
  const [darkMode, setDarkMode] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [apologyData, setApologyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showManageMeetingModal, setShowManageMeetingModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const router = useRouter();
  
  // Get available years from attendance data
  const getAvailableYears = () => {
    const years = new Set();
    const currentYear = new Date().getFullYear();
    
    // Always include current year
    years.add(currentYear);
    
    // Add years from attendance data, but only current year and future years
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach(entry => {
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
    
    return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
  };

  const availableYears = getAvailableYears();

  // Update selected year if current selection is not available
  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || new Date().getFullYear());
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/attendance-summary', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch attendance data');
      const data = await res.json();
      setAttendanceData(data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to fetch attendance data');
    }
  };

  const fetchApologies = async () => {
    try {
      const res = await fetch('/api/submit-apologies', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch apology data');
      const data = await res.json();
      setApologyData(data);
    } catch (error) {
      console.error('Error fetching apology data:', error);
      // Don't show error toast for apologies as they might not exist yet
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchAttendance(), fetchApologies()]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleDeactivateWithPIN = async () => {
    setDeactivating(true);
    try {
      const res = await fetch('/api/deactivate-meeting', { 
        method: 'POST',
        credentials: 'include'
      });
      
      if (res.ok) {
        toast.success('Meeting deactivated successfully!');
        // Optionally refresh the page or update state
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to deactivate meeting');
      }
    } catch (err) {
      toast.error('Network error occurred');
    } finally {
      setDeactivating(false);
      setShowPINModal(false);
    }
  };

  const handlePINSuccess = () => {
    handleDeactivateWithPIN();
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
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="text-2xl"
        >
          <FaBars />
        </button>
      </div>

      {/* Fixed Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 p-4 border-r flex flex-col justify-between transition-transform duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-y-auto",
        showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <button className="md:hidden" onClick={() => setShowSidebar(false)}>
              ✖
            </button>
          </div>
          <div className="space-y-2 mt-4">
            <button
              onClick={() => {
                setView("home");
                if (isMobile) setShowSidebar(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2 rounded",
                view === "home"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-100 dark:hover:bg-gray-800"
              )}
            >
              Home
            </button>
            <button
              onClick={() => {
                setView("local");
                if (isMobile) setShowSidebar(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2 rounded",
                view === "local"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-100 dark:hover:bg-gray-800"
              )}
            >
              Local
            </button>
            <button
              onClick={() => {
                setView("district");
                if (isMobile) setShowSidebar(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2 rounded",
                view === "district"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-100 dark:hover:bg-gray-800"
              )}
            >
              District
            </button>
            <button
              onClick={() => {
                setView("records");
                if (isMobile) setShowSidebar(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2 rounded flex items-center gap-2",
                view === "records"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-100 dark:hover:bg-gray-800"
              )}
            >
              <FaDatabase /> Records
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {/* Year Selector */}
          <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Year Selection</h3>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Data closes on Dec 31st of each year
            </p>
          </div>

          {/* Action Buttons Group */}
          <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Actions</h3>
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="w-full text-left px-4 py-2 text-white bg-amber-500 rounded hover:bg-blue-300 dark:hover:bg-gray-800"
            >
              Change Credentials
            </button>
            <button
              onClick={() => router.push('/forms')}
              className="w-full text-left px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Set Meeting
            </button>
            <button
              onClick={handleManageMeeting}
              className="w-full text-left px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Manage Meeting
            </button>
          </div>
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Toggle Mode {darkMode ? <FaMoon /> : <FaSun />}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout <FaSignOutAlt />
          </button>
        </div>
      </div>

      {/* Main scrollable content area */}
      <div className="flex-1 p-3 md:p-6 overflow-y-auto md:ml-64">
        {view === "home" ? (
          <DashboardHome 
            darkMode={darkMode}
            attendanceData={attendanceData}
            apologyData={apologyData}
            currentYear={selectedYear}
            onEdit={handleEditAttendance}
            onDelete={handleDeleteAttendance}
            refetchAttendanceData={fetchAttendance}
            refetchApologyData={fetchApologies}
          />
        ) : view === "local" ? (
          <DashboardLocal 
            darkMode={darkMode} 
            attendanceData={attendanceData}
            apologyData={apologyData}
            onEdit={handleEditAttendance} 
            onDelete={handleDeleteAttendance}
            refetchAttendanceData={fetchAttendance}
            refetchApologyData={fetchApologies}
          />
        ) : view === "district" ? (
          <DashboardDistrict 
            darkMode={darkMode} 
            attendanceData={attendanceData}
            apologyData={apologyData}
            onEdit={handleEditAttendance} 
            onDelete={handleDeleteAttendance}
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
        <div className="fixed inset-0 bg-black text-white bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Manage Meeting</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to deactivate the current meeting? This will allow you to set a new meeting with different details.
            </p>
            {deactivating ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-12 w-12 mb-4 animate-spin border-t-blue-600"></div>
                <span className="text-blue-600 dark:text-blue-300 font-semibold">Deactivating meeting...</span>
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
        <ChangePasswordForm onClose={() => setShowChangePasswordModal(false)} />
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