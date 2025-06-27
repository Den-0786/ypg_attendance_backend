import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaEdit, FaTrash, FaSave, FaFileCsv, FaEye, FaUndo, FaFilePdf, FaFilter, FaSort, FaTags, FaChartBar, FaColumns } from "react-icons/fa";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

// Mock: Replace with real user role from context/auth
const isAdmin = true;

function getUniqueYears(records) {
  const years = new Set(records.map(r => r.meeting_date && r.meeting_date.slice(0, 4)));
  return Array.from(years).filter(Boolean).sort();
}

export default function RecordsLibrary({ darkMode = false }) {
  const [tab, setTab] = useState("local");
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);
  const [undoStack, setUndoStack] = useState([]); 
  const [filterType, setFilterType] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterCong, setFilterCong] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [showColumns, setShowColumns] = useState({
    name: true,
    congregation: true,
    position: true,
    type: true,
    meeting_date: true,
    timestamp: true,
    record_kind: true,
    notes: true,
  });
  const [tagInput, setTagInput] = useState("");
  const [tagEditId, setTagEditId] = useState(null);

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line
  }, [tab, startDate, endDate]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let url = `/api/records/${tab}`;
      const params = [];
      if (startDate) params.push(`start=${startDate}`);
      if (endDate) params.push(`end=${endDate}`);
      if (params.length) url += `?${params.join("&")}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch records");
      const data = await res.json();
      setRecords(data.map(r => ({ ...r, notes: r.notes || "", tags: r.tags || [] })));
      setSelectedRecords([]); 
    } catch (err) {
      setRecords([]);
      toast.error("Failed to fetch records");
    }
    setLoading(false);
  };

  
  const handleDelete = (id, name) => {
    setDeleteId(id);
    setDeleteName(name);
    setShowConfirm(true);
  };
  const confirmDelete = async () => {
    try {
      const url = `/api/records/${tab}/${deleteId}`;
      const record = records.find(r => r.id === deleteId);
      setUndoStack([{ ...record, tab }, ...undoStack]);
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
      setShowConfirm(false);
      fetchRecords();
      toast((t) => (
        <span>
          Record deleted. <button className="ml-2 underline text-blue-600" onClick={() => handleUndo(t)}>Undo</button>
        </span>
      ), { duration: 5000 });
    } catch (err) {
      toast.error("Failed to delete record");
    }
  };
  const handleUndo = async (toastObj) => {
    if (undoStack.length === 0) return;
    const record = undoStack[0];
    
    // Backend: implement a restore endpoint or re-create the record
    await fetch(`/api/records/${record.tab}`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(record),
    });
    setUndoStack(undoStack.slice(1));
    fetchRecords();
    toast.dismiss(toastObj.id);
    toast.success("Record restored");
  };

  // Edit
  const handleEdit = (record) => {
    setEditRecord(record);
    setEditForm(record);
    setShowEdit(true);
  };
  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };
  const saveEdit = async () => {
    try {
      const url = `/api/records/${tab}/${editRecord.id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Edit failed");
      setShowEdit(false);
      fetchRecords();
      toast.success("Record updated");
    } catch (err) {
      toast.error("Failed to edit record");
    }
  };

  // PDF Download
  const handleDownloadPDF = (record) => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text("Record Details", 10, y);
    y += 10;
    Object.entries(record).forEach(([field, value]) => {
      doc.setFontSize(12);
      doc.text(`${field.replace(/_/g, ' ')}: ${String(value)}`, 10, y);
      y += 8;
    });
    doc.save(`record_${record.id}.pdf`);
  };

  // Export CSV
  const handleExport = () => {
    window.open(`/api/records/${tab}/export`, "_blank");
    toast.success("Export started");
  };

  // Tagging/Notes
  const handleTagEdit = (id, value) => {
    setTagEditId(id);
    setTagInput(value);
  };
  const saveTag = async (id) => {
    // Backend: add notes/tags to serializer/model and update here
    await fetch(`/api/records/${tab}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ notes: tagInput }),
    });
    setTagEditId(null);
    setTagInput("");
    fetchRecords();
    toast.success("Notes updated");
  };

  // Filtering
  const years = getUniqueYears(records);
  let filteredRecords = records.filter(r => {
    let match = true;
    if (filterType) match = match && r.type === filterType;
    if (filterYear) match = match && r.meeting_date && r.meeting_date.startsWith(filterYear);
    if (filterCong) match = match && (r.congregation || r.position || "").toLowerCase().includes(filterCong.toLowerCase());
    if (search) match = match && (r.congregation || r.position || "").toLowerCase().includes(search.toLowerCase());
    return match;
  });

  // Sorting
  if (sortField) {
    filteredRecords = filteredRecords.sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortAsc ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  // Pagination
  const totalRecords = filteredRecords.length;
  const totalPages = Math.ceil(totalRecords / perPage);
  const paginatedRecords = filteredRecords.slice((page - 1) * perPage, page * perPage);

  // Multi-select logic
  const isAllSelected = paginatedRecords.length > 0 && paginatedRecords.every(r => selectedRecords.includes(r.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(paginatedRecords.map(r => r.id));
    }
  };
  const toggleSelect = (id) => {
    setSelectedRecords((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  // Bulk delete
  const handleBulkDelete = () => {
    setShowBulkConfirm(true);
  };
  const confirmBulkDelete = async () => {
    try {
      for (const id of selectedRecords) {
        const record = records.find(r => r.id === id);
        setUndoStack([{ ...record, tab }, ...undoStack]);
        await fetch(`/api/records/${tab}/${id}`, { method: "DELETE", credentials: "include" });
      }
      setShowBulkConfirm(false);
      setSelectedRecords([]);
      fetchRecords();
      toast((t) => (
        <span>
          Selected records deleted. <button className="ml-2 underline text-blue-600" onClick={() => handleUndo(t)}>Undo</button>
        </span>
      ), { duration: 5000 });
    } catch (err) {
      toast.error("Failed to delete selected records");
    }
  };

  // Column customization
  const allColumns = [
    { key: 'name', label: 'Name' },
    { key: 'congregation', label: 'Congregation' },
    { key: 'position', label: 'Position' },
    { key: 'type', label: 'Type' },
    { key: 'meeting_date', label: 'Meeting Date' },
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'record_kind', label: 'Kind' },
    { key: 'notes', label: 'Notes' },
  ];

  // Analytics (mini chart)
  const chartData = years.map(y => ({
    year: y,
    count: records.filter(r => r.meeting_date && r.meeting_date.startsWith(y)).length
  }));

  return (
    <div>
      {/* Toast container */}
      <div id="toast-root"></div>
      {/* Tabs */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${tab === "local" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
          onClick={() => setTab("local")}
        >
          Local Congregations
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === "district" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
          onClick={() => setTab("district")}
        >
          District Executives
        </button>
        <button
          className="ml-auto px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-700 transition-colors"
          onClick={handleExport}
          title="Export all records as CSV"
        >
          <FaFileCsv /> Export CSV
        </button>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2 disabled:opacity-50 hover:bg-red-700 transition-colors"
          onClick={handleBulkDelete}
          disabled={selectedRecords.length === 0}
          title="Delete all selected records"
        >
          <FaTrash /> Delete Selected
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded flex items-center gap-2 hover:bg-gray-600"
          onClick={() => setShowColumns((prev) => ({ ...prev, show: !prev.show }))}
          title="Customize columns"
        >
          <FaColumns /> Columns
        </button>
      </div>
      {/* Analytics Chart */}
      <div className="mb-4 flex items-center gap-4">
        <FaChartBar className="text-blue-600" />
        <span className="font-semibold">Records per year:</span>
        {chartData.map(d => (
          <span key={d.year} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-blue-800 dark:text-blue-200 text-xs font-bold">{d.year}: {d.count}</span>
        ))}
      </div>
      {/* Advanced Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <label className="text-sm flex items-center gap-1"><FaFilter /> Type:
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="ml-1 px-2 py-1 border rounded">
            <option value="">All</option>
            <option value="local">Local</option>
            <option value="district">District</option>
          </select>
        </label>
        <label className="text-sm flex items-center gap-1">Year:
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="ml-1 px-2 py-1 border rounded"
          >
            <option value="">All</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <label className="text-sm flex items-center gap-1">Cong/Exec:
          <input value={filterCong} onChange={e => setFilterCong(e.target.value)} className="ml-1 px-2 py-1 border rounded" placeholder="Name..." />
        </label>
        <label className="text-sm">Start Date:
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="ml-2 px-2 py-1 border rounded" />
        </label>
        <label className="text-sm">End Date:
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="ml-2 px-2 py-1 border rounded" />
        </label>
        <label className="text-sm">Per page:
          <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} className="ml-1 px-2 py-1 border rounded">
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 space-y-3 md:space-y-0">
        <h1 className="text-lg md:text-xl font-bold">{tab === "local" ? "Local Congregations Records" : "District Executives Records"}</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab === "local" ? "congregation" : "executive"}...`}
          className="w-full md:max-w-xs border px-3 py-2 rounded-md dark:bg-gray-700 dark:text-white text-sm md:text-base"
        />
      </div>
      {/* Column Customization */}
      <div className="mb-2 flex flex-wrap gap-2">
        {allColumns.map(col => (
          <label key={col.key} className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={showColumns[col.key]} onChange={() => setShowColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))} />
            {col.label}
          </label>
        ))}
      </div>
      {/* Table */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div className="overflow-x-auto custom-scrollbar mb-6 md:mb-10">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
            <thead className={darkMode ? "bg-gray-700" : "bg-gray-200"}>
              <tr>
                <th className="px-2 md:px-4 py-2 border text-xs md:text-sm">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    title="Select all"
                  />
                </th>
                {allColumns.filter(col => showColumns[col.key]).map(col => (
                  <th
                    key={col.key}
                    className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm cursor-pointer select-none"
                    onClick={() => {
                      setSortField(col.key);
                      setSortAsc(sortField === col.key ? !sortAsc : true);
                    }}
                  >
                    {col.label} {sortField === col.key && (sortAsc ? '▲' : '▼')}
                  </th>
                ))}
                <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={allColumns.length + 2} className="text-center py-4">No records found.</td>
                </tr>
              )}
              {paginatedRecords.map((record, idx) => (
                <tr
                  key={record.id}
                  className={`transition-colors ${idx % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-gray-50') : ''} hover:bg-blue-50 dark:hover:bg-blue-900 cursor-pointer`}
                  onClick={() => setShowDetails(true) || setDetailsRecord(record)}
                >
                  <td className="border px-2 md:px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRecords.includes(record.id)}
                      onChange={e => { e.stopPropagation(); toggleSelect(record.id); }}
                      onClick={e => e.stopPropagation()}
                      title="Select this record"
                    />
                  </td>
                  {allColumns.filter(col => showColumns[col.key]).map(col => (
                    <td key={col.key} className="border px-2 md:px-4 py-2 text-xs md:text-sm">
                      {col.key === 'notes' && isAdmin && tagEditId === record.id ? (
                        <span>
                          <input
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            className="border px-2 py-1 rounded mr-2"
                          />
                          <button onClick={e => { e.stopPropagation(); saveTag(record.id); }} className="text-green-600"><FaSave /></button>
                        </span>
                      ) : col.key === 'notes' && isAdmin ? (
                        <span>
                          {record.notes} <button onClick={e => { e.stopPropagation(); handleTagEdit(record.id, record.notes); }} className="text-blue-600" title="Edit notes"><FaTags /></button>
                        </span>
                      ) : (
                        String(record[col.key] || "")
                      )}
                    </td>
                  ))}
                  <td className="border px-2 md:px-4 py-2 flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setShowDetails(true); setDetailsRecord(record); }}
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); handleEdit(record); }}
                          className="text-blue-500 hover:text-blue-700 p-1 rounded"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(record.id, record.congregation || record.position); }}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDownloadPDF(record); }}
                          className="text-purple-600 hover:text-purple-800 p-1 rounded"
                          title="Download PDF"
                        >
                          <FaFilePdf />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination */}
      <div className="flex gap-2 items-center justify-center mb-6">
        <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50">First</button>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50">Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50">Next</button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50">Last</button>
      </div>
      {/* Details Modal */}
      {showDetails && detailsRecord && (
        <div className="fixed inset-0 bg-black text-white bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">Record Details</h2>
            <div className="space-y-2">
              {Object.entries(detailsRecord).map(([field, value]) => (
                <div key={field} className="flex justify-between border-b pb-1">
                  <span className="font-semibold capitalize">{field.replace(/_/g, ' ')}</span>
                  <span className="text-right break-all">{String(value)}</span>
                </div>
              ))}
            </div>
            {/* Audit log placeholder: Backend required */}
            <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-900 rounded">
              <span className="font-semibold">Audit Log:</span>
              <span className="ml-2 text-xs text-gray-500">(Show who edited/deleted this record and when. Backend support required.)</span>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black text-white bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Record</h2>
            {Object.keys(editForm).map((field) => (
              field !== 'id' && field !== 'record_kind' && (
                <div key={field} className="mb-3">
                  <label className="block text-sm font-medium mb-1 capitalize">{field.replace(/_/g, ' ')}</label>
                  <input
                    value={editForm[field] || ''}
                    onChange={e => handleEditChange(field, e.target.value)}
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )
            ))}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 rounded text-white"
              >
                <FaSave className="inline mr-1" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black text-white bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg text-center">
            <p>
              Are you sure you want to delete all records for <strong>{deleteName}</strong>?
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 rounded text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Delete Confirmation Modal */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-black text-white bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg text-center">
            <p>
              Are you sure you want to delete all selected records?
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 bg-red-600 rounded text-white"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 