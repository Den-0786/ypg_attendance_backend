// ApologyForm.js
'use client';
import { useState } from 'react';
import { useMeetingDate } from './MeetingDateContext';
import { MdMoreVert, MdEdit, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';

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

export default function ApologyForm({ meetingInfo }) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const context = useMeetingDate ? useMeetingDate() : {};
  const meetingDate = meetingInfo ? meetingInfo.date : context.meetingDate;
  const [type, setType] = useState('local');
  const [form, setForm] = useState({ name: '', congregation: '', position: '', reason: '' });
  const [apologies, setApologies] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmIndex, setConfirmIndex] = useState(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedName = toTitleCase(form.name);
    const nameExists = apologies.some((a, idx) => a.name === form.name && idx !== editingIndex);
    if (nameExists) {
      toast.error('This person has already been added.');
      return;
    }
    const now = new Date();
    const timestamp = now.toTimeString().slice(0, 8);

    const entry = { 
      ...form,
      name: cleanedName,
      type, 
      meetingDate, 
      timestamp 
    };

    if (editingIndex !== null) {
      const updated = [...apologies];
      updated[editingIndex] = entry;
      setApologies(updated);
      setEditingIndex(null);
    } else {
      setApologies(prev => [entry, ...prev]);
    }
    setForm({ name: '', congregation: '', position: '', reason: '' });
    setShowModal(true);
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
      const response = await fetch(`/api/submit-apologies`, {
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
      } else {
        setAuthError(data.error || 'Failed to submit apologies');
        toast.error(data.error || 'Failed to submit apologies');
      }
    } catch (error) {
      setAuthError('Network error occurred');
      toast.error('Network error occurred');
    }
  };

  const positions = type === 'district' ? districtPositions : localPositions;

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
          {meetingDate && (
            <p className="text-sm text-gray-500 italic">Meeting Date: {meetingDate}</p>
          )}
        </div>
        <p className='text-red-400 text-sm flex items-center justify-center mb-2'>* indicates required question</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-gray-700">
          {/* Name Field */}
          <label className="block text-sm font-medium">
            Name <span className="text-red-500">*</span>
            <input
              name="name"
              required
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              className="w-full mt-1 p-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
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
            className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition"
          >
            {editingIndex !== null ? 'Update Apology' : 'Submit Apology'}
          </button>
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
                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Admin Username <span className="text-red-500">*</span>
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={e => setAdminUsername(e.target.value)}
                      className="w-full mt-1 p-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Admin Password <span className="text-red-500">*</span>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      className="w-full mt-1 p-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      required
                    />
                  </label>
                  {authError && <p className="text-red-500 text-sm mt-1">{authError}</p>}
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
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-3">Confirm Delete</h3>
            <p className="mb-4 text-sm text-gray-700">
              Are you sure you want to delete <strong>{apologies[confirmIndex].name}</strong>&apos;s entry?
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setConfirmIndex(null)} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-600">
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


    
  