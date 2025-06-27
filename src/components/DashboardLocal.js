import React, { useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import MonthlyAttendanceGrid from "./dashboard/MonthlyAttendanceGrid";
import { toast } from "react-hot-toast";
import { capitalizeFirst, toTitleCase } from '../lib/utils';

export default function DashboardLocal({
  attendanceData = [],
  darkMode = false,
  onEdit,
  onDelete,
  refetchAttendanceData,
}) {
  const [search, setSearch] = useState("");
  const [showType, setShowType] = useState('all'); // 'all' | 'attendance' | 'apology'
  const [editModal, setEditModal] = useState({ open: false, entry: null });

  // Group by congregation and meeting title
  const grouped = {};
  attendanceData.forEach((entry) => {
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
  attendanceData.forEach((entry) => {
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

  // Handler for deleting an entry (custom confirmation)
  const handleDelete = (entryId) => {
    toast.custom((t) => (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-red-400 max-w-xs mx-auto flex flex-col items-center">
        <div className="text-lg font-bold text-red-600 mb-2">Confirm Delete</div>
        <div className="text-gray-700 dark:text-gray-200 mb-4">Are you sure you want to delete this entry?</div>
        <div className="flex gap-3">
          <button
            className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
            onClick={async () => {
              toast.dismiss(t.id);
              if (onDelete) await onDelete(entryId);
              if (refetchAttendanceData) refetchAttendanceData();
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
    const entry = attendanceData.find(e => e.id === entryId);
    if (entry) {
      setEditModal({ open: true, entry });
    } else {
      toast('Edit functionality not implemented yet');
    }
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
      } else {
        toast.error('Failed to update entry');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 space-y-3 md:space-y-0">
        <h1 className="text-lg md:text-xl font-bold">Local Congregations</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search congregation..."
          className="w-full md:max-w-xs border px-3 py-2 rounded-md dark:bg-gray-700 dark:text-white text-sm md:text-base"
        />
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
        {Object.keys(summary)
          .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
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
                    <td className="border px-2 md:px-4 py-2 text-xs md:text-sm">
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
                            <FaCheckCircle className="text-green-500" />
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="border px-2 md:px-4 py-2">
                      {summary[name].map((entry, i) => (
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
          ))}
      </div>
      {/* Monthly Attendance Grid */}
      <div className="my-8 md:my-12">
        <MonthlyAttendanceGrid attendanceData={attendanceData} darkMode={darkMode} />
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
                  onChange={e => setEditModal(m => ({ ...m, entry: { ...m.entry, name: capitalizeFirst(e.target.value) } }))}
                  required
                />
              </label>
              <label className="block text-sm font-medium">Phone
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={editModal.entry.phone}
                  onChange={e => setEditModal(m => ({ ...m, entry: { ...m.entry, phone: e.target.value } }))}
                  required
                />
              </label>
              <label className="block text-sm font-medium">Congregation
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={editModal.entry.congregation}
                  onChange={e => setEditModal(m => ({ ...m, entry: { ...m.entry, congregation: capitalizeFirst(e.target.value) } }))}
                  required
                />
              </label>
              <label className="block text-sm font-medium">Position
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={editModal.entry.position}
                  onChange={e => setEditModal(m => ({ ...m, entry: { ...m.entry, position: capitalizeFirst(e.target.value) } }))}
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
    </div>
  );
} 