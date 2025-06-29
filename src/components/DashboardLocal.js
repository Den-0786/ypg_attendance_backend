import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import MonthlyAttendanceGrid from "./dashboard/MonthlyAttendanceGrid";
import { toast } from "react-hot-toast";
import { capitalizeFirst, toTitleCase } from '../lib/utils';
import PINModal from './PINModal';

// Add capitalizeWords function
function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function DashboardLocal({
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

  const availableYears = getUniqueYears(attendanceData);

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

  // Group by congregation and meeting title
  const grouped = {};
  filteredAttendanceData.forEach((entry) => {
    if (showType === 'attendance' && entry.type === 'apology') return;
    if (showType === 'apology' && entry.type !== 'apology') return;
    if (entry.type !== "district") {
      const cong = entry.congregation;
      const meeting = entry.meeting_title ? toTitleCase(entry.meeting_title) : 'Unknown Meeting';
      if (!grouped[cong]) grouped[cong] = {};
      if (!grouped[cong][meeting]) grouped[cong][meeting] = [];
      grouped[cong][meeting].push(entry);
    }
  });

  // Restore previous summary logic
  const summary = {};
  filteredAttendanceData.forEach((entry) => {
    if (showType === 'attendance' && entry.type === 'apology') return;
    if (showType === 'apology' && entry.type !== 'apology') return;
    if (entry.type !== "district") {
      if (!summary[entry.congregation]) {
        summary[entry.congregation] = [];
      }
      summary[entry.congregation].push(entry);
    }
  });

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

  // Add at the top with other hooks
  const [lastDeleted, setLastDeleted] = useState(null);

  // Check for pending undo on component mount
  useEffect(() => {
    const pendingUndo = localStorage.getItem('pendingUndo');
    if (pendingUndo) {
      try {
        const undoData = JSON.parse(pendingUndo);
        if (undoData.component === 'local') {
          setLastDeleted(undoData.record);
        }
      } catch (err) {
        localStorage.removeItem('pendingUndo');
      }
    }
  }, []);

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
                const res = await fetch(`/api/delete-attendance/${entryId}`, {
                  method: 'DELETE',
                  credentials: 'include',
                });
                if (res.ok) {
                  // Store deleted record in localStorage for undo
                  const undoData = {
                    component: 'local',
                    record: deletedRecord,
                    timestamp: Date.now()
                  };
                  localStorage.setItem('pendingUndo', JSON.stringify(undoData));
                  setLastDeleted(deletedRecord);
                  
                  // Show undo toast
                  toast.custom((undoToast) => (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-blue-400 max-w-xs mx-auto flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-200">Entry deleted</span>
                      <button 
                        className="ml-3 text-blue-600 hover:text-blue-800 underline"
                        onClick={() => {
                          handleUndo();
                        }}
                      >
                        Undo
                      </button>
                    </div>
                  ), { duration: 5000 });
                  if (refetchAttendanceData) refetchAttendanceData();
                  window.dispatchEvent(new CustomEvent('attendanceDataChanged'));
                } else {
                  toast.error('Failed to delete entry');
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
    const pendingUndo = localStorage.getItem('pendingUndo');
    if (!pendingUndo) return;
    
    try {
      const undoData = JSON.parse(pendingUndo);
      if (undoData.component !== 'local') return;
      
      const attendanceData = {
        name: undoData.record.name,
        phone: undoData.record.phone || '',
        congregation: undoData.record.congregation,
        type: undoData.record.type || 'local',
        position: undoData.record.position,
        meeting_date: undoData.record.meeting_date,
        timestamp: undoData.record.timestamp
      };
      
      const res = await fetch('/api/submit-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify([attendanceData]),
      });
      
      if (res.ok) {
        localStorage.removeItem('pendingUndo');
        setLastDeleted(null);
        if (refetchAttendanceData) refetchAttendanceData();
        window.dispatchEvent(new CustomEvent('attendanceDataChanged'));
        toast.success('Entry restored successfully');
      } else {
        toast.error('Failed to restore entry');
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
    const entry = attendanceData.find(e => e.id === entryId);
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
    }
    setPendingAction(null);
    setPendingEntry(null);
  };

  // Handler for saving edit
  const handleSaveEdit = async (updatedEntry) => {
    try {
      const res = await fetch(`/api/edit-attendance/${updatedEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedEntry),
      });
      if (res.ok) {
        toast.success('Entry updated successfully');
        setEditModal({ open: false, entry: null });
        if (refetchAttendanceData) refetchAttendanceData();
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('attendanceDataChanged'));
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Edit failed:', res.status, errorData);
        toast.error(`Failed to update entry: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      toast.error('Network error');
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

  // Determine if there are any apologies in the summary
  const hasApologies = Object.values(summary).some(entries => entries.some(e => e.type === 'apology'));

  return (
    <div>
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 space-y-3 md:space-y-0">
        <h1 className="text-lg md:text-xl font-bold">Local Congregations</h1>
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center">
          <label className="text-sm flex items-center gap-1">
            Year:
            <select
              value={selectedYear || ''}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="ml-1 px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
              disabled={availableYears.length === 0}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search congregation..."
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
      
      {/* Table of Local Congregations */}
      <div className="overflow-x-auto custom-scrollbar mb-6 md:mb-10">
        {Object.keys(summary).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              No {showType === 'all' ? 'attendance or apology' : showType} data available
            </div>
            <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              {showType === 'all' 
                ? 'No attendance or apology records found for local congregations.'
                : `No ${showType} records found for local congregations.`
              }
            </div>
          </div>
        ) : (
          Object.keys(summary)
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
            .map((name, idx) => (
              <div
                key={name}
                className={`mb-6 rounded-xl shadow border border-blue-200 dark:border-blue-700 ${cardColors[idx % cardColors.length]} p-2 md:p-4`}
              >
                <table className="min-w-full text-gray-900 dark:text-gray-100">
                  <thead className={darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-900"}>
                    <tr>
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm min-w-[200px] whitespace-nowrap">Meeting</th>
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Attendee(s)</th>
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Congregation</th>
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Submitted Time(s)</th>
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Presence Status</th>
                      {hasApologies && (
                        <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Reason</th>
                      )}
                      <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr key={name} className="text-sm md:text-base">
                      <td className="border px-2 md:px-4 py-2 text-xs md:text-sm min-w-[200px] whitespace-nowrap">
                        <div className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-200">
                          {summary[name][0]?.meeting_title || "Unknown Meeting"}
                        </div>
                      </td>
                      <td className="border px-2 md:px-4 py-2 text-xs md:text-sm min-w-[220px]">
                        {summary[name].map((entry, i) => (
                          <div key={i}>
                            <span className="font-semibold">{entry.name}</span>
                            <span> ({entry.position})</span>
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
                        {summary[name].map((entry, i) => (
                          <div key={i} className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {entry.type === 'apology' ? (
                                <FaTimesCircle className="text-red-500" />
                              ) : (
                                <FaCheckCircle className="text-green-500" />
                              )}
                            </span>
                          </div>
                        ))}
                      </td>
                      {hasApologies && (
                        <td className="border px-2 md:px-4 py-2 text-xs md:text-sm">
                          {summary[name].map((entry, i) => (
                            <div key={i} className="text-xs md:text-sm">
                              {entry.type === 'apology' ? (entry.reason || 'No reason provided') : ''}
                            </div>
                          ))}
                        </td>
                      )}
                      <td className="border px-2 md:px-4 py-2">
                        {summary[name].map((entry, i) => (
                          <div key={i} className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              <FaCheckCircle className="text-green-500" />
                            </span>
                            <button
                              className="text-blue-500 hover:underline text-xs ml-2"
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
      {/* Monthly Attendance Grid */}
      <div className="my-8 md:my-12">
        <MonthlyAttendanceGrid attendanceData={filteredAttendanceData} darkMode={darkMode} />
      </div>
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
        title={pendingAction === 'edit' ? 'Enter PIN to Edit' : 'Enter PIN to Delete'}
        message={pendingAction === 'edit' ? 'Please enter the 4-digit PIN to edit this record' : 'Please enter the 4-digit PIN to delete this record'}
      />
    </div>
  );
} 