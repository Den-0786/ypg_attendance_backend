import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import DistrictExecutiveChart from "./dashboard/DistrictExecutiveChart";
import { toast } from "react-hot-toast";
import { capitalizeFirst } from '../lib/utils';
import PINModal from './PINModal';

// Add capitalizeWords function
function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function DashboardDistrict({
  attendanceData = [],
  apologyData = [],
  darkMode = false,
  onEdit,
  onDelete,
  refetchAttendanceData,
  refetchApologyData,
}) {
  const [search, setSearch] = useState("");
  const [showType, setShowType] = useState('all'); // 'all' | 'attendance' | 'apology'
  const [editModal, setEditModal] = useState({ open: false, entry: null });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // PIN verification state
  const [showPINModal, setShowPINModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingEntry, setPendingEntry] = useState(null);

  // Add state for admin credentials modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [pendingEditApology, setPendingEditApology] = useState(null);

  // Get unique years from attendance data
  const getUniqueYears = (data) => {
    if (!Array.isArray(data)) return [];
    const years = new Set();
    const currentYear = new Date().getFullYear();
    
    // Always include current year
    years.add(currentYear);
    
    // Add years from attendance data, but only current year and future years
    data.forEach(entry => {
      if (entry.meeting_date) {
        const year = new Date(entry.meeting_date).getFullYear();
        // Only include current year and future years, exclude 2024 and earlier
        if (year >= currentYear) {
          years.add(year);
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
  };

  const availableYears = Array.isArray(getUniqueYears(attendanceData)) ? getUniqueYears(attendanceData) : [];

  // If there are no years, selectedYear should be undefined
  useEffect(() => {
    if (availableYears.length === 0) {
      setSelectedYear(undefined);
    } else if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]); // Default to most recent year with data
    }
  }, [attendanceData]);

  // Filter attendance data by selected year
  const filteredAttendanceData = attendanceData.filter(entry => {
    if (!entry.meeting_date || !selectedYear) return false;
    const entryYear = new Date(entry.meeting_date).getFullYear();
    return entryYear === selectedYear;
  });

  // Add a helper to determine if a record is an apology
  const isApologyEntry = (entry) => {
    // Check if entry has apology-specific fields
    return entry && (entry.reason || entry.type === 'apology' || entry.record_kind === 'apology');
  };

  // Combine attendance and apology data for processing
  const combinedData = [...attendanceData, ...apologyData];
  
  // Filter combined data by selected year
  const filteredData = combinedData.filter(entry => {
    if (!entry.meeting_date || !selectedYear) return false;
    const entryYear = new Date(entry.meeting_date).getFullYear();
    return entryYear === selectedYear;
  });

  // Remove all undo/restore logic and UI
  // 1. Remove handleUndo function
  // 2. Remove lastDeleted state and any references
  // 3. Remove localStorage.setItem('pendingUndo', ...) and related code
  // 4. Remove Undo button from toasts

  // Filter only district executive entries, and filter by showType
  const summary = {};
  filteredData.forEach((entry) => {
    if (showType === 'attendance' && isApologyEntry(entry)) return;
    if (showType === 'apology' && !isApologyEntry(entry)) return;
    if (entry.type === "district") {
      if (!summary[entry.congregation]) {
        summary[entry.congregation] = [];
      }
      summary[entry.congregation].push(entry);
    }
  });

  // Apply search filter to summary
  const filteredSummary = {};
  Object.keys(summary).forEach((congregation) => {
    const searchLower = search.toLowerCase();
    const congregationMatch = congregation.toLowerCase().includes(searchLower);
    const nameMatch = summary[congregation].some(entry => 
      (entry.name || "").toLowerCase().includes(searchLower)
    );
    const positionMatch = summary[congregation].some(entry => 
      (entry.position || "").toLowerCase().includes(searchLower)
    );
    
    if (congregationMatch || nameMatch || positionMatch) {
      filteredSummary[congregation] = summary[congregation];
    }
  });

  // Determine if there are any apologies in the summary
  const hasApologies = Object.values(summary).some(entries => entries.some(e => isApologyEntry(e)));

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
  const handlePINSuccess = async (pin) => {
    if (pendingAction === 'edit' && pendingEntry) {
      await handleEditWithPIN(pendingEntry, pin);
    } else if (pendingAction === 'delete' && pendingEntry) {
      await handleDeleteWithPIN(pendingEntry, pin);
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

  const isMobile = useIsMobile();

  // Group summary by congregation, then by month, then by day
  const groupedSummary = {};
  if (Array.isArray(filteredData)) {
    filteredData.forEach((entry) => {
      if (showType === 'attendance' && isApologyEntry(entry)) return;
      if (showType === 'apology' && !isApologyEntry(entry)) return;
      if (entry.type === 'district') {
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

  return (
    <div>
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 space-y-3 md:space-y-0">
        <h1 className="text-lg md:text-xl font-bold w-full text-center">District Executives</h1>
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center">
          <label className="text-sm flex items-center gap-1">
            Year:
            <select
              value={selectedYear || ''}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="ml-1 px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
              disabled={availableYears.length === 0}
            >
              {Array.isArray(availableYears) && availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search executive..."
            className="w-full md:max-w-xs border px-3 py-2 rounded-md dark:bg-gray-700 dark:text-white text-sm md:text-base"
          />
        </div>
      </div>

      {/* Attendance & Apology Buttons */}
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
      
      {/* Table of District Executives */}
      <div className="overflow-x-auto custom-scrollbar mb-6 md:mb-10 max-w-full">
        {groupedSummary && typeof groupedSummary === 'object' && Object.keys(groupedSummary).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              {search ? 'No results found for your search.' : `No ${showType === 'all' ? 'attendance or apology' : showType} data available`}
            </div>
            <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              {search 
                ? 'Try adjusting your search terms.'
                : (showType === 'all' 
                  ? 'No attendance or apology records found for district executives.'
                  : `No ${showType} records found for district executives.`
                )
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
                          <div className="overflow-x-auto w-full">
                            <table className="min-w-max w-full text-gray-900 dark:text-gray-100 mb-2 border-collapse">
                              <thead className={darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-900"}>
                                <tr>
                                  <th className="text-center px-2 md:px-4 py-2 border-r border-gray-300 text-xs md:text-sm">Meeting</th>
                                  <th className="text-center px-2 md:px-4 py-2 border-r border-gray-300 text-xs md:text-sm">Attendee(s)</th>
                                  <th className="px-2 md:px-4 py-2 border-r border-gray-300 text-xs md:text-sm">Submitted Time</th>
                                  <th className="px-2 md:px-4 py-2 border-r border-gray-300 text-xs md:text-sm">Status</th>
                                  <th className="px-2 md:px-4 py-2 border-r border-gray-300 text-xs md:text-sm">Reason</th>
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

      {/* District Executive Attendance Chart */}
      <div className="my-8 md:my-12">
        <DistrictExecutiveChart 
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
        title={pendingAction === 'edit' ? 'Enter PIN to Edit' : 'Enter PIN to Delete'}
        message={pendingAction === 'edit' ? 'Please enter the 4-digit PIN to edit this record' : 'Please enter the 4-digit PIN to delete this record'}
      />
    </div>
  );
} 