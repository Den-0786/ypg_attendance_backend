"use client";

import { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaEye, FaTimes, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";
import { capitalizeFirst } from '../lib/utils';

function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function RecordsManager({ recordType = "attendance" }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRecords();
  }, [recordType]);

  const fetchRecords = async () => {
    setLoading(true);
    const url = recordType === 'attendance' 
      ? `/api/attendance-summary`
      : `/api/apology-summary`;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (record) => {
    setEditingRecord(record);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingRecord) return;

    const url = recordType === 'attendance' 
      ? `/api/edit-attendance/${editingRecord.id}`
      : `/api/edit-apology/${editingRecord.id}`;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(editingRecord),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Update failed:', response.status, errorData);
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || response.statusText}`);
      }

      toast.success('Record updated successfully');
      setIsEditing(false);
      setEditingRecord(null);
      fetchRecords();
      // Dispatch custom event to notify dashboard components
      const eventName = recordType === 'attendance' ? 'attendanceDataChanged' : 'apologyDataChanged';
      window.dispatchEvent(new CustomEvent(eventName));
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Failed to update record');
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    const url = recordType === 'attendance' 
      ? `/api/delete-attendance/${recordId}`
      : `/api/delete-apology/${recordId}${pin ? `?pin=${encodeURIComponent(pin)}` : ''}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        ...(recordType !== 'apology' && pin ? { body: JSON.stringify({ pin }) } : {})
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success('Record deleted successfully');
      fetchRecords();
      // Dispatch custom event to notify dashboard components
      const eventName = recordType === 'attendance' ? 'attendanceDataChanged' : 'apologyDataChanged';
      window.dispatchEvent(new CustomEvent(eventName));
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  const filteredRecords = records.filter(record => 
    (record.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.congregation || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.position || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFieldLabel = (field) => {
    const labels = {
      name: "Name",
      phone: "Phone",
      email: "Email",
      congregation: "Congregation",
      position: "Position",
      type: "Type",
      reason: "Reason",
      meeting_date: "Meeting Date",
      timestamp: "Time"
    };
    return labels[field] || field;
  };

  const renderEditForm = () => {
    if (!editingRecord) return null;

    const fields = recordType === "attendance" 
      ? ['name', 'phone', 'email', 'congregation', 'position', 'type', 'meeting_date']
      : ['name', 'congregation', 'position', 'reason', 'type', 'meeting_date'];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit {recordType === "attendance" ? "Attendance" : "Apology"} Record
            </h3>
            <button
              onClick={() => setEditingRecord(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {getFieldLabel(field)}
                </label>
                {field === 'reason' ? (
                  <textarea
                    value={editingRecord[field] || ''}
                    onChange={(e) => setEditingRecord(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                  />
                ) : field === 'type' ? (
                  <select
                    value={editingRecord[field] || ''}
                    onChange={(e) => setEditingRecord(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select type</option>
                    <option value="local">Local</option>
                    <option value="district">District</option>
                  </select>
                ) : field === 'meeting_date' ? (
                  <input
                    type="date"
                    value={editingRecord[field] || ''}
                    onChange={(e) => setEditingRecord(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={editingRecord[field] || ''}
                    onChange={(e) => setEditingRecord(prev => ({ ...prev, [field]: ['name','congregation','position','type','reason'].includes(field) ? capitalizeWords(e.target.value) : e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setEditingRecord(null)}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <FaSave /> Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteConfirm = () => {
    if (!deleteConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Confirm Delete
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Are you sure you want to delete this {recordType} record? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <FaTrash /> Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {recordType === "attendance" ? "Attendance" : "Apology"} Records
        </h2>
        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No {recordType} records found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Congregation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Position
                </th>
                {recordType === "attendance" && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                  </>
                )}
                {recordType === "apology" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Reason
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Meeting Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {record.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {record.congregation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {record.position}
                  </td>
                  {recordType === "attendance" && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.email}
                      </td>
                    </>
                  )}
                  {recordType === "apology" && (
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="max-w-xs truncate" title={record.reason}>
                        {record.reason}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      record.type === 'local' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(record.meeting_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(record)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {renderEditForm()}
      {renderDeleteConfirm()}
    </div>
  );
} 