// ApologyForm.js
'use client';
import { useState, useEffect } from 'react';
import { useMeetingDate } from './MeetingDateContext';
import { MdMoreVert, MdEdit, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import { FaExclamationCircle } from 'react-icons/fa';
import { capitalizeFirst } from '../lib/utils';

const congregations = [
  "Emmanuel Congregation Ahinsan",
  "Peniel Congregation Esreso No 1",
  "Favour Congregation Esreso No 2",
  "Christ Congregation Ahinsan Estate",
  "Ebenezer Congregation Aprabo",
  "Mizpah Congregation Odagya No 1",
  "Odagya No 2",
  "Liberty Congregation High Tension",
  "NOM"
];

const localPositions = [
  'President', 'Vice President', 'Secretary', 'Assistant Secretary',
  'Financial Secretary', 'Treasurer', 'Evangelism Coordinator',
  'Organizing Secretary' 
];

const districtPositions = [
  'District President', "President's Rep", 'District Secretary',
  'District Assistant Secretary', 'District Financial Secretary',
  'District Treasurer','District Evangelism Coordinator', 'District Organizing Secretary'
];

const toTitleCase = (str) => {
  return str
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function ApologyForm({ meetingInfo }) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { meetingDate: contextMeetingDate, setMeetingDate, setMeetingTitle } = useMeetingDate ? useMeetingDate() : { meetingDate: '', setMeetingDate: () => {}, setMeetingTitle: () => {} };
  
  // Determine the meeting date with better fallback logic
  const meetingDate = meetingInfo?.date || contextMeetingDate || '';
  const meetingTitle = meetingInfo?.title || '';
  
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingInfo]);
  
  const [type, setType] = useState('local');
  const [form, setForm] = useState({ name: '', phone: '', email: '', congregation: '', position: '', reason: '' });
  const [apologies, setApologies] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmIndex, setConfirmIndex] = useState(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If meeting is deactivated, clear form state
    if (!contextMeetingDate && !meetingInfo?.title) {
      setForm({ name: '', phone: '', email: '', congregation: '', position: '', reason: '' });
      setApologies([]);
    }
  }, [contextMeetingDate, meetingInfo?.title]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
    let newValue = value;
    if (["name", "congregation", "position", "reason"].includes(name)) {
      newValue = capitalizeWords(value);
    }
    setForm(prev => ({ ...prev, [name]: newValue }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        apologies: [{
          name: form.name,
          phone: form.phone,
          congregation: form.congregation,
          type,
          position: form.position,
          meeting_date: meetingDate,
          reason: form.reason
        }],
        admin_username: adminUsername,
        admin_password: adminPassword
      };

      const response = await fetch('/api/submit-apologies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Apology submitted successfully');
        setApologies([]);
        setShowModal(false);
        setAdminUsername('');
        setAdminPassword('');
        setAuthError('');
        // Dispatch custom event to notify dashboard components
        window.dispatchEvent(new CustomEvent('apologyDataChanged'));
      } else {
        const errorMessage = data.error || 'Failed to submit apology';
        setAuthError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Network error in apology submission:', error);
      setAuthError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (index) => {
    setForm(apologies[index]);
    setEditingIndex(index);
    setMenuOpenIndex(null);
    setShowModal(false);
  };

  const handleDelete = (index) => {
    setApologies(apologies.filter((_, i) => i !== index));
    setMenuOpenIndex(null);
  };

  const handleFinalSubmit = async () => {
    setAuthError('');
    if (!adminUsername || !adminPassword) {
      setAuthError('Admin username and password are required.');
      return;
    }
    
    // Validate that we have apologies to submit
    if (apologies.length === 0) {
      setAuthError('No apologies to submit.');
      return;
    }
    
    // Validate that we have a meeting date
    if (!meetingDate) {
      setAuthError('No meeting date available. Please ensure a meeting is set.');
      return;
    }
    
    try {
      const payload = {
        apologies: apologies.map(({ meetingDate, ...rest }) => ({
          ...rest,
          meeting_date: meetingDate,
          timestamp: new Date().toTimeString().slice(0, 8),
        })),
        admin_username: adminUsername,
        admin_password: adminPassword,
      };
      
      const response = await fetch(`${API_URL}/api/submit-apologies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Apologies submitted successfully!');
        setApologies([]);
        setShowModal(false);
        setAdminUsername('');
        setAdminPassword('');
        setAuthError('');
        // Dispatch custom event to notify dashboard components
        window.dispatchEvent(new CustomEvent('apologyDataChanged'));
      } else {
        const errorMessage = data.error || 'Failed to submit apologies';
        setAuthError(errorMessage);
        toast.error(errorMessage);
        console.error('Apology submission failed:', data);
      }
    } catch (error) {
      console.error('Network error in apology submission:', error);
      setAuthError('Network error occurred. Please check your connection and try again.');
      toast.error('Network error occurred. Please check your connection and try again.');
    }
  };

  const positions = type === 'district' ? districtPositions : localPositions;

  const checkForDuplicatePhone = (entry) => {
    return apologies.some((existing, index) => {
      if (index === editingIndex) return false;
      return (
        existing.phone === entry.phone &&
        existing.meetingDate === meetingDate &&
        existing.type === entry.type
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white shadow-2xl mb-16 border border-yellow-300 rounded-2xl w-full max-w-md p-6 space-y-6">
        
        {/* Centered Heading and Radios */}
        <div className="flex flex-col items-center text-center space-y-2">
          <h2 className="text-xl font-semibold text-yellow-600">Log Apology</h2>

          <div className="flex gap-6 text-yellow-700 bg-yellow-50 px-4 py-2 rounded-full shadow-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="local"
                checked={type === 'local'}
                onChange={() => setType('local')}
                className="accent-yellow-500"
              />
              <span className="text-sm">Local</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="district"
                checked={type === 'district'}
                onChange={() => setType('district')}
                className="accent-yellow-500"
              />
              <span className="text-sm">District</span>
            </label>
          </div>
          
          {/* Enhanced Meeting Date Display */}
          {meetingDate ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-sm font-medium text-blue-800">
                Meeting Date: <span className="font-bold">{meetingDate}</span>
              </p>
              {meetingTitle && (
                <p className="text-xs text-blue-600 mt-1">
                  Meeting: {meetingTitle}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-sm font-medium text-red-800">
                ⚠️ No meeting date set
              </p>
              <p className="text-xs text-red-600 mt-1">
                Please ensure a meeting is active before logging apologies
              </p>
            </div>
          )}
        </div>
        <p className='text-red-400 text-sm flex items-center justify-center mb-2'>* indicates required question</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-gray-700">
          {/* Name Field */}
          <label className="block text-sm font-medium mb-2">
            Name <span className="text-red-500">*</span>
            <input
              name="name"
              required
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              className={`w-full mt-1 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-400 ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.name && (
              <div className="flex items-center gap-2 bg-red-100 text-red-700 rounded px-2 py-1 mt-1 animate-pulse">
                <FaExclamationCircle className="text-red-500" />
                <span className="text-xs">{errors.name}</span>
              </div>
            )}
          </label>

          {/* Phone Field */}
          <label className="block text-sm font-medium mb-2">
            Phone Number <span className="text-red-500">*</span>
            <input
              name="phone"
              required
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className={`w-full mt-1 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-400 ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.phone && (
              <div className="flex items-center gap-2 bg-red-100 text-red-700 rounded px-2 py-1 mt-1 animate-pulse">
                <FaExclamationCircle className="text-red-500" />
                <span className="text-xs">{errors.phone}</span>
              </div>
            )}
          </label>

          {/* Email Field (optional) */}
          <label className="block text-sm font-medium mb-2">
            Email Address (optional)
            <input
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className={`w-full mt-1 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-400 ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.email && (
              <div className="flex items-center gap-2 bg-red-100 text-red-700 rounded px-2 py-1 mt-1 animate-pulse">
                <FaExclamationCircle className="text-red-500" />
                <span className="text-xs">{errors.email}</span>
              </div>
            )}
          </label>

          {/* Congregation Select */}
          <label className="block text-sm font-medium">
            Congregation <span className="text-red-500">*</span>
            <select
              name="congregation"
              required
              value={form.congregation}
              onChange={handleChange}
              className="w-full mt-1 p-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">Select Congregation</option>
              {congregations.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>

          {/* Position Select */}
          <label className="block text-sm font-medium">
            Position <span className="text-red-500">*</span>
            <select
              name="position"
              required
              value={form.position}
              onChange={handleChange}
              className="w-full mt-1 p-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">Select Position</option>
              {positions.map(p => <option key={p}>{p}</option>)}
            </select>
          </label>

          {/* Reason Textarea */}
          <label className="block text-sm font-medium">
            Reason <span className="text-red-500">*</span>
            <textarea
              name="reason"
              required
              placeholder="Reason"
              value={form.reason}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </label>
          <button
            type="submit"
            disabled={!meetingDate}
            className={`w-full py-2 rounded-lg transition ${
              meetingDate 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {editingIndex !== null ? 'Update Apology' : 'Submit Apology'}
          </button>
          {!meetingDate && (
            <p className="text-xs text-red-600 text-center mt-2">
              ⚠️ Cannot submit apologies without an active meeting
            </p>
          )}
        </form>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-yellow-600">Logged Apologies</h3>
              <button onClick={() => setShowModal(false)} className="text-red-500 font-bold text-xl">&times;</button>
            </div>
            {apologies.length === 0 ? (
              <p>No apologies submitted yet.</p>
            ) : (
              <>
                <ul className="space-y-3 max-h-72 overflow-y-auto">
                  {apologies.map((entry, index) => (
                    <li key={index} className="p-3 bg-gray-100 rounded shadow flex justify-between items-start relative">
                      <div className="text-sm text-gray-800 space-y-1">
                        <p><strong>Name:</strong> {entry.name}</p>
                        <p><strong>Congregation:</strong> {entry.congregation}</p>
                        <p><strong>Position:</strong> {entry.position}</p>
                        <p><strong>Reason:</strong> {entry.reason}</p>
                        <p className="text-xs text-gray-500"><strong>Logged Date:</strong> {entry.meetingDate}</p>
                        <p className="text-xs text-gray-500"><strong>Logged Time:</strong> {entry.timestamp}</p>
                      </div>
                      <div className="relative">
                        <button onClick={() => setMenuOpenIndex(index === menuOpenIndex ? null : index)} className="text-gray-800 text-xl">
                          <MdMoreVert />
                        </button>
                        {menuOpenIndex === index && (
                          <div className="absolute right-0 top-6 bg-white shadow-md rounded w-40 z-10">
                            <button onClick={() => handleEdit(index)} className="flex items-center gap-2 w-full text-left px-3 py-1 hover:bg-gray-200">
                              <MdEdit className="text-sm" /> Edit
                            </button>
                            <button onClick={() => setConfirmIndex(index)} className="flex items-center gap-2 w-full text-left px-3 py-1 hover:bg-gray-200 text-red-600">
                              <MdDelete className="text-sm" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                {/* Admin credentials fields */}
                <div className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-800 font-medium mb-1">
                      🔐 Admin Verification Required
                    </p>
                    <p className="text-xs text-blue-600">
                      Please enter admin credentials to submit apologies. This is different from PIN verification.
                    </p>
                  </div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Admin Username <span className="text-red-500">*</span>
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={e => setAdminUsername(e.target.value)}
                      className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-800 dark:text-white text-xs"
                      required
                    />
                  </label>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Admin Password <span className="text-red-500">*</span>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-800 dark:text-white text-xs"
                      required
                    />
                  </label>
                  {authError && <p className="text-red-500 text-xs mt-1">{authError}</p>}
                </div>
                <div className="text-right mt-4">
                  <button onClick={handleFinalSubmit} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
                    Submit All
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-3">Confirm Delete</h3>
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
              Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{apologies[confirmIndex].name}</strong>&apos;s entry?
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setConfirmIndex(null)} className="px-4 py-2 bg-gray-800 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500">
                Cancel
              </button>
              <button onClick={() => {
                setApologies(apologies.filter((_, i) => i !== confirmIndex));
                setConfirmIndex(null);
                setMenuOpenIndex(null);
              }} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


    
  