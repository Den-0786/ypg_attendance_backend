import React, { useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import DistrictExecutiveChart from "./dashboard/DistrictExecutiveChart";
import { toast } from "react-hot-toast";
import { capitalizeFirst } from '../lib/utils';

export default function DashboardDistrict({
  attendanceData = [],
  darkMode = false,
  onEdit,
  onDelete,
  refetchAttendanceData,
}) {
  const [search, setSearch] = useState("");
  const [showType, setShowType] = useState('all'); // 'all' | 'attendance' | 'apology'
  const [editModal, setEditModal] = useState({ open: false, entry: null });

  // Filter only district executive entries, and filter by showType
  const summary = {};
  attendanceData.forEach((entry) => {
    if (showType === 'attendance' && entry.type === 'apology') return;
    if (showType === 'apology' && entry.type !== 'apology') return;
    if (entry.type === "district") {
      if (!summary[entry.congregation]) {
        summary[entry.congregation] = [];
      }
      summary[entry.congregation].push(entry);
    }
  });

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
        <h1 className="text-lg md:text-xl font-bold">District Executives</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search executive..."
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
      
      {/* Table of District Executives */}
      <div className="overflow-x-auto custom-scrollbar mb-6 md:mb-10">
        <table className="min-w-full border border-gray-300">
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-200"}>
            <tr>
              <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Meeting</th>
              <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Congregation</th>
              <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Submitted Time(s)</th>
              <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Presence Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(summary)
              .filter((name) => {
                // Check congregation name
                if (name.toLowerCase().includes(search.toLowerCase())) return true;
                // Check if any executive name or position matches
                return summary[name].some(entry =>
                  entry.name.toLowerCase().includes(search.toLowerCase()) ||
                  entry.position.toLowerCase().includes(search.toLowerCase())
                );
              })
              .map((name) => (
                <tr key={name}>
                  <td className="border px-2 md:px-4 py-2">
                    {summary[name].map((entry, i) => (
                      <div key={i} className="text-xs md:text-sm font-medium text-green-600">
                        {entry.meeting_title || "Unknown Meeting"}
                      </div>
                    ))}
                  </td>
                  <td className="border px-2 md:px-4 py-2 text-xs md:text-sm font-semibold">
                    {summary[name].map((entry, i) => (
                      <div key={i}>
                        <span className="font-semibold">{entry.name}</span>
                        <span> ({entry.position})</span>
                      </div>
                    ))}
                  </td>
                  <td className="border px-2 md:px-4 py-2 space-y-1">
                    {summary[name].map((entry, i) => (
                      <div key={i} className="text-xs md:text-sm">
                        {entry.timestamp}
                      </div>
                    ))}
                  </td>
                  <td className="border px-2 md:px-4 py-2">
                    <div className="flex gap-2 items-center">
                      {[0].map((i) => (
                        <span key={i} className="text-lg">
                          {i < summary[name].length ? (
                            <FaCheckCircle className="text-green-500" />
                          ) : (
                            <FaTimesCircle className="text-red-500" />
                          )}
                        </span>
                      ))}
                      <button
                        className="text-blue-500 hover:underline text-sm ml-2"
                        onClick={() => handleEdit(summary[name][0]?.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-500 hover:underline text-sm"
                        onClick={() => handleDelete(summary[name][0]?.id)}
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

      {/* District Executive Attendance Chart */}
      <div className="my-8 md:my-12">
        <DistrictExecutiveChart attendanceData={attendanceData} darkMode={darkMode} />
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