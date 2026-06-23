// CHANGES: Added checkbox column for bulk selection and updated undo/restore logic to use backend restore endpoint for apologies and attendance. Improved error reporting for restore failures.
import React, { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaTrash,
  FaSave,
  FaFileCsv,
  FaEye,
  FaUndo,
  FaFilePdf,
  FaFilter,
  FaSort,
  FaTags,
  FaChartBar,
  FaColumns,
  FaStickyNote,
} from "react-icons/fa";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import { capitalizeFirst } from "../../lib/utils";
import PINModal from "../auth/PINModal";
import { BASE_URL } from "../../lib/config";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const isAdmin = true;
const API_URL = process.env.NEXT_PUBLIC_API_URL || BASE_URL || "";

function getUniqueYears(records) {
  const years = new Set(
    records.map((r) => r.meeting_date && r.meeting_date.slice(0, 4))
  );
  return Array.from(years).filter(Boolean).sort();
}

// Add capitalizeWords function
function capitalizeWords(str) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function RecordsLibrary({
  darkMode = false,
  attendanceData = [],
  apologyData = [],
}) {
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
  const [filterType, setFilterType] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterCong, setFilterCong] = useState("");
  const [filterRecordKind, setFilterRecordKind] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [showColumns, setShowColumns] = useState({
    name: true,
    congregation: true,
    position: true,
    type: true,
    meeting_date: true,
    timestamp: true,
    record_kind: true,
    notes: true,
    show: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [tagEditId, setTagEditId] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesRecord, setNotesRecord] = useState(null);

  // PIN verification state
  const [showPINModal, setShowPINModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingRecord, setPendingRecord] = useState(null);

  // Check for pending undo on component mount
  useEffect(() => {
    // Remove all undo/restore logic and UI
    // 1. Remove handleUndo function
    // 2. Remove lastDeleted state and any references
    // 3. Remove localStorage.setItem('pendingUndo', ...) and related code
    // 4. Remove Undo button from toasts
  }, []);

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line
  }, [
    tab,
    startDate,
    endDate,
    search,
    filterType,
    filterYear,
    filterRecordKind,
  ]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      // Fetch both attendance and apology data
      const token = localStorage.getItem("access_token");
      const [attendanceRes, apologyRes] = await Promise.all([
        fetch(`${API_URL}/api/attendance-summary`, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        }),
        fetch(`${API_URL}/api/apology-summary`, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        }),
      ]);

      if (!attendanceRes.ok)
        throw new Error("Failed to fetch attendance records");
      if (!apologyRes.ok) throw new Error("Failed to fetch apology records");

      const attendanceData = await attendanceRes.json();
      const apologyData = await apologyRes.json();

      // Process attendance data
      let filteredAttendanceData = attendanceData;
      if (tab === "local") {
        filteredAttendanceData = attendanceData.filter(
          (record) => record.type === "local"
        );
      } else if (tab === "district") {
        filteredAttendanceData = attendanceData.filter(
          (record) => record.type === "district"
        );
      }

      // Process apology data
      let filteredApologyData = apologyData;
      if (tab === "local") {
        filteredApologyData = apologyData.filter(
          (record) => record.type === "local"
        );
      } else if (tab === "district") {
        filteredApologyData = apologyData.filter(
          (record) => record.type === "district"
        );
      }

      // Add record_kind field and combine data
      const processedAttendanceData = filteredAttendanceData.map((record) => ({
        ...record,
        record_kind: "attendance",
        notes: record.notes || "",
        tags: record.tags || [],
      }));

      const processedApologyData = filteredApologyData.map((record) => ({
        ...record,
        record_kind: "apology",
        notes: record.notes || "",
        tags: record.tags || [],
      }));

      // Combine attendance and apology data
      const combinedData = [
        ...processedAttendanceData,
        ...processedApologyData,
      ];

      setRecords(combinedData);
      setSelectedRecords([]);
    } catch (err) {
      setRecords([]);
      toast.error("Failed to fetch records");
    }
    setLoading(false);
  };

  const handleDelete = (id, name) => {
    setPendingAction("delete");
    setPendingRecord({ id, name });
    setShowPINModal(true);
  };

  const handleDeleteWithPIN = (id, name) => {
    setDeleteId(id);
    setDeleteName(name);
    setShowConfirm(true);
  };

  const confirmDelete = async (pin) => {
    try {
      const record = records.find((r) => r.id === deleteId);
      // Use hard delete endpoint
      let endpoint =
        record.record_kind === "apology"
          ? `${API_URL}/api/delete-apology/${deleteId}`
          : `${API_URL}/api/delete-attendance/${deleteId}`;
      endpoint += `?pin=${encodeURIComponent(pin)}`;
      const token = localStorage.getItem("access_token");
      await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });
      setShowConfirm(false);
      setDeleteId(null);
      setDeleteName("");
      fetchRecords();
      toast.success("Record deleted");
    } catch (err) {
      toast.error("Failed to delete record");
    }
  };

  // PIN success handler
  const handlePINSuccess = (pin) => {
    if (pendingAction === "edit" && pendingRecord) {
      handleEditWithPIN(pendingRecord);
    } else if (pendingAction === "delete" && pendingRecord) {
      handleDeleteWithPIN(pendingRecord.id, pendingRecord.name, pin);
    }
    setPendingAction(null);
    setPendingRecord(null);
    setShowPINModal(false); // Close the PIN modal
  };

  // Edit
  const handleEdit = (record) => {
    setPendingAction("edit");
    setPendingRecord(record);
    setShowPINModal(true);
  };

  const handleEditWithPIN = (record) => {
    setEditRecord(record);
    setEditForm(record);
    setShowEdit(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    try {
      // Use different endpoints based on record type
      const endpoint =
        editRecord.record_kind === "apology"
          ? `${API_URL}/api/edit-apology/${editRecord.id}`
          : `${API_URL}/api/edit-attendance/${editRecord.id}`;

      // Only send the specific fields that are allowed to be edited
      const allowedFields = ["name", "phone", "congregation", "position"];
      const editData = {};
      allowedFields.forEach((field) => {
        if (editForm[field] !== undefined) {
          editData[field] = editForm[field];
        }
      });

      const token = localStorage.getItem("access_token");
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(editData),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Edit failed: ${res.status} - ${errorData}`);
      }
      const responseData = await res.json();
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
      doc.text(`${field.replace(/_/g, " ")}: ${String(value)}`, 10, y);
      y += 8;
    });
    doc.save(`record_${record.id}.pdf`);
  };

  // Export CSV
  const handleExport = () => {
    window.open(`${API_URL}/api/records/${tab}/export`, "_blank");
    toast.success("Export started");
  };

  // Tagging/Notes
  const handleTagEdit = (id, value) => {
    setTagEditId(id);
    setTagInput(value);
  };
  const saveTag = async (id) => {
    const record = records.find((r) => r.id === id);
    const endpoint =
      record.record_kind === "apology"
        ? `${API_URL}/api/edit-apology/${id}`
        : `${API_URL}/api/edit-attendance/${id}`;

    const token = localStorage.getItem("access_token");
    await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      body: JSON.stringify({ notes: tagInput }),
    });
    setTagEditId(null);
    setTagInput("");
    fetchRecords();
    toast.success("Notes updated");
  };

  // Filtering - handle all frontend filters including search
  const years = getUniqueYears(records);
  let filteredRecords = records.filter((r) => {
    let match = true;

    // Search filter - search across name, congregation, and position
    if (search) {
      const searchLower = search.toLowerCase();
      const nameMatch = (r.name || "").toLowerCase().includes(searchLower);
      const congregationMatch = (r.congregation || "")
        .toLowerCase()
        .includes(searchLower);
      const positionMatch = (r.position || "")
        .toLowerCase()
        .includes(searchLower);
      match = match && (nameMatch || congregationMatch || positionMatch);
    }

    // Year filter
    if (filterYear) {
      const entryYear = new Date(r.meeting_date).getFullYear();
      match = match && entryYear === parseInt(filterYear);
    }
    // Record kind filter
    if (filterRecordKind) {
      match = match && r.record_kind === filterRecordKind;
    }
    // Congregation filter
    if (filterCong)
      match =
        match &&
        (r.congregation || r.position || "")
          .toLowerCase()
          .includes(filterCong.toLowerCase());
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
  const paginatedRecords = filteredRecords.slice(
    (page - 1) * perPage,
    page * perPage
  );

  // Multi-select logic
  const isAllSelected =
    paginatedRecords.length > 0 &&
    paginatedRecords.every((r) => selectedRecords.includes(r.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(paginatedRecords.map((r) => r.id));
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
  const confirmBulkDelete = async (pin) => {
    try {
      for (const id of selectedRecords) {
        const record = records.find((r) => r.id === id);
        let endpoint =
          record.record_kind === "apology"
            ? `${API_URL}/api/delete-apology/${id}`
            : `${API_URL}/api/delete-attendance/${id}`;
        endpoint += `?pin=${encodeURIComponent(pin)}`;
        const token = localStorage.getItem("access_token");
        await fetch(endpoint, {
          method: "DELETE",
          credentials: "include",
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "application/json",
          },
        });
      }
      setShowBulkConfirm(false);
      setSelectedRecords([]);
      fetchRecords();
      toast.success("Selected records deleted");
    } catch (err) {
      toast.error("Failed to delete selected records");
    }
  };

  // Column customization
  const allColumns = [
    { key: "name", label: "Name" },
    { key: "congregation", label: "Congregation" },
    { key: "position", label: "Position" },
    { key: "type", label: "Type" },
    { key: "meeting_date", label: "Meeting Date" },
    { key: "timestamp", label: "Timestamp" },
    { key: "record_kind", label: "Kind" },
    { key: "notes", label: "Notes" },
  ];

  // Analytics (mini chart)
  const chartData = years.map((y) => ({
    year: y,
    count: records.filter((r) => r.meeting_date && r.meeting_date.startsWith(y))
      .length,
  }));

  // Determine if there are any apologies in the paginatedRecords
  const hasApologies = paginatedRecords.some(
    (r) => r.record_kind === "apology"
  );

  const isMobile = useIsMobile();

  // Group records by congregation, then by month, then by day
  const groupedRecords = {};
  filteredRecords.forEach((record) => {
    const cong = record.congregation || "Unknown";
    const dateObj = new Date(record.meeting_date);
    const monthKey = dateObj.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    const dayKey = dateObj.toLocaleDateString();
    if (!groupedRecords[cong]) groupedRecords[cong] = {};
    if (!groupedRecords[cong][monthKey]) groupedRecords[cong][monthKey] = {};
    if (!groupedRecords[cong][monthKey][dayKey])
      groupedRecords[cong][monthKey][dayKey] = [];
    groupedRecords[cong][monthKey][dayKey].push(record);
  });

  const congregationColors = {
    "Emmanuel Congregation Ahinsan":
      "bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700",
    "Peniel Congregation Esreso No 1":
      "bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700",
    "Favour Congregation Esreso No 2":
      "bg-yellow-100 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700",
    "Christ Congregation Ahinsan Estate":
      "bg-purple-100 border-purple-300 dark:bg-purple-900 dark:border-purple-700",
    "Ebenezer Congregation Aprabo":
      "bg-pink-100 border-pink-300 dark:bg-pink-900 dark:border-pink-700",
    "Mizpah Congregation Odagya No 1":
      "bg-orange-100 border-orange-300 dark:bg-orange-900 dark:border-orange-700",
    "Odagya No 2":
      "bg-teal-100 border-teal-300 dark:bg-teal-900 dark:border-teal-700",
    "Liberty Congregation High Tension":
      "bg-red-100 border-red-300 dark:bg-red-900 dark:border-red-700",
    NOM: "bg-gray-100 border-gray-300 dark:bg-gray-900 dark:border-gray-700",
  };

  return (
    <div>
      {/* Toast container */}
      <div id="toast-root"></div>

      {/* Tabs */}
      <div className="flex gap-2 md:gap-4 mb-4 justify-center">
        <button
          className={`px-5 py-2.5 rounded-xl font-medium text-sm md:text-base transition-all ${tab === "local" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"}`}
          onClick={() => setTab("local")}
        >
          Local Congregations
        </button>
        <button
          className={`px-5 py-2.5 rounded-xl font-medium text-sm md:text-base transition-all ${tab === "district" ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg" : "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"}`}
          onClick={() => setTab("district")}
        >
          District Executives
        </button>
      </div>
      {/* Analytics Chart */}
      <div className="mb-4 flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-4 rounded-xl">
        <FaChartBar className="text-indigo-600 dark:text-indigo-300" />
        <span className="font-semibold text-gray-700 dark:text-gray-300">Records per year:</span>
        {chartData.map((d) => (
          <span
            key={d.year}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-lg text-blue-800 dark:text-blue-200 text-xs font-bold border border-blue-200 dark:border-blue-700"
          >
            {d.year}: {d.count}
          </span>
        ))}
      </div>
      {/* Advanced Filters */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
        <label className="text-sm flex flex-col gap-1">
          <span className="flex items-center gap-1 font-medium">
            <FaFilter /> Type
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs max-w-[90px]"
          >
            <option value="">All</option>
            <option value="local">Local</option>
            <option value="district">District</option>
          </select>
        </label>
        <label className="text-sm flex flex-col gap-1">
          <span className="font-medium">Record Kind</span>
          <select
            value={filterRecordKind}
            onChange={(e) => setFilterRecordKind(e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs max-w-[90px]"
          >
            <option value="">All</option>
            <option value="attendance">Attendance</option>
            <option value="apology">Apology</option>
          </select>
        </label>
        <label className="text-sm flex flex-col gap-1">
          <span className="font-medium">Year</span>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs max-w-[90px]"
          >
            <option value="">All</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm flex flex-col gap-1">
          <span className="font-medium">Per page</span>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="px-2 py-1.5 border rounded-md text-xs max-w-[70px]"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm flex flex-col gap-1">
          <span className="font-medium">Start Date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs max-w-[110px]"
          />
        </label>
        <label className="text-sm flex flex-col gap-1">
          <span className="font-medium">End Date</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs max-w-[110px]"
          />
        </label>
        <label className="text-sm flex flex-col gap-1 col-span-3">
          <span className="font-medium">Cong/Exec</span>
          <input
            value={filterCong}
            onChange={(e) => setFilterCong(e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs max-w-[220px]"
            placeholder="Name..."
          />
        </label>
      </div>
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 space-y-3 md:space-y-0">
        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {tab === "local"
            ? "Local Congregations Records"
            : "District Executives Records"}
        </h1>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab === "local" ? "congregation" : "executive"}...`}
            className="w-full md:max-w-xs border-2 border-amber-500/30 px-4 py-2.5 rounded-xl dark:bg-gray-700 dark:text-white text-sm md:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      {/* Column Customization */}
      <div className="mb-2 flex flex-wrap gap-2">
        {allColumns.map((col) => (
          <label key={col.key} className="text-xs flex items-center gap-1">
            <input
              type="checkbox"
              checked={showColumns[col.key]}
              onChange={() =>
                setShowColumns((prev) => ({
                  ...prev,
                  [col.key]: !prev[col.key],
                }))
              }
            />
            {col.label}
          </label>
        ))}
      </div>
      {/* Records Table (if present) */}
      <div className="overflow-x-auto custom-scrollbar mb-6 md:mb-10">
        {Object.keys(groupedRecords).map((cong, idx) => (
          <div
            key={cong}
            className={`w-full max-w-full mb-6 rounded-2xl shadow-lg border p-4 md:p-5 ${congregationColors[cong] || (darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}`}
          >
            <h3 className={`text-xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>{cong}</h3>
            {Object.keys(groupedRecords[cong]).map((month) => (
              <div key={month} className="mb-4">
                <h4 className={`text-base font-semibold mb-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  {month}
                </h4>
                {Object.keys(groupedRecords[cong][month]).map((day) => (
                  <div
                    key={day}
                    className={`mb-2 pl-2 border-l-2 ${darkMode ? 'border-blue-500' : 'border-blue-400'}`}
                  >
                    <div className={`font-medium text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {day}
                    </div>
                    <div className="overflow-x-auto w-full">
                      <table className={`min-w-max w-full mb-2 border-collapse ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        <thead
                          className={
                            darkMode
                              ? "bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900"
                          }
                        >
                          <tr>
                            <th className={`px-3 md:px-4 py-3 border-r ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-xs md:text-sm`}>
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={toggleSelectAll}
                              />
                            </th>
                            <th className="text-center px-3 md:px-4 py-3 border-r border-gray-600 text-xs md:text-sm font-semibold">
                              Name
                            </th>
                            <th className="text-center px-3 md:px-4 py-3 border-r border-gray-600 text-xs md:text-sm font-semibold">
                              Congregation
                            </th>
                            <th className="text-center px-3 md:px-4 py-3 border-r border-gray-600 text-xs md:text-sm font-semibold">
                              Position
                            </th>
                            <th className="px-3 md:px-4 py-3 border-r border-gray-600 text-xs md:text-sm font-semibold">
                              Type
                            </th>
                            <th className="px-3 md:px-4 py-3 border-r border-gray-600 text-xs md:text-sm font-semibold">
                              Meeting Date
                            </th>
                            <th className="px-3 md:px-4 py-3 border-r border-gray-600 text-xs md:text-sm font-semibold">
                              Timestamp
                            </th>
                            <th className="px-3 md:px-4 py-3 border-r border-gray-600 text-xs md:text-sm font-semibold">
                              Kind
                            </th>
                            <th className="px-3 md:px-4 py-3 border-r border-gray-600 text-xs md:text-sm font-semibold">
                              Notes
                            </th>
                            <th className="text-center px-3 md:px-4 py-3 text-xs md:text-sm font-semibold">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedRecords[cong][month][day].map((record, i) => (
                            <tr
                              key={record.id || i}
                              className={`text-sm md:text-base hover:bg-gray-700/50 transition-colors ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`}
                            >
                              <td className={`border px-3 md:px-4 py-3 border-r ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-center`}>
                                <input
                                  type="checkbox"
                                  checked={selectedRecords.includes(record.id)}
                                  onChange={() => toggleSelect(record.id)}
                                />
                              </td>
                              <td className={`border px-3 md:px-4 py-3 text-xs md:text-sm border-r ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-center font-semibold`}>
                                {record.name}
                              </td>
                              <td className={`border px-3 md:px-4 py-3 text-xs md:text-sm border-r ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-center`}>
                                {record.congregation}
                              </td>
                              <td className={`border px-3 md:px-4 py-3 text-xs md:text-sm border-r ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-center`}>
                                {record.position}
                              </td>
                              <td className={`border px-3 md:px-4 py-3 border-r ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-center`}>
                                {record.type}
                              </td>
                              <td className={`border px-3 md:px-4 py-3 border-r ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-center`}>
                                {record.meeting_date}
                              </td>
                              <td className={`border px-3 md:px-4 py-3 border-r ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-center`}>
                                {record.timestamp}
                              </td>
                              <td className={`border px-3 md:px-4 py-3 border-r ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-center`}>
                                {record.record_kind}
                              </td>
                              <td className={`border px-3 md:px-4 py-3 border-r ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-center`}>
                                {record.notes}
                              </td>
                              <td className="border px-3 md:px-4 py-3 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => {
                                      setNotesRecord(record);
                                      setShowNotesModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50 transition-colors"
                                    title="View/Add Notes"
                                  >
                                    <FaStickyNote />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(record)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDelete(record.id, record.name)
                                    }
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
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
        ))}
      </div>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 md:gap-4 justify-center mb-4">
        <button
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-sm md:text-base flex items-center gap-2 hover:shadow-lg transition-all"
          onClick={handleExport}
          title="Export all records as CSV"
        >
          <FaFileCsv /> Export CSV
        </button>
        <button
          className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl text-sm md:text-base flex items-center gap-2 disabled:opacity-50 hover:shadow-lg transition-all"
          onClick={handleBulkDelete}
          disabled={selectedRecords.length === 0}
          title="Delete all selected records"
        >
          <FaTrash /> Delete Selected
        </button>
        <button
          className="px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl text-sm md:text-base flex items-center gap-2 hover:shadow-lg transition-all"
          onClick={() =>
            setShowColumns((prev) => ({ ...prev, show: !prev.show }))
          }
          title="Customize columns"
        >
          <FaColumns /> Columns
        </button>
      </div>
      {/* Pagination */}
      <div className="flex gap-2 items-center justify-center mb-6">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
        >
          First
        </button>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
        >
          Last
        </button>
      </div>
      {/* Details Modal */}
      {showDetails && detailsRecord && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetails(false)}
        >
          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-xl shadow-2xl w-full max-w-sm border ${darkMode ? 'border-amber-500/30' : 'border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex justify-between items-center mb-3 pb-2 border-b ${darkMode ? 'border-amber-500/30' : 'border-gray-200'}`}>
              <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Record Details
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className={`${darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} text-lg font-bold w-5 h-5 flex items-center justify-center rounded-full transition-colors`}
              >
                ×
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {Object.entries(detailsRecord).map(([field, value]) => (
                <div
                  key={field}
                  className={`flex items-center py-1.5 px-2 rounded-lg hover:transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                >
                  <span className={`font-medium capitalize text-xs min-w-20 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {field.replace(/_/g, " ")}
                  </span>
                  <span className={`text-xs ml-2 flex-1 break-words ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {String(value || "N/A")}
                  </span>
                </div>
              ))}
            </div>
            {/* Audit log placeholder: Backend required */}
            <div className={`mt-3 p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-amber-500/30' : 'bg-gray-50 border-gray-200'}`}>
              <span className={`font-medium text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                Audit Log:
              </span>
              <span className={`text-xs block mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                (Show who edited/deleted this record and when. Backend support
                required.)
              </span>
            </div>
            <div className={`flex justify-end mt-3 pt-2 border-t ${darkMode ? 'border-amber-500/30' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowDetails(false)}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9998]">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-3 rounded shadow-lg w-full max-w-xs`}>
            <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Record</h2>
            {Object.keys(editForm).length === 0 ? (
              <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} mb-4`}>
                No editable fields available for this record.
              </p>
            ) : (
              <>
                {["name", "phone", "congregation", "position"].map(
                  (field) =>
                    editForm[field] !== undefined && (
                      <div key={field} className="mb-3">
                        <label className={`block text-sm font-medium mb-1 capitalize ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {field.replace(/_/g, " ")}
                        </label>
                        <input
                          value={editForm[field] ?? ""}
                          onChange={(e) =>
                            handleEditChange(
                              field,
                              [
                                "name",
                                "congregation",
                                "position",
                                "type",
                                "reason",
                              ].includes(field)
                                ? capitalizeWords(e.target.value)
                                : e.target.value
                            )
                          }
                          className={`w-full border rounded px-3 py-2 ${darkMode ? 'dark:bg-gray-700 dark:text-white bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                        />
                      </div>
                    )
                )}
              </>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
              >
                <FaSave className="inline mr-1" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9998]">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded shadow-lg text-center`}>
            <p className={darkMode ? 'text-white' : 'text-gray-900'}>
              Are you sure you want to delete all records for{" "}
              <strong className={darkMode ? 'text-white' : 'text-gray-900'}>
                {deleteName}
              </strong>
              ?
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(null)} // PIN will be handled by PINModal
                className="px-4 py-2 bg-red-600 rounded text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Delete Confirmation Modal */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9998]">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded shadow-lg text-center`}>
            <p className={darkMode ? 'text-white' : 'text-gray-900'}>
              Are you sure you want to delete all selected records?
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmBulkDelete(null)} // PIN will be handled by PINModal
                className="px-4 py-2 bg-red-600 rounded text-white hover:bg-red-700"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Notes Modal */}
      {showNotesModal && notesRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded shadow-lg w-full max-w-md`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Notes for {notesRecord.name}
              </h2>
              <button
                onClick={() => setShowNotesModal(false)}
                className={`${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} text-xl font-bold`}
              >
                &times;
              </button>
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes:</label>
              {tagEditId === notesRecord.id ? (
                <div className="space-y-2">
                  <textarea
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className={`w-full border rounded px-3 py-2 h-24 ${darkMode ? 'dark:bg-gray-700 dark:text-white bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                    placeholder="Enter notes..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        saveTag(notesRecord.id);
                        setShowNotesModal(false);
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setTagEditId(null);
                        setTagInput("");
                      }}
                      className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className={`border rounded px-3 py-2 min-h-24 ${darkMode ? 'dark:bg-gray-700 dark:text-white bg-gray-700 text-white' : 'bg-white text-gray-900'}`}>
                    {notesRecord.notes || "No notes added yet."}
                  </div>
                  <button
                    onClick={() =>
                      handleTagEdit(notesRecord.id, notesRecord.notes || "")
                    }
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit Notes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      <PINModal
        isOpen={showPINModal}
        onClose={() => {
          setShowPINModal(false);
          setPendingAction(null);
          setPendingRecord(null);
        }}
        onSuccess={(pin) => {
          if (
            pendingAction === "delete" &&
            pendingRecord &&
            selectedRecords.length > 1
          )
            confirmBulkDelete(pin);
          else if (pendingAction === "delete" && pendingRecord)
            confirmDelete(pin);
          if (pendingAction === "edit") handleEditWithPIN(pendingRecord);
          setPendingAction(null);
          setPendingRecord(null);
          setShowPINModal(false); // Close the PIN modal
        }}
        title={
          pendingAction === "edit" ? "Enter PIN to Edit" : "Enter PIN to Delete"
        }
        message={
          pendingAction === "edit"
            ? "Please enter the 4-digit PIN to edit this record"
            : "Please enter the 4-digit PIN to delete this record"
        }
      />
    </div>
  );
}
