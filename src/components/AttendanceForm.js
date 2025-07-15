/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useEffect } from 'react';
import { useMeetingDate } from '../components/MeetingDateContext';
import { MdMoreVert, MdEdit, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import { FaExclamationCircle } from 'react-icons/fa';
import { capitalizeFirst } from '../lib/utils';

const congregations = [
  "Emmanuel Congregation Ahinsan", "Peniel Congregation Esreso No 1",
  "Favour Congregation Esreso No 2", "Christ Congregation Ahinsan Estate",
  "Ebenezer Congregation Aprabo", "Mizpah Congregation Odagya No 1",
  "Odagya No 2", "Liberty Congregation High Tension", "NOM"
];

const localPositions = [
  'President', 'Vice President', 'Secretary', 'Assistant Secretary',
  'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
];

const districtPositions = [
  'President', "President's Rep", 'Secretary', 'Assistant Secretary',
  'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
];

const toTitleCase = (str) =>
  str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function AttendanceForm({ meetingInfo }) {

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const context = useMeetingDate ? useMeetingDate() : {};
  const { meetingDate: contextMeetingDate, meetingTitle: contextMeetingTitle, setMeetingDate, setMeetingTitle } = context;

  // Use meetingInfo prop if available, otherwise fall back to context
  const meetingDate = meetingInfo?.date || contextMeetingDate || '';
  const meetingTitle = meetingInfo?.title || contextMeetingTitle || '';

  // Chrome-specific fix for meeting info updates
  useEffect(() => {
    if (meetingInfo) {
      setMeetingDate(meetingInfo.meeting_date || '');
      setMeetingTitle(meetingInfo.meeting_title || '');
      
      // Chrome-specific fix for meeting info display
      if (navigator.userAgent.includes('Chrome')) {
        // Force re-render for Chrome
        setTimeout(() => {
          setMeetingDate(meetingInfo.meeting_date || '');
          setMeetingTitle(meetingInfo.meeting_title || '');
        }, 100);
      }
    }
  }, [meetingInfo]);

  const [type, setType] = useState('local');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', congregation: '', position: ''
  });
  const [errors, setErrors] = useState({});
  const [attendees, setAttendees] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmIndex, setConfirmIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingEntry, setPendingEntry] = useState(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpenIndex !== null) {
        setMenuOpenIndex(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpenIndex]);

  const positions = type === 'local' ? localPositions : districtPositions;

  const validateField = (name, value) => {
    let error = '';
    if (name === 'name') {
      if (!/^[a-zA-Z\s\-]+$/.test(value)) {
        error = 'Only letters, spaces, and hyphens allowed.';
      }
    }
    if (name === 'phone') {
      if (!/^\d{10}$/.test(value)) {
        error = 'Phone number must be exactly 10 digits.';
      }
    }
    if (name === 'email' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Invalid email format.';
      }
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
    let newValue = value;
    if (["name", "congregation", "position"].includes(name)) {
      newValue = capitalizeWords(value);
    }
    setForm(prev => ({ ...prev, [name]: newValue }));
  };

  const checkForDuplicatePhone = (entry) => {
    return attendees.some((existing, index) => {
      if (index === editingIndex) return false;
      return (
        existing.phone === entry.phone &&
        existing.meetingDate === meetingDate &&
        existing.type === entry.type
      );
    });
  };

  // Helper to check if position is already used for this meeting/type (local or district)
  const checkForDuplicatePosition = (entry) => {
    if (entry.type === 'local') {
      // For local: block if position is used for the same congregation, meeting, and type
      return attendees.some((existing, index) => {
        if (index === editingIndex) return false;
        return (
          existing.position === entry.position &&
          existing.congregation === entry.congregation &&
          existing.meetingDate === meetingDate &&
          existing.type === 'local'
        );
      });
    } else if (entry.type === 'district') {
      // For district: block if position is used for the same meeting and type (district), regardless of congregation
      return attendees.some((existing, index) => {
        if (index === editingIndex) return false;
        return (
          existing.position === entry.position &&
          existing.meetingDate === meetingDate &&
          existing.type === 'district'
        );
      });
    }
    return false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.congregation || !form.position) {
      toast.error('Please fill all required fields');
      return;
    }

    if (Object.values(errors).some(error => error)) {
      toast.error('Please fix the errors in the form');
      return;
    }

    const cleaned = {
      name: toTitleCase(form.name.trim()),
      phone: form.phone.trim(),
      email: form.email.trim(),
      congregation: form.congregation.trim(),
      position: form.position.trim()
    };

    // Only block if phone is used for this meeting/type
    if (checkForDuplicatePhone({ ...cleaned, type })) {
      toast.error('This phone number has already been used for this meeting.');
      return;
    }

    // Only block if position is used for this meeting/type
    if (checkForDuplicatePosition({ ...cleaned, type })) {
      toast.error('This position has already been used for this meeting.');
      return;
    }

    // For local, max 2 per congregation per meeting
    const sameCongregationCount = attendees.filter(
      a => a.congregation === cleaned.congregation &&
          a.meetingDate === meetingDate &&
          a.type === 'local'
    ).length;
    if (
      type === 'local' &&
      editingIndex === null &&
      sameCongregationCount >= 2
    ) {
      toast.error(`You have exceeded the 2-attendee limit for ${cleaned.congregation}`);
      return;
    }

    const now = new Date();
    const timestamp = now.toTimeString().slice(0, 8);

    const newEntry = {
      ...cleaned,
      type,
      meetingDate,
      meetingTitle,
      timestamp,
      id: Date.now()
    };

    setPendingEntry(newEntry);
    setShowModal(true);
  };

  const confirmPendingEntry = () => {
    if (editingIndex !== null) {
      const updated = [...attendees];
      updated[editingIndex] = pendingEntry;
      setAttendees(updated);
      toast.success('Entry updated successfully');
      setEditingIndex(null);
    } else {
      setAttendees(prev => [pendingEntry, ...prev]);
      toast.success('New entry added');
    }

    setPendingEntry(null);
    setForm({ name: '', phone: '', email: '', congregation: '', position: '' });
    setErrors({});
    setShowModal(false);
  };

  const handleEdit = (index) => {
    const entry = attendees[index];
    setForm({
      name: entry.name,
      phone: entry.phone,
      email: entry.email || '',
      congregation: entry.congregation,
      position: entry.position
    });
    setType(entry.type);
    setEditingIndex(index);
    setShowModal(false);
    setMenuOpenIndex(null);
  };

  const handleDelete = (index) => {
    setConfirmIndex(index);
    setMenuOpenIndex(null);
  };

  const confirmDelete = () => {
    const updated = attendees.filter((_, index) => index !== confirmIndex);
    setAttendees(updated);
    setConfirmIndex(null);
    toast.success('Entry deleted successfully');
  };

  const handleFinalSubmit = async () => {
    if (attendees.length === 0) {
      toast.error('No entries to submit');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = attendees.map(({ meetingDate, meetingTitle, ...rest }) => ({
        ...rest,
        meeting_date: meetingDate,
        timestamp: new Date().toTimeString().slice(0, 8),
      }));
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${API_URL}/api/submit-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Attendance submitted successfully!');
        setAttendees([]);
        setShowModal(false);
        // Dispatch custom event to notify dashboard components
        window.dispatchEvent(new CustomEvent('attendanceDataChanged'));
      } else {
        // Show the real error message from backend
        toast.error(data.error || 'Failed to submit attendance');
        console.error('Attendance submission failed:', data);
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6  max-w-xl mx-auto border border-yellow-200">
      <div className="bg-white rounded-xl p-6 shadow border border-blue-200 mb-6">
        <p className="text-lg font-semibold text-gray-800">
          Welcome to Ahinsan District YPG Attendance taker
        </p>
        <p className="text-sm text-gray-600">
          Please take a moment and fill out the forms
        </p>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-6 mb-6">        
        
        <img
          src="/ypg.jpeg"
          alt="YPG Welcome"
          className="rounded-xl shadow-md border border-gray-200 w-40 h-auto"
        />
        
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-gray-700">Please select one of the following and proceed to fill the attendance forms</p>
          
          <div className="flex flex-col gap-2">
            {/* 🎯 Styled Radios */}
            <div className="flex gap-6 text-green-700 bg-green-50 px-4 py-2 rounded-full shadow-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="local"
                  checked={type === 'local'}
                  onChange={() => setType('local')}
                  className="accent-green-500"
                />
                <span className="text-sm">Local</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="district"
                  checked={type === 'district'}
                  onChange={() => setType('district')}
                  className="accent-green-500"
                />
                <span className="text-sm">District</span>
              </label>
            </div>
            {meetingDate && (
              <p className="text-sm text-gray-500">Meeting Date: {meetingDate}</p>
            )}
            {meetingTitle && (
              <p className='text-sm text-gray-500'>Meeting: <span className="font-semibold text-green-600">{meetingTitle}</span></p>
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-gray-800 my-4"></div>

      {/* ✅ Attendance Form */}
      <div className="w-3/3 sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto space-y-4 bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
        <h2 className="text-2xl text-green-700 font-bold text-center mb-2">Attendance Form</h2>
        <p className="text-red-600 text-sm text-center">* indicates required question</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-gray-900">
          {[
            { label: 'Full Name', name: 'name', required: true },
            { label: 'Phone Number', name: 'phone', required: true },
            { label: 'Email Address (optional)', name: 'email', required: false }
          ].map(({ label, name, required }) => (
            <label key={name} className="block text-sm font-medium mb-2">
              {label} {required && <span className="text-red-600">*</span>}
              <input
                name={name}
                value={form[name]}
                required={required}
                onChange={handleChange}
                className={`w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 ${errors[name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {errors[name] && (
                <div className="flex items-center gap-2 bg-red-100 text-red-700 rounded px-2 py-1 mt-1 animate-pulse">
                  <FaExclamationCircle className="text-red-500" />
                  <span className="text-xs">{errors[name]}</span>
                </div>
              )}
            </label>
          ))}

          <label className="block text-sm font-medium">
            Congregation <span className="text-red-600">*</span>
            <select
              name="congregation"
              required
              value={form.congregation}
              onChange={handleChange}
              className="w-full mt-1 p-1 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">Select Congregation</option>
              {congregations.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Position <span className="text-red-600">*</span>
            <select
              name="position"
              required
              value={form.position}
              onChange={handleChange}
              className="w-full mt-1 p-1 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">Select Position</option>
              {positions.map(p => <option key={p}>{p}</option>)}
            </select>
          </label>

          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:bg-red-400 transition font-medium"
            disabled={Object.values(errors).some(error => error)}
          >
            {editingIndex !== null ? 'Update Entry' : 'Submit'}
          </button>
        </form>
      </div>

      {/* Show entries button when there are entries */}
      {attendees.length > 0 && (
        <div className="w-2/3 sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto mt-4">
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition font-medium"
          >
            View/Edit Entries ({attendees.length})
          </button>
        </div>
      )}

      {/* ✅ Confirm Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-blue-600">
                {pendingEntry ? 'Confirm New Entry' : 'Manage Entries'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setPendingEntry(null);
                }}
                className="text-red-500 font-bold text-xl"
                disabled={isSubmitting}
              >
                &times;
              </button>
            </div>

            {/* Show pending entry confirmation if exists */}
            {pendingEntry && (
              <>
                <div className="text-sm text-gray-800 space-y-1 mb-4 p-3 bg-blue-50 rounded">
                  <p><strong>New Entry:</strong></p>
                  <p><strong>Name:</strong> {pendingEntry.name}</p>
                  <p><strong>Congregation:</strong> {pendingEntry.congregation}</p>
                  <p><strong>Representing:</strong> {pendingEntry.type}</p>
                  <p><strong>Position:</strong> {pendingEntry.position}</p>
                  <p className="text-xs text-gray-500"><strong>Meeting Date:</strong> {pendingEntry.meetingDate}</p>
                  <p className="text-xs text-gray-500"><strong>Reported @:</strong> {pendingEntry.timestamp}</p>
                </div>
                <div className="flex justify-end gap-4 mb-4">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setPendingEntry(null);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPendingEntry}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
            
            {/* Always show entries list if there are entries */}
            {attendees.length > 0 && (
              <>
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Current Entries ({attendees.length})</h4>
                </div>
                <ul className="space-y-3 max-h-72 overflow-y-auto">
                  {attendees.map((entry, index) => (
                    <li key={entry.id} className="p-3 bg-gray-50 rounded shadow flex justify-between items-start relative">
                      <div className="text-sm text-gray-800 space-y-1">
                        <p><strong>Name:</strong> {entry.name}</p>
                        <p><strong>Congregation:</strong> {entry.congregation}</p>
                        <p><strong>Representing:</strong> {entry.type}</p>
                        <p><strong>Position:</strong> {entry.position}</p>
                        <p className="text-xs text-gray-500"><strong>Meeting Date:</strong> {entry.meetingDate}</p>
                        <p className="text-xs text-gray-500"><strong>Reported @:</strong> {entry.timestamp}</p>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenIndex(index === menuOpenIndex ? null : index);
                          }} 
                          className="text-gray-800 text-xl hover:text-gray-600"
                        >
                          <MdMoreVert />
                        </button>
                        {menuOpenIndex === index && (
                          <div className="absolute right-0 top-6 bg-white shadow-lg rounded-md w-40 z-[9999] border border-gray-200" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleEdit(index)} 
                              className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 rounded-t-md"
                            >
                              <MdEdit className="text-sm" /> Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(index)} 
                              className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600 rounded-b-md"
                            >
                              <MdDelete className="text-sm" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="text-right mt-4">
                  <button
                    onClick={handleFinalSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
                    disabled={isSubmitting || attendees.length === 0}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit All'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ✅ Delete Confirmation Modal */}
      {confirmIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold text-red-600 mb-3">Confirm Delete</h3>
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
              Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{attendees[confirmIndex]?.name}</strong>&apos;s entry?
            </p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setConfirmIndex(null)} 
                className="px-4 py-2 bg-gray-800 dark:bg-gray-600 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}