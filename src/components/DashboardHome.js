import React, { useState, useEffect } from "react";
import YearEndChart from "./dashboard/YearEndChart";
import MonthlyAttendanceTrendChart from "./dashboard/MonthlyAttendanceTrendChart";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import AttendanceForm from "./AttendanceForm";
import ApologyForm from "./ApologyForm";
import toast from 'react-hot-toast';
import { capitalizeFirst, toTitleCase } from '../lib/utils';
import PINModal from './PINModal';
import AttendanceChart from "./dashboard/AttendanceChart";
import { useMemo } from 'react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// Helper function to identify apology entries
function isApologyEntry(entry) {
  // This function will be defined in the main component, but we need it here too
  // For now, we'll check if the entry has a reason field which indicates it's an apology
  return entry && entry.reason && entry.reason.length > 0;
}

// Helper functions for progress calculations
function getLocalProgress(attendanceData, year) {
  if (!Array.isArray(attendanceData)) return 0;
  const targetYear = year || new Date().getFullYear();
  const congregationsWithAttendance = new Set();
  attendanceData.forEach(entry => {
    const date = new Date(entry.meeting_date);
    if (date.getFullYear() === targetYear && entry.type !== 'district' && !isApologyEntry(entry)) {
      congregationsWithAttendance.add(entry.congregation);
    }
  });
  const totalCongregations = 9;
  const progress = (congregationsWithAttendance.size / totalCongregations) * 100;
  return Math.round(progress);
}

function getDistrictProgress(attendanceData, year) {
  if (!Array.isArray(attendanceData)) return 0;
  const targetYear = year || new Date().getFullYear();
  const executivesWithAttendance = new Set();
  attendanceData.forEach(entry => {
    const date = new Date(entry.meeting_date);
    if (date.getFullYear() === targetYear && entry.type === 'district' && !isApologyEntry(entry)) {
      executivesWithAttendance.add(entry.position);
    }
  });
  const totalExecutives = 8;
  const progress = (executivesWithAttendance.size / totalExecutives) * 100;
  return Math.round(progress);
}

function getGrandTotalProgress(attendanceData, year) {
  if (!Array.isArray(attendanceData)) return 0;
  const targetYear = year || new Date().getFullYear();
  const localProgress = getLocalProgress(attendanceData, targetYear);
  const districtProgress = getDistrictProgress(attendanceData, targetYear);
  const grandTotal = (localProgress + districtProgress) / 2;
  return Math.round(grandTotal);
}

// Color palette for cards
const cardColors = [
  'bg-blue-50 dark:bg-blue-900',
  'bg-green-50 dark:bg-green-900',
  'bg-yellow-50 dark:bg-yellow-900',
  'bg-purple-50 dark:bg-purple-900',
  'bg-pink-50 dark:bg-pink-900',
  'bg-orange-50 dark:bg-orange-900',
  'bg-teal-50 dark:bg-teal-900',
  'bg-indigo-50 dark:bg-indigo-900',
  'bg-red-50 dark:bg-red-900',
];

// Add capitalizeWords function
function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Function to get unique people with less than 5 meetings (local only)
function getUniquePeopleLessThan5(attendanceData, year) {
  if (!Array.isArray(attendanceData)) return [];
  
  // Use the provided year parameter instead of hardcoded current year
  const targetYear = year || new Date().getFullYear();
  const personCounts = {};
  
  attendanceData.forEach(entry => {
    const date = new Date(entry.meeting_date);
    // Only count entries from the specified year (Jan 1 to Dec 31)
    if (date.getFullYear() === targetYear && entry.type === 'local' && entry.name) {
      personCounts[entry.name] = (personCounts[entry.name] || 0) + 1;
    }
  });
  
  // Filter people who attended less than 5 meetings and sort by count
  return Object.entries(personCounts)
    .filter(([person, count]) => count < 5)
    .sort((a, b) => b[1] - a[1])
    .map(([person]) => person);
}

// Function to get top 3 attendees with 5 or more meetings (local only)
function getTop3Attendees(attendanceData, year) {
  if (!Array.isArray(attendanceData)) return [];
  
  // Use the provided year parameter instead of hardcoded current year
  const targetYear = year || new Date().getFullYear();
  const personCounts = {};
  
  attendanceData.forEach(entry => {
    const date = new Date(entry.meeting_date);
    // Only count entries from the specified year (Jan 1 to Dec 31)
    if (date.getFullYear() === targetYear && entry.type === 'local' && entry.name) {
      personCounts[entry.name] = (personCounts[entry.name] || 0) + 1;
    }
  });
  
  // Filter people who attended 5 or more meetings and sort by count
  return Object.entries(personCounts)
    .filter(([person, count]) => count >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

// Function to get top 3 congregations (local only)
function getTop3Congregations(attendanceData, year) {
  if (!Array.isArray(attendanceData)) return [];
  
  // Use the provided year parameter instead of hardcoded current year
  const targetYear = year || new Date().getFullYear();
  const congregationCounts = {};
  
  attendanceData.forEach(entry => {
    const date = new Date(entry.meeting_date);
    // Only count entries from the specified year (Jan 1 to Dec 31)
    if (date.getFullYear() === targetYear && entry.type === 'local' && entry.congregation) {
      congregationCounts[entry.congregation] = (congregationCounts[entry.congregation] || 0) + 1;
    }
  });
  
  // Sort by count and get top 3
  return Object.entries(congregationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function DashboardHome({
  attendanceData = [],
  apologyData = [],
  darkMode = false,
  currentYear,
  onEdit,
  onDelete,
  refetchAttendanceData,
  refetchApologyData,
}) {
  // Move all hooks to the top
  const [search, setSearch] = useState("");
  const [showType, setShowType] = useState('all'); // 'all' | 'attendance' | 'apology'
  const [editModal, setEditModal] = useState({ open: false, entry: null });
  const [showPINModal, setShowPINModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingEntry, setPendingEntry] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Default to current year
  // Add state for admin credentials modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [pendingUndoApology, setPendingUndoApology] = useState(null);
  const [pendingEditApology, setPendingEditApology] = useState(null);

  // Get unique years from attendance data
  const getUniqueYears = (data) => {
    if (!Array.isArray(data)) return [];
    const years = new Set();
    data.forEach(entry => {
      if (entry.meeting_date) {
        const year = new Date(entry.meeting_date).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
  };

  const availableYears = getUniqueYears(attendanceData);

  // If there are no years, selectedYear should be undefined
  useEffect(() => {
    if (availableYears.length === 0) {
      setSelectedYear(undefined);
    } else if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]); // Default to most recent year with data
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceData]);

  // Combine attendance and apology data for processing
  const combinedData = [...attendanceData, ...apologyData];
  
  // Add a helper function to identify apology entries
  const isApologyEntry = (entry) => {
    // Check if entry has apology-specific fields
    return entry && (entry.reason || entry.type === 'apology' || entry.record_kind === 'apology');
  };
  
  // Filter combined data by selected year
  const filteredData = combinedData.filter(entry => {
    if (!entry.meeting_date) return false;
    
    // Ensure selectedYear has a valid value, default to current year
    const yearToFilter = selectedYear || new Date().getFullYear();
    
    const entryYear = new Date(entry.meeting_date).getFullYear();
    return entryYear === yearToFilter;
  });

  // Debug logging
  useEffect(() => {
    // Debug logging removed for production
  }, [attendanceData, apologyData, combinedData, selectedYear, filteredData]);

  // Add global event listener for data synchronization
  useEffect(() => {
    const handleDataChange = () => {
      if (refetchAttendanceData) {
        refetchAttendanceData();
      }
      if (refetchApologyData) {
        refetchApologyData();
      }
    };

    // Listen for custom events when data changes
    window.addEventListener('attendanceDataChanged', handleDataChange);
    window.addEventListener('apologyDataChanged', handleDataChange);

    return () => {
      window.removeEventListener('attendanceDataChanged', handleDataChange);
      window.removeEventListener('apologyDataChanged', handleDataChange);
    };
  }, [refetchAttendanceData, refetchApologyData]);

  // Update selectedYear when currentYear prop changes
  useEffect(() => {
    if (currentYear && currentYear !== selectedYear) {
      setSelectedYear(currentYear);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear]);

  // Additional safety check
  if (!Array.isArray(attendanceData)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="text-red-600">Error: Invalid data format</div>
      </div>
    );
  }
  
  // Compute summary from filteredData (year-filtered)
  const summary = {};
  // Ensure filteredData is an array before using forEach
  if (Array.isArray(filteredData)) {
    filteredData.forEach((entry) => {
      // Filter by showType
      if (
        showType === 'attendance' && isApologyEntry(entry)
      ) return;
      if (
        showType === 'apology' && !isApologyEntry(entry)
      ) return;
      // Only add to summary if local
      if (entry.type === 'local') {
        if (!summary[entry.congregation]) {
          summary[entry.congregation] = [];
        }
        summary[entry.congregation].push(entry);
      }
    });
  }

  // Compute yearEndData from filteredData (meetings in the selected year, only local)
  const yearEndData = filteredData.filter(entry => {
    return entry.type === 'local';
  });

  // Calculate unique meeting dates for the selected year (local only)
  const uniqueMeetingDates = new Set();
  filteredData.forEach(entry => {
    if (entry.type === 'local') {
      uniqueMeetingDates.add(entry.meeting_date);
    }
  });
  const totalMeetingsCount = uniqueMeetingDates.size;

  // Calculate all congregations present (both local and district) for selected year
  const allCongregations = new Set();
  filteredData.forEach(entry => {
    if (entry.congregation) {
      allCongregations.add(entry.congregation);
    }
  });
  const totalCongregationsCount = allCongregations.size;

  // Show all entries in the table, grouped by congregation
  const filteredSummary = Object.keys(summary)
    .filter((name) => {
      const searchLower = search.toLowerCase();
      // Check congregation name
      if (name.toLowerCase().includes(searchLower)) return true;
      // Check if any attendee name or position matches
      return summary[name].some(entry =>
        (entry.name || "").toLowerCase().includes(searchLower) ||
        (entry.position || "").toLowerCase().includes(searchLower)
      );
    })
    .reduce((acc, name) => {
      acc[name] = summary[name];
      return acc;
    }, {});

  // Group summary by congregation, then by month, then by day
  const groupedSummary = {};
  if (Array.isArray(filteredData)) {
    filteredData.forEach((entry) => {
      // Filter by showType
      if (showType === 'attendance' && isApologyEntry(entry)) return;
      if (showType === 'apology' && !isApologyEntry(entry)) return;
      // Only add to summary if local
      if (entry.type === 'local') {
        const cong = entry.congregation;
        const dateObj = new Date(entry.meeting_date);
        const monthKey = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        const dayKey = dateObj.toLocaleDateString();
        if (!groupedSummary[cong]) groupedSummary[cong] = {};
        if (!groupedSummary[cong][monthKey]) groupedSummary[cong][monthKey] = {};
        if (!groupedSummary[cong][monthKey][dayKey]) groupedSummary[cong][monthKey][dayKey] = [];
        groupedSummary[cong][monthKey][dayKey].push(entry);
      }
    });
  }

  // Handler for deleting an entry (custom confirmation)
  const handleDelete = (entryId) => {
    // Find the entry object from the combined data
    const entry = [...attendanceData, ...apologyData].find(e => e.id === entryId);
    if (entry) {
      setPendingAction('delete');
      setPendingEntry(entry);
      setShowPINModal(true);
    } else {
      toast.error('Entry not found');
    }
  };

  const handleDeleteWithPIN = async (entry, pin) => {
    const isApology = isApologyEntry(entry);
    // Use hard delete endpoint
    const endpoint = isApology 
      ? `${API_URL}/api/delete-apology/${entry.id}?pin=${encodeURIComponent(pin)}`
      : `${API_URL}/api/delete-attendance/${entry.id}?pin=${encodeURIComponent(pin)}`;
    toast.custom((t) => (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-red-400 max-w-xs mx-auto flex flex-col items-center">
        <div className="text-lg font-bold text-red-600 mb-2">Confirm Delete</div>
        <div className="text-gray-700 dark:text-gray-200 mb-4">Are you sure you want to delete this entry?</div>
        <div className="flex gap-3">
          <button
            className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const token = localStorage.getItem('access_token');
                const res = await fetch(endpoint, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : undefined,
                  }
                });
                if (res.ok) {
                  toast.success('Entry deleted successfully');
                  if (refetchAttendanceData) refetchAttendanceData();
                  if (refetchApologyData) refetchApologyData();
                  window.dispatchEvent(new CustomEvent('attendanceDataChanged'));
                  window.dispatchEvent(new CustomEvent('apologyDataChanged'));
                } else {
                  const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                  toast.error(`Failed to delete entry: ${errorData.error || res.statusText}`);
                }
              } catch (err) {
                toast.error('Network error');
              }
            }}
          >Yes, Delete</button>
          <button
            className="bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400"
            onClick={() => toast.dismiss(t.id)}
          >Cancel</button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  // Handler for editing an entry (show modal)
  const handleEdit = (entryId) => {
    // Find the entry object from the combined data
    const entry = [...attendanceData, ...apologyData].find(e => e.id === entryId);
    if (entry) {
      setPendingAction('edit');
      setPendingEntry(entry);
      setShowPINModal(true);
    } else {
      toast.error('Entry not found');
    }
  };

  const handleEditWithPIN = async (entry, pin) => {
    if (entry) {
      setEditModal({ open: true, entry: { ...entry, pin } });
    } else {
      toast.error('Entry not found');
    }
  };

  // PIN success handler
  const handlePINSuccess = (pin) => {
    if (pendingAction === 'edit' && pendingEntry) {
      handleEditWithPIN(pendingEntry, pin);
    } else if (pendingAction === 'delete' && pendingEntry) {
      handleDeleteWithPIN(pendingEntry, pin);
    } else if (pendingAction === 'clear_all') {
      handleClearAllDataWithPIN(pin);
    }
    setPendingAction(null);
    setPendingEntry(null);
    setShowPINModal(false); // Close the PIN modal
  };

  // Handler for saving edit
  const handleSaveEdit = async (updatedEntry) => {
    // Always submit edit directly with PIN, no admin modal
    const isApology = isApologyEntry(updatedEntry);
    const endpoint = isApology 
      ? `${API_URL}/api/edit-apology/${updatedEntry.id}`
      : `${API_URL}/api/edit-attendance/${updatedEntry.id}`;
    const token = localStorage.getItem('access_token');
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      body: JSON.stringify({
        ...updatedEntry,
        pin: updatedEntry.pin
      }),
    });
    if (res.ok) {
      toast.success('Entry updated successfully');
      setEditModal({ open: false, entry: null });
      if (refetchAttendanceData) refetchAttendanceData();
      if (refetchApologyData) refetchApologyData();
      window.dispatchEvent(new CustomEvent('attendanceDataChanged'));
    } else {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      toast.error(`Failed to update entry: ${errorData.error || res.statusText}`);
    }
  };

  // Add clear all data function
  const handleClearAllData = () => {
    setPendingAction('clear_all');
    setShowPINModal(true);
  };

  const handleClearAllDataWithPIN = async (pin) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/api/clear-all-data`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success('All data cleared successfully');
        if (refetchAttendanceData) refetchAttendanceData();
        if (refetchApologyData) refetchApologyData();
      } else {
        const errorData = await res.text();
        toast.error(`Failed to clear data: ${errorData}`);
      }
    } catch (err) {
      console.error('Error in clear all data:', err);
      toast.error('Failed to clear data');
    }
  };

  const isMobile = useIsMobile();

  const congregationColors = {
    "Emmanuel Congregation Ahinsan": "bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700",
    "Peniel Congregation Esreso No 1": "bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700",
    "Favour Congregation Esreso No 2": "bg-yellow-100 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700",
    "Christ Congregation Ahinsan Estate": "bg-purple-100 border-purple-300 dark:bg-purple-900 dark:border-purple-700",
    "Ebenezer Congregation Aprabo": "bg-pink-100 border-pink-300 dark:bg-pink-900 dark:border-pink-700",
    "Mizpah Congregation Odagya No 1": "bg-orange-100 border-orange-300 dark:bg-orange-900 dark:border-orange-700",
    "Odagya No 2": "bg-teal-100 border-teal-300 dark:bg-teal-900 dark:border-teal-700",
    "Liberty Congregation High Tension": "bg-red-100 border-red-300 dark:bg-red-900 dark:border-red-700",
    "NOM": "bg-gray-100 border-gray-300 dark:bg-gray-900 dark:border-gray-700"
  };

  // Progress calculations for cards
  const localProgress = useMemo(() => getLocalProgress(attendanceData, selectedYear), [attendanceData, selectedYear]);
  const districtProgress = useMemo(() => getDistrictProgress(attendanceData, selectedYear), [attendanceData, selectedYear]);
  const progressCardClass = "flex flex-col justify-between items-center p-4 rounded-xl shadow-md min-w-[220px] max-w-xs w-full";
  const circleStyle = (percent, color) => ({
    background: `conic-gradient(${color} ${percent * 3.6}deg, #e5e7eb 0deg)`
  });

  return (
    <div>
      {/* Progress Cards - horizontally scrollable on mobile, side-by-side on desktop */}
      <div className="flex gap-4 mb-6 mt-2 items-center overflow-x-auto custom-scrollbar snap-x snap-mandatory pl-8 pr-4">
        <div className={progressCardClass + " bg-blue-700 text-white min-w-[260px] snap-start"}>
          <div className="font-semibold text-lg mb-2">Local Congregations Progress</div>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle
                  cx="32" cy="32" r="28"
                  stroke="url(#blueGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - localProgress / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(.4,2,.3,1)' }}
                />
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute text-xl font-bold">{localProgress}%</span>
            </div>
            <div className="flex flex-col text-sm">
              <span>Yearly Progress: {localProgress}%</span>
              <span>Current Year: {selectedYear || new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
        <div className={progressCardClass + " bg-green-700 text-white min-w-[260px] snap-center"}>
          <div className="font-semibold text-lg mb-2">District Executives Progress</div>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle
                  cx="32" cy="32" r="28"
                  stroke="url(#greenGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - districtProgress / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(.4,2,.3,1)' }}
                />
                <defs>
                  <linearGradient id="greenGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#10b981" />
                    <stop offset="1" stopColor="#6ee7b7" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute text-xl font-bold">{districtProgress}%</span>
            </div>
            <div className="flex flex-col text-sm">
              <span>Yearly Progress: {districtProgress}%</span>
              <span>Current Year: {selectedYear || new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Original Four Summary Cards */}
      <div className="overflow-x-auto md:overflow-x-visible custom-scrollbar">
        <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6 min-w-max md:min-w-0">
          <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
            <h3 className="text-xs md:text-sm font-semibold text-blue-700 dark:text-blue-300">Total Records</h3>
            <p className="text-lg md:text-xl font-bold text-blue-900 dark:text-blue-100">{filteredData.length}</p>
          </div>
          <div className="p-3 md:p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg shadow-sm">
            <h3 className="text-xs md:text-sm font-semibold text-green-700 dark:text-green-300">Congregations Present</h3>
            <p className="text-lg md:text-xl font-bold text-green-900 dark:text-green-100">{totalCongregationsCount}</p>
          </div>
          <div className="p-3 md:p-4 bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-800 rounded-lg shadow-sm">
            <h3 className="text-xs md:text-sm font-semibold text-purple-700 dark:text-purple-300">Total Meetings</h3>
            <p className="text-lg md:text-xl font-bold text-purple-900 dark:text-purple-100">{totalMeetingsCount}</p>
          </div>
          <div className="p-3 md:p-4 bg-amber-50 dark:bg-orange-900 border border-amber-200 dark:border-amber-800 rounded-lg shadow-sm">
            <h3 className="text-xs md:text-sm font-semibold text-amber-700 dark:text-orange-300">Grand Total Progress</h3>
            <p className="text-lg md:text-xl font-bold text-amber-900 dark:text-orange-100">{getGrandTotalProgress(filteredData, selectedYear)}%</p>
          </div>
        </div>
      </div>
      {/* Three Stat Cards (Total Congregations, Top Attendees, Unique People) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Total Congregations</p>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
            {getTop3Congregations(filteredData.filter(entry => !isApologyEntry(entry)), selectedYear).length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg border border-green-200 dark:border-green-700">
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">Top Attendees (5+)</p>
          <p className="text-lg font-bold text-green-900 dark:text-green-100">
            {getTop3Attendees(filteredData.filter(entry => !isApologyEntry(entry)), selectedYear).length}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Unique People (&lt;5)</p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {getUniquePeopleLessThan5(filteredData.filter(entry => !isApologyEntry(entry)), selectedYear).length}
          </p>
        </div>
      </div>
      {/* Search Bar and Attendance/Apology Buttons */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 space-y-3 md:space-y-0">
        <h1 className="text-lg md:text-xl font-bold">All Attendance & Apologies</h1>
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search congregation..."
            className="w-full md:max-w-xs border px-3 py-2 rounded-md dark:bg-gray-700 dark:text-white text-sm md:text-base"
          />
        </div>
      </div>
      {/* Attendance/Apology/All Buttons and Clear All Data */}
      <div className="flex flex-wrap gap-2 md:gap-4 mb-4 items-center">
        <div className="flex flex-wrap gap-2 md:gap-4">
          <button
            className={`px-4 py-2 rounded ${showType === 'attendance' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            onClick={() => setShowType('attendance')}
          >Attendance</button>
          <button
            className={`px-4 py-2 rounded ${showType === 'apology' ? 'bg-purple-700 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
            onClick={() => setShowType('apology')}
          >Apology</button>
          <button
            className={`px-4 py-2 rounded ${showType === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-400 text-white hover:bg-gray-700'}`}
            onClick={() => setShowType('all')}
          >All</button>
        </div>
        <div className="w-full h-0" /> {/* Force new row on mobile */}
      </div>

      {/* Table of All Attendance/Apology Records */}
      <div className="overflow-x-auto custom-scrollbar mb-6 md:mb-10 max-w-full">
        {groupedSummary && typeof groupedSummary === 'object' && Object.keys(groupedSummary).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              No {showType === 'all' ? 'attendance or apology' : showType} data available
            </div>
            <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              {showType === 'all' 
                ? 'No attendance or apology records found for the current filters.'
                : `No ${showType} records found for the current filters.`
              }
            </div>
          </div>
        ) : (
          groupedSummary && typeof groupedSummary === 'object' &&
          Object.keys(groupedSummary).map((cong, idx) => (
            <div key={cong} className={`w-full max-w-full mb-6 rounded-xl shadow border p-2 md:p-4 ${congregationColors[cong] || 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
              <h3 className="text-lg font-bold mb-2">{cong}</h3>
              {groupedSummary[cong] && typeof groupedSummary[cong] === 'object' &&
                Object.keys(groupedSummary[cong]).map(month => (
                  <div key={month} className="mb-4">
                    <h4 className="text-base font-semibold text-blue-700 dark:text-blue-300 mb-1">{month}</h4>
                    {groupedSummary[cong][month] && typeof groupedSummary[cong][month] === 'object' &&
                      Object.keys(groupedSummary[cong][month]).map(day => (
                        <div key={day} className="mb-2 pl-2 border-l-2 border-blue-300 dark:border-blue-600">
                          <div className="font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">{day}</div>
                          <div className="overflow-x-auto w-full">
                            <table className="min-w-max w-full text-gray-900 dark:text-gray-100 mb-2 border-collapse">
                              <thead className={darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-900"}>
                                <tr>
                                  <th className="text-center px-2 md:px-4 py-2 border-r border-gray-300 text-xs md:text-sm">Meeting</th>
                                  <th className="text-center px-2 md:px-4 py-2 border-r border-gray-300 text-xs md:text-sm">Attendee(s)</th>
                                  <th className="text-left px-2 md:px-4 py-2 border-r border-gray-300 text-xs md:text-sm">Submitted Time</th>
                                  <th className="text-left px-2 md:px-4 py-2 border-r border-gray-300 text-xs md:text-sm">Status</th>
                                  <th className="text-left px-2 md:px-4 py-2 border-r border-gray-300 text-xs md:text-sm">Reason</th>
                                  <th className="text-center px-2 md:px-4 py-2 text-xs md:text-sm">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Array.isArray(groupedSummary[cong][month][day]) &&
                                  groupedSummary[cong][month][day].map((entry, i) => (
                                    <tr key={entry.id || i} className="text-sm md:text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                      <td className="border px-2 md:px-4 py-2 text-xs md:text-sm border-r border-gray-300 text-center">
                                        <div className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-200">
                                          {entry.meeting_title || "Unknown Meeting"}
                                        </div>
                                      </td>
                                      <td className="border px-2 md:px-4 py-2 text-xs md:text-sm border-r border-gray-300 text-center">
                                        <span className="font-semibold">{entry.name}</span>
                                        <span> ({entry.position})</span>
                                      </td>
                                      <td className="border px-2 md:px-4 py-2 space-y-1 border-r border-gray-300 text-center">
                                        <div className="text-xs md:text-sm">{entry.timestamp}</div>
                                      </td>
                                      <td className="border px-2 md:px-4 py-2 border-r border-gray-300 text-center">
                                        <div className="flex items-center gap-2 mb-1 justify-center">
                                          <span className="text-lg">
                                            {isApologyEntry(entry) ? (
                                              <FaTimesCircle className="text-red-500" />
                                            ) : (
                                              <FaCheckCircle className="text-green-500" />
                                            )}
                                          </span>
                                        </div>
                                      </td>
                                      {isApologyEntry(entry) ? (
                                        <td className="border px-2 md:px-4 py-2 text-xs md:text-sm border-r border-gray-300 text-center">
                                          {entry.reason || 'No reason provided'}
                                        </td>
                                      ) : (
                                        <td className="border px-2 md:px-4 py-2 text-xs md:text-sm border-r border-gray-300 text-center">
                                          <span className="text-gray-400">-</span>
                                        </td>
                                      )}
                                      <td className="border px-2 md:px-4 py-2 text-center">
                                        <div className="flex gap-2 justify-center">
                                          <button 
                                            onClick={() => handleEdit(entry.id)} 
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                          >
                                            Edit
                                          </button>
                                          <button 
                                            onClick={() => handleDelete(entry.id)} 
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          ))
        )}
      </div>
      <div>
        <button
          onClick={handleClearAllData}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-semibold mt-2 md:mt-0 md:ml-8"
          title="Clear all attendance and apology data"
        >
          🗑️ Clear All Data
        </button>
      </div>
      {/* Year-End Attendance Chart */}
      <div className="my-8 md:my-12">
        <YearEndChart 
          attendanceData={filteredData.filter(entry => !isApologyEntry(entry))} 
          darkMode={darkMode} 
        />
      </div>

      {/* Top Congregations and Attendees */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Top 3 Congregations */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-3">Top 3 Congregations</h3>
            {getTop3Congregations(filteredData.filter(entry => !isApologyEntry(entry)), selectedYear).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No data available</p>
            ) : (
              <div className="space-y-2">
                {getTop3Congregations(filteredData.filter(entry => !isApologyEntry(entry)), selectedYear).map(([congregation, count], idx) => (
                  <div key={congregation} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {idx + 1}. {congregation}
                    </span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top 3 Attendees (5+ meetings) */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-3">Top 3 Attendees (5+ meetings)</h3>
            {getTop3Attendees(filteredData.filter(entry => !isApologyEntry(entry)), selectedYear).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No data available</p>
            ) : (
              <div className="space-y-2">
                {getTop3Attendees(filteredData.filter(entry => !isApologyEntry(entry)), selectedYear).map(([person, count], idx) => (
                  <div key={person} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {idx + 1}. {person}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-bold">
                      {count} meetings
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unique People (less than 5 meetings) */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-3">Unique People (&lt;5 meetings)</h3>
            {getUniquePeopleLessThan5(filteredData.filter(entry => !isApologyEntry(entry)), selectedYear).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No data available</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getUniquePeopleLessThan5(filteredData.filter(entry => !isApologyEntry(entry)), selectedYear).map((person, idx) => (
                  <div key={person} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {idx + 1}. {person}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Total Congregations</p>
            <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {getTop3Congregations(filteredData.filter(entry => !isApologyEntry(entry)), selectedYear).length}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg border border-green-200 dark:border-green-700">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">Top Attendees (5+)</p>
            <p className="text-lg font-bold text-green-900 dark:text-green-100">
              {getTop3Attendees(filteredData.filter(entry => !isApologyEntry(entry)), selectedYear).length}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Unique People (&lt;5)</p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {getUniquePeopleLessThan5(filteredData.filter(entry => !isApologyEntry(entry)), selectedYear).length}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Attendance Trend Chart */}
      <MonthlyAttendanceTrendChart
        attendanceData={filteredData.filter(entry => !isApologyEntry(entry))}
        darkMode={darkMode}
      />

      {/* Monthly Attendance Chart */}
      <div className="my-8 md:my-12">
        <AttendanceChart 
          attendanceData={filteredData.filter(entry => !isApologyEntry(entry))} 
          darkMode={darkMode} 
        />
      </div>

      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-blue-700">Edit Entry</h3>
            <form onSubmit={e => { e.preventDefault(); handleSaveEdit(editModal.entry); }} className="space-y-3">
              <label className="block text-sm font-medium">Name
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={editModal.entry.name}
                  onChange={e => setEditModal(m => ({ ...m, entry: { ...m.entry, name: capitalizeWords(e.target.value) } }))}
                  required
                />
              </label>
              <label className="block text-sm font-medium">Phone
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={editModal.entry.phone}
                  onChange={e => setEditModal(m => ({ ...m, entry: { ...m.entry, phone: capitalizeWords(e.target.value) } }))}
                  // Phone is optional for both attendance and apology
                />
              </label>
              <label className="block text-sm font-medium">Congregation
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={editModal.entry.congregation}
                  onChange={e => setEditModal(m => ({ ...m, entry: { ...m.entry, congregation: capitalizeWords(e.target.value) } }))}
                  required
                />
              </label>
              <label className="block text-sm font-medium">Position
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={editModal.entry.position}
                  onChange={e => setEditModal(m => ({ ...m, entry: { ...m.entry, position: capitalizeWords(e.target.value) } }))}
                  required
                />
              </label>
              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500"
                  onClick={() => setEditModal({ open: false, entry: null })}
                >Cancel</button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                >Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      <PINModal
        isOpen={showPINModal}
        onClose={() => {
          setShowPINModal(false);
          setPendingAction(null);
          setPendingEntry(null);
        }}
        onSuccess={handlePINSuccess}
        title={pendingAction === 'edit' ? 'Enter PIN to Edit' : pendingAction === 'delete' ? 'Enter PIN to Delete' : 'Enter PIN to Clear All Data'}
        message={pendingAction === 'edit' ? 'Please enter the 4-digit PIN to edit this record' : pendingAction === 'delete' ? 'Please enter the 4-digit PIN to delete this record' : 'Please enter the 4-digit PIN to clear all data'}
      />

      {/* Admin Credentials Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-xs">
            <h3 className="font-bold mb-2 text-center">Admin Credentials Required</h3>
            <input type="text" className="w-full mb-2 p-2 rounded border" placeholder="Admin Username" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} />
            <input type="password" className="w-full mb-4 p-2 rounded border" placeholder="Admin Password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={async () => {
                if (pendingUndoApology) {
                  // Restore apology
                  const res = await fetch(`${API_URL}/api/submit-apologies`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      apologies: [pendingUndoApology],
                      admin_username: adminUsername,
                      admin_password: adminPassword
                    })
                  });
                  if (res.ok) {
                    setShowAdminModal(false);
                    setPendingUndoApology(null);
                    setAdminUsername('');
                    setAdminPassword('');
                    if (refetchApologyData) refetchApologyData();
                    window.dispatchEvent(new CustomEvent('apologyDataChanged'));
                    toast.success('Apology restored!');
                  } else {
                    toast.error('Failed to restore apology');
                  }
                } else if (pendingEditApology) {
                  // Edit apology
                  const res = await fetch(`${API_URL}/api/edit-apology/${pendingEditApology.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      ...pendingEditApology,
                      pin: pendingEditApology.pin
                    })
                  });
                  if (res.ok) {
                    setShowAdminModal(false);
                    setPendingEditApology(null);
                    setAdminUsername('');
                    setAdminPassword('');
                    if (refetchApologyData) refetchApologyData();
                    window.dispatchEvent(new CustomEvent('apologyDataChanged'));
                    toast.success('Apology updated!');
                  } else {
                    toast.error('Failed to update apology');
                  }
                }
              }}>
                Submit
              </button>
              <button className="bg-gray-400 text-white px-4 py-1 rounded" onClick={() => {
                setShowAdminModal(false);
                setPendingUndoApology(null);
                setPendingEditApology(null);
                setAdminUsername('');
                setAdminPassword('');
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 