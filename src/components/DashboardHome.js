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
  const [lastDeleted, setLastDeleted] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Default to current year

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
    // Check if the entry exists in the apologyData array by ID
    return apologyData.some(apology => apology.id === entry.id);
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

  // Check for pending undo on component mount
  useEffect(() => {
    const pendingUndo = localStorage.getItem('pendingUndo');
    if (pendingUndo) {
      try {
        const undoData = JSON.parse(pendingUndo);
        if (undoData.component === 'home') {
          setLastDeleted(undoData.record);
        }
      } catch (err) {
        localStorage.removeItem('pendingUndo');
      }
    }
  }, []);

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

  // Handler for deleting an entry (custom confirmation)
  const handleDelete = (entryId) => {
    setPendingAction('delete');
    setPendingEntry(entryId);
    setShowPINModal(true);
  };

  const handleDeleteWithPIN = (entryId) => {
    const deletedRecord = attendanceData.find(e => e.id === entryId);
    
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
                const res = await fetch(`${API_URL}/api/delete-attendance/${entryId}`, {
                  method: 'DELETE',
                  credentials: 'include',
                });
                
                if (res.ok) {
                  setLastDeleted(deletedRecord);
                  // Store in localStorage for persistence across re-renders
                  localStorage.setItem('lastDeletedRecord', JSON.stringify(deletedRecord));
                  // Clear pending states AFTER setting lastDeleted
                  setTimeout(() => {
                    setPendingEntry(null);
                    setPendingAction(null);
                  }, 100);
                  // Show undo toast with proper implementation
                  toast.custom((undoToast) => (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-blue-400 max-w-xs mx-auto flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-200">Entry deleted</span>
                      <button 
                        className="ml-3 text-blue-600 hover:text-blue-800 underline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUndo();
                          toast.dismiss(undoToast.id);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        Undo
                      </button>
                    </div>
                  ), { duration: 5000 });
                  if (refetchAttendanceData) refetchAttendanceData();
                  window.dispatchEvent(new CustomEvent('attendanceDataChanged'));
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

  // Add handleUndo function
  const handleUndo = async () => {
    let deletedRecord = lastDeleted;
    if (!deletedRecord) {
      const storedRecord = localStorage.getItem('lastDeletedRecord');
      if (storedRecord) {
        deletedRecord = JSON.parse(storedRecord);
      }
    }
    
    if (!deletedRecord) {
      return;
    }
    
    try {
      const attendanceData = {
        name: deletedRecord.name,
        phone: deletedRecord.phone || '',
        congregation: deletedRecord.congregation,
        type: deletedRecord.type || 'local',
        position: deletedRecord.position,
        meeting_date: deletedRecord.meeting_date,
        timestamp: deletedRecord.timestamp
      };
      
      const res = await fetch(`${API_URL}/api/submit-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify([attendanceData]),
      });
      
      if (res.ok) {
        setLastDeleted(null);
        // Clear localStorage after successful restore
        localStorage.removeItem('lastDeletedRecord');
        if (refetchAttendanceData) refetchAttendanceData();
        window.dispatchEvent(new CustomEvent('attendanceDataChanged'));
        toast.success('Entry restored successfully');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Failed to restore entry: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      toast.error('Failed to restore entry');
    }
  };

  // Handler for editing an entry (show modal)
  const handleEdit = (entryId) => {
    setPendingAction('edit');
    setPendingEntry(entryId);
    setShowPINModal(true);
  };

  const handleEditWithPIN = (entryId) => {
    let entry = attendanceData.find(e => e.id === entryId);
    if (!entry) {
      entry = apologyData.find(e => e.id === entryId);
    }
    if (entry) {
      setEditModal({ open: true, entry });
    } else {
      toast('Edit functionality not implemented yet');
    }
  };

  // PIN success handler
  const handlePINSuccess = () => {
    if (pendingAction === 'edit' && pendingEntry) {
      handleEditWithPIN(pendingEntry);
    } else if (pendingAction === 'delete' && pendingEntry) {
      handleDeleteWithPIN(pendingEntry);
    } else if (pendingAction === 'clear_all') {
      // Get PIN from PINModal and proceed with clear all
      const pinInput = document.querySelector('input[type="password"]');
      if (pinInput) {
        handleClearAllDataWithPIN(pinInput.value);
      }
    }
    setPendingAction(null);
    setPendingEntry(null);
  };

  // Handler for saving edit
  const handleSaveEdit = async (updatedEntry) => {
    try {
      // Determine if this is an apology or attendance record
      const isApology = apologyData.some(e => e.id === updatedEntry.id);
      const endpoint = isApology 
        ? `${API_URL}/api/edit-apology/${updatedEntry.id}`
        : `${API_URL}/api/edit-attendance/${updatedEntry.id}`;
      
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedEntry),
      });
      
      if (res.ok) {
        toast.success('Entry updated successfully');
        setEditModal({ open: false, entry: null });
        if (refetchAttendanceData) refetchAttendanceData();
        if (refetchApologyData) refetchApologyData();
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('attendanceDataChanged'));
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Failed to update entry: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      toast.error('Network error - please check your connection');
    }
  };

  // Add clear all data function
  const handleClearAllData = () => {
    setPendingAction('clear_all');
    setShowPINModal(true);
  };

  const handleClearAllDataWithPIN = async (pin) => {
    try {
      const res = await fetch(`${API_URL}/api/clear-all-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  return (
    <div>
      
      {/* Dashboard Summary Cards */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
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
          <div className="p-3 md:p-4 bg-amber-50 dark:bg-orange-900 border border-amber-200 dark:border-orange-800 rounded-lg shadow-sm">
            <h3 className="text-xs md:text-sm font-semibold text-amber-700 dark:text-orange-300">Grand Total Progress</h3>
            <p className="text-lg md:text-xl font-bold text-amber-900 dark:text-orange-100">{getGrandTotalProgress(filteredData, selectedYear)}%</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-200 dark:border-blue-700 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm md:text-base font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  Local Congregations Progress
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Yearly Progress: {getLocalProgress(filteredData, selectedYear)}%
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Year: {selectedYear}
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
                    strokeDasharray={`${getLocalProgress(filteredData, selectedYear)} 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm md:text-base font-bold text-blue-700 dark:text-blue-300">
                    {getLocalProgress(filteredData, selectedYear)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border border-green-200 dark:border-green-700 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm md:text-base font-semibold text-green-700 dark:text-green-300 mb-2">
                  District Executives Progress
                </h3>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Yearly Progress: {getDistrictProgress(filteredData, selectedYear)}%
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Year: {selectedYear}
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
                    strokeDasharray={`${getDistrictProgress(filteredData, selectedYear)} 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm md:text-base font-bold text-green-700 dark:text-green-300">
                    {getDistrictProgress(filteredData, selectedYear)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Performance Categories Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(() => {
          // Calculate attendance rate per congregation for the specified year
          const targetYear = selectedYear || new Date().getFullYear();
          const congregationAttendance = {};
          filteredData.forEach(entry => {
            const date = new Date(entry.meeting_date);
            if (date.getFullYear() === targetYear && entry.type !== 'district') {
              if (!congregationAttendance[entry.congregation]) {
                congregationAttendance[entry.congregation] = 0;
              }
              congregationAttendance[entry.congregation] += 1;
            }
          });
          // Assume 2 meetings per month, 12 months
          const totalPossible = 2 * 12;
          const categories = { excellent: 0, good: 0, needsImprovement: 0 };
          Object.values(congregationAttendance).forEach(count => {
            const rate = (count / totalPossible) * 100;
            if (rate >= 90) categories.excellent += 1;
            else if (rate >= 70) categories.good += 1;
            else categories.needsImprovement += 1;
          });
          return (
            <>
              <div className="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-xl shadow-sm flex flex-col items-center">
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">{categories.excellent}</span>
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">Excellent (90%+)</span>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-xl shadow-sm flex flex-col items-center">
                <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{categories.good}</span>
                <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Good (70-89%)</span>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-xl shadow-sm flex flex-col items-center">
                <span className="text-2xl font-bold text-red-700 dark:text-red-300">{categories.needsImprovement}</span>
                <span className="text-sm font-semibold text-red-700 dark:text-red-300">Needs Improvement (&lt; 69%)</span>
              </div>
            </>
          );
        })()}
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
          <button
            onClick={handleClearAllData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-semibold"
            title="Clear all attendance and apology data"
          >
            🗑️ Clear All Data
          </button>
        </div>
      </div>
      <div className="flex gap-4 mb-4">
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

      {/* Table of All Attendance/Apology Records */}
      <div className="overflow-x-auto custom-scrollbar mb-6 md:mb-10">
        {Object.keys(filteredSummary).length === 0 ? (
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
          Object.keys(filteredSummary)
            .map((name, idx) => (
              <div
                key={name}
                className={`w-full max-w-full mb-6 rounded-xl shadow border border-blue-200 dark:border-blue-700 ${cardColors[idx % cardColors.length]} p-2 md:p-4`}
              >
                <table className="min-w-full text-gray-900 dark:text-gray-100">
                  <thead className={darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-900"}>
                    <tr>
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm min-w-[200px] whitespace-nowrap">Meeting</th>
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Attendee(s)</th>
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Congregation</th>
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Submitted Time(s)</th>
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Presence Status</th>
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Reason</th>
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr key={name} className="text-sm md:text-base">
                      <td className="border px-2 md:px-4 py-2 text-xs md:text-sm min-w-[200px] whitespace-nowrap">
                        <div className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-200">
                          {filteredSummary[name][0]?.meeting_title || "Unknown Meeting"}
                        </div>
                      </td>
                      <td className="border px-2 md:px-4 py-2 text-xs md:text-sm">
                        {filteredSummary[name].map((entry, i) => (
                          <div key={i}>
                            <span className="font-semibold">{entry.name}</span>
                            <span> ({entry.position})</span>
                          </div>
                        ))}
                      </td>
                      <td className="border px-2 md:px-4 py-2 text-xs md:text-sm">{name}</td>
                      <td className="border px-2 md:px-4 py-2 space-y-1">
                        {filteredSummary[name].map((entry, i) => (
                          <div key={i} className="text-xs md:text-sm">
                            {entry.timestamp}
                          </div>
                        ))}
                      </td>
                      <td className="border px-2 md:px-4 py-2">
                        {filteredSummary[name].map((entry, i) => (
                          <div key={i} className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {isApologyEntry(entry) ? (
                                <FaTimesCircle className="text-red-500" />
                              ) : (
                                <FaCheckCircle className="text-green-500" />
                              )}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td className="border px-2 md:px-4 py-2 text-xs md:text-sm">
                        {filteredSummary[name].map((entry, i) => (
                          <div key={i} className="text-xs md:text-sm">
                            {isApologyEntry(entry) ? (entry.reason || 'No reason provided') : ''}
                          </div>
                        ))}
                      </td>
                      <td className="border px-2 md:px-4 py-2">
                        {filteredSummary[name].map((entry, i) => (
                          <div key={entry.id} className="flex gap-2 mb-1">
                            <button
                              className="text-blue-500 hover:underline text-xs"
                              onClick={() => handleEdit(entry.id)}
                            >Edit</button>
                            <button
                              className="text-red-500 hover:underline text-xs"
                              onClick={() => handleDelete(entry.id)}
                            >Delete</button>
                          </div>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))
        )}
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
                  required
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
    </div>
  );
} 