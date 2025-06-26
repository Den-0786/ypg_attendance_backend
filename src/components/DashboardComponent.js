"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaBars,
  FaDatabase,
  FaCog,
  FaCalendarAlt,
  FaChartPie,
  FaList,
  FaUsers,
  FaTrash,
  FaEdit,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import ChangePasswordForm from "./ChangePasswordForm";
import MeetingDateForm from "./MeetingDateForm";
import RecordsManager from "./RecordsManager";
import MeetingTypePieChart from "./dashboard/MeetingTypePieChart";
import DistrictExecutiveChart from './dashboard/DistrictExecutiveChart';
import YearEndChart from './dashboard/YearEndChart';
import MonthlyAttendanceGrid from './dashboard/MonthlyAttendanceGrid';

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

export default function Dashboard({ onLogout }) {
  const [view, setView] = useState("local");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [attendanceData, setAttendanceData] = useState([]);
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedName, setSelectedName] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showManageMeetingModal, setShowManageMeetingModal] = useState(false);
  const [recordType, setRecordType] = useState("attendance");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (view !== "records") {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const fetchData = async () => {
    try {
      const url = view === "local"
        ? `/api/local-attendance`
        : `/api/district-attendance`;
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to fetch attendance data');
    }
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("role");
    onLogout();
  };

  const handleManageMeeting = () => {
    setShowManageMeetingModal(true);
  };

  const handleDeactivateMeeting = async () => {
    try {
      const res = await fetch(`/api/deactivate-meeting`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      toast.success('Meeting deactivated successfully');
      setShowManageMeetingModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to deactivate meeting');
    }
  };

  const confirmDelete = (id, name) => {
    setSelectedId(id);
    setSelectedName(name);
    setShowConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const response = await fetch(
        `/api/delete-attendance/${selectedId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      
      if (response.ok) {
        toast.success("Deleted successfully");
        setShowConfirm(false);
        fetchData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Delete failed");
      }
    } catch (err) {
      toast.error("Network error: Unable to delete record");
    }
  };

  const handleEdit = (id, name) => {
    setSelectedId(id);
    setSelectedName(name);
    setEditValue(name);
    setEditModal(true);
  };

  const handleEditSave = async () => {
    try {
      const response = await fetch(`/api/edit-attendance/${selectedId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ congregation: editValue }),
      });
      
      if (response.ok) {
        toast.success("Updated successfully");
        setEditModal(false);
        fetchData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Update failed");
      }
    } catch (err) {
      toast.error("Network error: Unable to update record");
    }
  };

  const getAttendanceSummary = () => {
    const summary = {};
    attendanceData.forEach((entry) => {
      if (!summary[entry.congregation]) {
        summary[entry.congregation] = [];
      }
      summary[entry.congregation].push(entry);
    });
    return summary;
  };

  const getLocalProgress = () => {
    const currentYear = new Date().getFullYear();
    
    // Count congregations with attendance in current year
    const congregationsWithAttendance = new Set();
    attendanceData.forEach(entry => {
      const date = new Date(entry.meeting_date);
      if (date.getFullYear() === currentYear && entry.type !== 'district') {
        congregationsWithAttendance.add(entry.congregation);
      }
    });
    
    const totalCongregations = 9; // All system congregations
    const progress = (congregationsWithAttendance.size / totalCongregations) * 100;
    return Math.round(progress);
  };

  const getDistrictProgress = () => {
    const currentYear = new Date().getFullYear();
    
    // Count district positions with attendance in current year
    const positionsWithAttendance = new Set();
    attendanceData.forEach(entry => {
      const date = new Date(entry.meeting_date);
      if (date.getFullYear() === currentYear && entry.type === 'district') {
        positionsWithAttendance.add(entry.position);
      }
    });
    
    const totalPositions = 8; // All district positions
    const progress = (positionsWithAttendance.size / totalPositions) * 100;
    return Math.round(progress);
  };

  const getGrandTotalProgress = () => {
    const currentYear = new Date().getFullYear();
    
    // Count all entities (congregations + district positions) with attendance in current year
    const entitiesWithAttendance = new Set();
    attendanceData.forEach(entry => {
      const date = new Date(entry.meeting_date);
      if (date.getFullYear() === currentYear) {
        if (entry.type === 'district') {
          entitiesWithAttendance.add(`district_${entry.position}`);
        } else {
          entitiesWithAttendance.add(`local_${entry.congregation}`);
        }
      }
    });
    
    const totalEntities = 17; // 9 congregations + 8 district positions
    const progress = (entitiesWithAttendance.size / totalEntities) * 100;
    return Math.round(progress);
  };

  const summary = getAttendanceSummary();
  
  // Create year-end summary with all 12 months
  const createYearEndSummary = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    console.log('Creating year-end summary for year:', currentYear);
    console.log('Total attendance data:', attendanceData.length);
    
    // Group attendance by congregation and month
    const monthlyData = {};
    attendanceData.forEach(entry => {
      const date = new Date(entry.meeting_date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        const congregation = entry.congregation;
        
        if (!monthlyData[congregation]) {
          monthlyData[congregation] = Array(12).fill(0);
        }
        monthlyData[congregation][month]++;
      }
    });

    console.log('Monthly data by congregation:', monthlyData);

    // Convert to chart data format - count all 12 months
    const result = Object.keys(monthlyData).map(congregation => ({
      name: congregation,
      count: monthlyData[congregation].reduce((sum, count) => sum + count, 0),
      monthlyCounts: monthlyData[congregation],
      // Add percentage of months with attendance
      attendanceRate: (monthlyData[congregation].filter(count => count > 0).length / 12) * 100
    }));

    console.log('Year-end summary result:', result);
    return result;
  };

  const yearEndData = createYearEndSummary();

  const renderCircles = (entries, name) => {
    const total = entries.length;
    const id = entries[0]?.id;

    return (
      <div className="flex gap-2 items-center">
        {[0, 1].map((i) => (
          <span key={i} className="text-lg">
            {i < total ? (
              <FaCheckCircle className="text-green-500" />
            ) : (
              <FaTimesCircle className="text-red-500" />
            )}
          </span>
        ))}
        <button
          onClick={() => handleEdit(id, name)}
          className="text-blue-500 hover:underline text-sm ml-2"
        >
          Edit
        </button>
        <button
          onClick={() => confirmDelete(id, name)}
          className="text-red-500 hover:underline text-sm"
        >
          Delete
        </button>
      </div>
    );
  };

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

      {/* Main Content with proper spacing */}
      <div className="flex-1 p-3 md:p-6 overflow-y-auto md:ml-64">
        {view === "records" ? (
          <div
            className={cn(
              "max-w-6xl mx-auto p-3 md:p-6 rounded-xl shadow-md",
              darkMode ? "bg-gray-800" : "bg-white"
            )}
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">Records Management</h1>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-4 md:mb-6">
              <button
                onClick={() => setRecordType("attendance")}
                className={cn(
                  "px-3 md:px-4 py-2 rounded-md font-medium transition-colors text-sm md:text-base",
                  recordType === "attendance"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                )}
              >
                Attendance Records
              </button>
              <button
                onClick={() => setRecordType("apology")}
                className={cn(
                  "px-3 md:px-4 py-2 rounded-md font-medium transition-colors text-sm md:text-base",
                  recordType === "apology"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                )}
              >
                Apology Records
              </button>
            </div>
            
            <RecordsManager recordType={recordType} />
          </div>
        ) : (
        <div
          className={cn(
            "max-w-6xl mx-auto p-3 md:p-6 rounded-xl shadow-md",
            darkMode ? "bg-gray-800" : "bg-white"
          )}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
              <h3 className="text-xs md:text-sm font-semibold text-blue-700 dark:text-blue-300">Total Records</h3>
              <p className="text-lg md:text-xl font-bold text-blue-900 dark:text-blue-100">{attendanceData.length}</p>
            </div>
            <div className="p-3 md:p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg shadow-sm">
              <h3 className="text-xs md:text-sm font-semibold text-green-700 dark:text-green-300">Congregations Present</h3>
              <p className="text-lg md:text-xl font-bold text-green-900 dark:text-green-100">{Object.keys(summary).length}</p>
            </div>
            <div className="p-3 md:p-4 bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-800 rounded-lg shadow-sm">
              <h3 className="text-xs md:text-sm font-semibold text-purple-700 dark:text-purple-300">Total Meetings</h3>
              <p className="text-lg md:text-xl font-bold text-purple-900 dark:text-purple-100">{yearEndData.length}</p>
            </div>
            <div className="p-3 md:p-4 bg-amber-50 dark:bg-orange-900 border border-amber-200 dark:border-orange-800 rounded-lg shadow-sm">
              <h3 className="text-xs md:text-sm font-semibold text-amber-700 dark:text-orange-300">Grand Total Progress</h3>
              <p className="text-lg md:text-xl font-bold text-amber-900 dark:text-orange-100">{getGrandTotalProgress()}%</p>
            </div>
          </div>

          {/* Dynamic Progress Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* Local Congregations Progress */}
            <div className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-200 dark:border-blue-700 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm md:text-base font-semibold text-blue-700 dark:text-blue-300 mb-2">
                    Local Congregations Progress
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Yearly Progress: {getLocalProgress()}%
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Current Year: {new Date().getFullYear()}
                  </p>
                </div>
                <div className="relative w-20 h-20 md:w-24 md:h-24">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path
                      className="text-blue-200 dark:text-blue-700"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Yearly progress circle */}
                    <path
                      className="text-blue-500 dark:text-blue-400"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${getLocalProgress()} 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm md:text-base font-bold text-blue-700 dark:text-blue-300">
                      {getLocalProgress()}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* District Executives Progress */}
            <div className="p-4 md:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border border-green-200 dark:border-green-700 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm md:text-base font-semibold text-green-700 dark:text-green-300 mb-2">
                    District Executives Progress
                  </h3>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Yearly Progress: {getDistrictProgress()}%
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Current Year: {new Date().getFullYear()}
                  </p>
                </div>
                <div className="relative w-20 h-20 md:w-24 md:h-24">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path
                      className="text-green-200 dark:text-green-700"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Yearly progress circle */}
                    <path
                      className="text-green-500 dark:text-green-400"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${getDistrictProgress()} 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm md:text-base font-bold text-green-700 dark:text-green-300">
                      {getDistrictProgress()}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 space-y-3 md:space-y-0">
            <h1 className="text-lg md:text-xl font-bold">Attendance Dashboard</h1>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search congregation..."
              className="w-full md:max-w-xs border px-3 py-2 rounded-md dark:bg-gray-700 dark:text-white text-sm md:text-base"
            />
          </div>

          <div className="overflow-x-auto custom-scrollbar mb-6 md:mb-10">
            <table className="min-w-full border border-gray-300">
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-200"}>
                <tr>
                  <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Meeting</th>
                  <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Congregation</th>
                  <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">
                    Submitted Time(s)
                  </th>
                  <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">
                    Presence Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {yearEndData.map(({ name }) => (
                  <tr key={name}>
                    <td className="border px-2 md:px-4 py-2">
                      {summary[name].map((entry, i) => (
                        <div key={i} className="text-xs md:text-sm font-medium text-blue-600">
                          {entry.meeting_title || "Unknown Meeting"}
                        </div>
                      ))}
                    </td>
                    <td className="border px-2 md:px-4 py-2 text-xs md:text-sm">{name}</td>
                    <td className="border px-2 md:px-4 py-2 space-y-1">
                      {summary[name].map((entry, i) => (
                        <div key={i} className="text-xs md:text-sm">
                          {entry.timestamp}
                        </div>
                      ))}
                    </td>
                    <td className="border px-2 md:px-4 py-2">
                      {renderCircles(summary[name], name)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Monthly Attendance Grid */}
          <div className="my-8 md:my-12">
            <MonthlyAttendanceGrid attendanceData={attendanceData} darkMode={darkMode} />
          </div>

          {/* District Executive Attendance Chart */}
          <div className="my-8 md:my-12">
            <DistrictExecutiveChart attendanceData={attendanceData} darkMode={darkMode} />
          </div>

          {/* Year-End Attendance Chart */}
          <div className="my-8 md:my-12">
            <YearEndChart attendanceData={attendanceData} darkMode={darkMode} />
          </div>
        </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black text-white bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg text-center">
            <p>
              Are you sure you want to delete all records for{" "}
              <strong>{selectedName}</strong>?
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 rounded text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black text-white bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Edit Congregation Name</h2>
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4 dark:bg-gray-700 dark:text-white"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-blue-600 rounded text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Meeting Modal */}
      {showManageMeetingModal && (
        <div className="fixed inset-0 bg-black text-white bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Manage Meeting</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to deactivate the current meeting? This will allow you to set a new meeting with different details.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowManageMeetingModal(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateMeeting}
                className="px-4 py-2 bg-red-600 rounded text-white hover:bg-red-700"
              >
                Deactivate Meeting
              </button>
            </div>
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
