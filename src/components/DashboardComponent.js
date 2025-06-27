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
          onClick={() => setView("home")}
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
          onClick={() => setView("local")}
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
          onClick={() => setView("district")}
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
          onClick={() => setView("records")}
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
      {/* Action Buttons Group */}
      <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Actions</h3>
        <button
          onClick={() => router.push('/forms')}
          className="w-full text-left px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Set Meeting
        </button>
        <button
          onClick={onManageMeeting}
          className="w-full text-left px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          Manage Meeting
        </button>
        <button
          onClick={onShowChangePassword}
          className="w-full text-left px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Change Password
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

export default function Dashboard({ onLogout }) {
  const [view, setView] = useState("home");
  const [darkMode, setDarkMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showManageMeetingModal, setShowManageMeetingModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);
  const router = useRouter();

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

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const res = await fetch("/api/attendance-summary/", { credentials: "include" });
        const data = await res.json();
        setAttendanceData(data);
      } catch (err) {
        toast.error("Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, []);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem("role");
    onLogout();
  };

  const handleManageMeeting = () => {
    setShowManageMeetingModal(true);
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
              onClick={() => setView("home")}
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
              onClick={() => setView("local")}
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
              onClick={() => setView("district")}
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
              onClick={() => setView("records")}
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
          {/* Action Buttons Group */}
          <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Actions</h3>
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="w-full text-left px-4 py-2 rounded hover:bg-blue-300 dark:hover:bg-gray-800"
            >
              Change Password
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
            getTopCongregations={getTopCongregations}
            attendanceData={attendanceData}
            currentYear={new Date().getFullYear()}
          />
        ) : view === "local" ? (
          <DashboardLocal darkMode={darkMode} />
        ) : view === "district" ? (
          <DashboardDistrict darkMode={darkMode} />
        ) : view === "records" ? (
          <RecordsLibrary darkMode={darkMode} />
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
                onClick={async () => {
                  setDeactivating(true);
                  // Simulate API call or add your real API call here
                  try {
                    // await fetch('/api/deactivate-meeting', { method: 'POST' });
                    await new Promise(res => setTimeout(res, 1500));
                    toast.success('Meeting deactivated!');
                  } catch (err) {
                    toast.error('Failed to deactivate meeting');
                  } finally {
                    setDeactivating(false);
                    setShowManageMeetingModal(false);
                  }
                }}
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

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordForm onClose={() => setShowChangePasswordModal(false)} />
      )}
    </div>
  );
}