import React, { useState, useEffect } from "react";
import YearEndChart from "./YearEndChart";
import MonthlyAttendanceTrendChart from "./MonthlyAttendanceTrendChart";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import AttendanceForm from "../forms/AttendanceForm";
import ApologyForm from "../forms/ApologyForm";
import toast from "react-hot-toast";
import { capitalizeFirst, toTitleCase } from "../../lib/utils";
import { 
  isApologyEntry, 
  getLocalProgress, 
  getDistrictProgress, 
  getGrandTotalProgress,
  getUniquePeopleLessThan5,
  getTop3Attendees,
  getTop3Congregations
} from "../../lib/dashboardHelpers";
import PINModal from "../auth/PINModal";
import AttendanceChart from "./AttendanceChart";
import { useMemo } from "react";
import SearchBar from "../ui/inputs/SearchBar";
import FilterButtons from "../ui/FilterButtons";
import ProgressCards from "./ProgressCards";
import DashboardStats from "./DashboardStats";
import DashboardTable from "./DashboardTable";
import TopLists from "./TopLists";
import DashboardCharts from "./DashboardCharts";
import DashboardModals from "./DashboardModals";
import AdminCredentialsModal from "./AdminCredentialsModal";
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

// Add capitalizeWords function
function capitalizeWords(str) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Color palette for cards
const cardColors = [
  "bg-blue-50 dark:bg-blue-900",
  "bg-green-50 dark:bg-green-900",
  "bg-yellow-50 dark:bg-yellow-900",
  "bg-purple-50 dark:bg-purple-900",
  "bg-pink-50 dark:bg-pink-900",
  "bg-orange-50 dark:bg-orange-900",
  "bg-teal-50 dark:bg-teal-900",
  "bg-indigo-50 dark:bg-indigo-900",
  "bg-red-50 dark:bg-red-900",
];

const API_URL = BASE_URL;

export default function DashboardHome({
  attendanceData = [],
  apologyData = [],
  darkMode = false,
  currentYear,
  onEdit,
  onDelete,
  refetchAttendanceData,
  refetchApologyData,
}) {
  // Move all hooks to the top
  const [search, setSearch] = useState("");
  const [showType, setShowType] = useState("all"); // 'all' | 'attendance' | 'apology'
  const [editModal, setEditModal] = useState({ open: false, entry: null });
  const [showPINModal, setShowPINModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingEntry, setPendingEntry] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Default to current year
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [showApologyForm, setShowApologyForm] = useState(false);
  // Add state for admin credentials modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [pendingUndoApology, setPendingUndoApology] = useState(null);
  const [pendingEditApology, setPendingEditApology] = useState(null);

  // Get unique years from attendance data
  const getUniqueYears = (data) => {
    if (!Array.isArray(data)) return [];
    const years = new Set();
    data.forEach((entry) => {
      if (entry.meeting_date) {
        const year = new Date(entry.meeting_date).getFullYear();
        years.add(year);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceData]);

  // Combine attendance and apology data for processing
  const combinedData = [...attendanceData, ...apologyData];

  // Add a helper function to identify apology entries
  const isApologyEntry = (entry) => {
    // Check if entry has apology-specific fields
    return (
      entry &&
      (entry.reason ||
        entry.type === "apology" ||
        entry.record_kind === "apology")
    );
  };

  // Filter combined data by selected year
  const filteredData = combinedData.filter((entry) => {
    if (!entry.meeting_date) return false;

    // Ensure selectedYear has a valid value, default to current year
    const yearToFilter = selectedYear || new Date().getFullYear();

    const entryYear = new Date(entry.meeting_date).getFullYear();
    return entryYear === yearToFilter;
  });

  // Debug logging
  useEffect(() => {
    // Debug logging removed for production
  }, [attendanceData, apologyData, combinedData, selectedYear, filteredData]);

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
    window.addEventListener("attendanceDataChanged", handleDataChange);
    window.addEventListener("apologyDataChanged", handleDataChange);

    return () => {
      window.removeEventListener("attendanceDataChanged", handleDataChange);
      window.removeEventListener("apologyDataChanged", handleDataChange);
    };
  }, [refetchAttendanceData, refetchApologyData]);

  // Update selectedYear when currentYear prop changes
  useEffect(() => {
    if (currentYear && currentYear !== selectedYear) {
      setSelectedYear(currentYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear]);

  // Additional safety check
  if (!Array.isArray(attendanceData)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="text-red-600">Error: Invalid data format</div>
      </div>
    );
  }

  // Compute summary from filteredData (year-filtered)
  const summary = {};
  // Ensure filteredData is an array before using forEach
  if (Array.isArray(filteredData)) {
    filteredData.forEach((entry) => {
      // Filter by showType
      if (showType === "attendance" && isApologyEntry(entry)) return;
      if (showType === "apology" && !isApologyEntry(entry)) return;
      // Only add to summary if local
      if (entry.type === "local") {
        if (!summary[entry.congregation]) {
          summary[entry.congregation] = [];
        }
        summary[entry.congregation].push(entry);
      }
    });
  }

  // Compute yearEndData from filteredData (meetings in the selected year, only local)
  const yearEndData = filteredData.filter((entry) => {
    return entry.type === "local";
  });

  // Calculate unique meeting dates for the selected year (local only)
  const uniqueMeetingDates = new Set();
  filteredData.forEach((entry) => {
    if (entry.type === "local") {
      uniqueMeetingDates.add(entry.meeting_date);
    }
  });
  const totalMeetingsCount = uniqueMeetingDates.size;

  // Calculate all congregations present (both local and district) for selected year
  const allCongregations = new Set();
  filteredData.forEach((entry) => {
    if (entry.congregation) {
      allCongregations.add(entry.congregation);
    }
  });
  const totalCongregationsCount = allCongregations.size;

  // Show all entries in the table, grouped by congregation
  const filteredSummary = Object.keys(summary)
    .filter((name) => {
      const searchLower = search.toLowerCase();
      // Check congregation name
      if (name.toLowerCase().includes(searchLower)) return true;
      // Check if any attendee name or position matches
      return summary[name].some(
        (entry) =>
          (entry.name || "").toLowerCase().includes(searchLower) ||
          (entry.position || "").toLowerCase().includes(searchLower)
      );
    })
    .reduce((acc, name) => {
      acc[name] = summary[name];
      return acc;
    }, {});

  // Group summary by congregation, then by month, then by day
  const groupedSummary = {};
  if (Array.isArray(filteredData)) {
    filteredData.forEach((entry) => {
      // Filter by showType
      if (showType === "attendance" && isApologyEntry(entry)) return;
      if (showType === "apology" && !isApologyEntry(entry)) return;
      // Only add to summary if local
      if (entry.type === "local") {
        const cong = entry.congregation;
        const dateObj = new Date(entry.meeting_date);
        const monthKey = dateObj.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        const dayKey = dateObj.toLocaleDateString();
        if (!groupedSummary[cong]) groupedSummary[cong] = {};
        if (!groupedSummary[cong][monthKey])
          groupedSummary[cong][monthKey] = {};
        if (!groupedSummary[cong][monthKey][dayKey])
          groupedSummary[cong][monthKey][dayKey] = [];
        groupedSummary[cong][monthKey][dayKey].push(entry);
      }
    });
  }

  // Handler for deleting an entry (custom confirmation)
  const handleDelete = (entryId) => {
    // Find the entry object from the combined data
    const entry = [...attendanceData, ...apologyData].find(
      (e) => e.id === entryId
    );
    if (entry) {
      setPendingAction("delete");
      setPendingEntry(entry);
      setShowPINModal(true);
    } else {
      toast.error("Entry not found");
    }
  };

  const handleDeleteWithPIN = async (entry, pin) => {
    const isApology = isApologyEntry(entry);
    // Send PIN in request body, not query string (security fix)
    const endpoint = isApology
      ? `${API_URL}/api/delete-apology/${entry.id}`
      : `${API_URL}/api/delete-attendance/${entry.id}`;
    toast.custom(
      (t) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-red-400 max-w-xs mx-auto flex flex-col items-center">
          <div className="text-lg font-bold text-red-600 mb-2">
            Confirm Delete
          </div>
          <div className="text-gray-700 dark:text-gray-200 mb-4">
            Are you sure you want to delete this entry?
          </div>
          <div className="flex gap-3">
            <button
              className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const token = localStorage.getItem("access_token");
                  const res = await fetch(endpoint, {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: token ? `Bearer ${token}` : undefined,
                    },
                    body: JSON.stringify({ pin }),
                  });
                  if (res.ok) {
                    toast.success("Entry deleted successfully");
                    if (refetchAttendanceData) refetchAttendanceData();
                    if (refetchApologyData) refetchApologyData();
                    window.dispatchEvent(
                      new CustomEvent("attendanceDataChanged")
                    );
                    window.dispatchEvent(new CustomEvent("apologyDataChanged"));
                  } else {
                    const errorData = await res
                      .json()
                      .catch(() => ({ error: "Unknown error" }));
                    toast.error(
                      `Failed to delete entry: ${errorData.error || res.statusText}`
                    );
                  }
                } catch (err) {
                  toast.error("Network error");
                }
              }}
            >
              Yes, Delete
            </button>
            <button
              className="bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  // Handler for editing an entry (show modal)
  const handleEdit = (entryId) => {
    // Find the entry object from the combined data
    const entry = [...attendanceData, ...apologyData].find(
      (e) => e.id === entryId
    );
    if (entry) {
      setPendingAction("edit");
      setPendingEntry(entry);
      setShowPINModal(true);
    } else {
      toast.error("Entry not found");
    }
  };

  const handleEditWithPIN = async (entry, pin) => {
    if (entry) {
      setEditModal({ open: true, entry: { ...entry, pin } });
    } else {
      toast.error("Entry not found");
    }
  };

  // PIN success handler
  const handlePINSuccess = (pin) => {
    if (pendingAction === "edit" && pendingEntry) {
      handleEditWithPIN(pendingEntry, pin);
    } else if (pendingAction === "delete" && pendingEntry) {
      handleDeleteWithPIN(pendingEntry, pin);
    } else if (pendingAction === "clear_all") {
      handleClearAllDataWithPIN(pin);
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
    const token = localStorage.getItem("access_token");
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      body: JSON.stringify({
        ...updatedEntry,
        pin: updatedEntry.pin,
      }),
    });
    if (res.ok) {
      toast.success("Entry updated successfully");
      setEditModal({ open: false, entry: null });
      if (refetchAttendanceData) refetchAttendanceData();
      if (refetchApologyData) refetchApologyData();
      window.dispatchEvent(new CustomEvent("attendanceDataChanged"));
    } else {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Unknown error" }));
      toast.error(
        `Failed to update entry: ${errorData.error || res.statusText}`
      );
    }
  };

  // Add clear all data function
  const handleClearAllData = () => {
    setPendingAction("clear_all");
    setShowPINModal(true);
  };

  const handleClearAllDataWithPIN = async (pin) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/api/clear-all-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success("All data cleared successfully");
        if (refetchAttendanceData) refetchAttendanceData();
        if (refetchApologyData) refetchApologyData();
      } else {
        const errorData = await res.text();
        toast.error(`Failed to clear data: ${errorData}`);
      }
    } catch (err) {
      console.error("Error in clear all data:", err);
      toast.error("Failed to clear data");
    }
  };

  const isMobile = useIsMobile();

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

  // Progress calculations for cards
  const localProgress = useMemo(
    () => getLocalProgress(attendanceData, selectedYear),
    [attendanceData, selectedYear]
  );
  const districtProgress = useMemo(
    () => getDistrictProgress(attendanceData, selectedYear),
    [attendanceData, selectedYear]
  );
  return (
    <div>
      <ProgressCards localProgress={localProgress} districtProgress={districtProgress} selectedYear={selectedYear} darkMode={darkMode} />
      <DashboardStats
        filteredData={filteredData}
        totalCongregationsCount={totalCongregationsCount}
        totalMeetingsCount={totalMeetingsCount}
        selectedYear={selectedYear}
        darkMode={darkMode}
      />
      {/* Search Bar and Attendance/Apology Buttons */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 space-y-3 md:space-y-0">
        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          All Attendance & Apologies
        </h1>
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search congregation..."
        />
      </div>
      <FilterButtons showType={showType} setShowType={setShowType} />

      <DashboardTable
        darkMode={darkMode}
        groupedSummary={groupedSummary}
        congregationColors={congregationColors}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
      <div>
        <button
          onClick={handleClearAllData}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-semibold mt-2 md:mt-0 md:ml-8"
          title="Clear all attendance and apology data"
        >
          Clear All Data
        </button>
      </div>
      <DashboardCharts
        filteredData={filteredData}
        darkMode={darkMode}
      />

      <TopLists
        filteredData={filteredData}
        selectedYear={selectedYear}
        darkMode={darkMode}
      />

      <DashboardModals
        editModal={editModal}
        setEditModal={setEditModal}
        handleSaveEdit={handleSaveEdit}
        capitalizeWords={capitalizeWords}
        showAttendanceForm={showAttendanceForm}
        setShowAttendanceForm={setShowAttendanceForm}
        showApologyForm={showApologyForm}
        setShowApologyForm={setShowApologyForm}
        showPINModal={showPINModal}
        setShowPINModal={setShowPINModal}
        pendingAction={pendingAction}
        setPendingAction={setPendingAction}
        pendingEntry={pendingEntry}
        setPendingEntry={setPendingEntry}
        handlePINSuccess={handlePINSuccess}
        darkMode={darkMode}
      />

      <AdminCredentialsModal
        showAdminModal={showAdminModal}
        adminUsername={adminUsername}
        setAdminUsername={setAdminUsername}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        pendingUndoApology={pendingUndoApology}
        setPendingUndoApology={setPendingUndoApology}
        pendingEditApology={pendingEditApology}
        setPendingEditApology={setPendingEditApology}
        API_URL={API_URL}
        refetchApologyData={refetchApologyData}
        setShowAdminModal={setShowAdminModal}
      />
    </div>
  );
}
