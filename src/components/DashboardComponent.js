"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaBars,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { cn } from "@lib/utils";
import toast from "react-hot-toast";
import MeetingTypePieChart from "./dashboard/MeetingTypePieChart";

const Sidebar = ({
  view,
  setView,
  darkMode,
  toggleDarkMode,
  handleLogout,
  isMobile,
  setShowSidebar,
}) => (
  <div
    className={cn(
      "fixed md:static z-50 h-screen w-64 p-4 border-r flex flex-col justify-between transition-transform duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white md:translate-x-0",
      isMobile ? "translate-x-0" : "-translate-x-full"
    )}
  >
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <button className="md:hidden" onClick={() => setShowSidebar(false)}>
          ✖
        </button>
      </div>
      <div className="space-y-2 mt-4">
        <button
          onClick={() => setView("local")}
          className={cn(
            "w-full text-left px-4 py-2 rounded",
            view === "local"
              ? "bg-blue-600 text-white"
              : "hover:bg-blue-100 dark:hover:bg-gray-800"
          )}
        >
          Local
        </button>
        <button
          onClick={() => setView("district")}
          className={cn(
            "w-full text-left px-4 py-2 rounded",
            view === "district"
              ? "bg-blue-600 text-white"
              : "hover:bg-blue-100 dark:hover:bg-gray-800"
          )}
        >
          District
        </button>
      </div>
    </div>
    <div className="space-y-3">
      <div>
        <button
          onClick={() => setView("changePassword")}
          className={cn(
            "w-full text-left px-4 py-2 rounded",
            view === "changePassword"
              ? "bg-blue-600 text-white"
              : "hover:bg-blue-300 dark:hover:bg-gray-800"
          )}
        >
          Change Password
        </button>
      </div>
      <button
        onClick={toggleDarkMode}
        className="w-full flex items-center justify-between px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
      >
        Toggle Mode {darkMode ? <FaMoon /> : <FaSun />}
      </button>
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-between px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Logout <FaSignOutAlt />
      </button>
    </div>
  </div>
);

export default function Dashboard({ onLogout }) {
  const [view, setView] = useState("local");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [attendanceData, setAttendanceData] = useState([]);
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedName, setSelectedName] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const fetchData = async () => {
    try {
      const endpoint =
        view === "local"
          ? "http://127.0.0.1:8000/api/local-attendance/"
          : "http://127.0.0.1:8000/api/district-attendance/";
      const res = await fetch(endpoint);
      const data = await res.json();
      setAttendanceData(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch attendance data");
      setAttendanceData([]);
    }
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("role");
    onLogout();
  };

  const confirmDelete = (id, name) => {
    setSelectedId(id);
    setSelectedName(name);
    setShowConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await fetch(
        `http://127.0.0.1:8000/api/delete-attendance/${selectedId}/`,
        {
          method: "DELETE",
        }
      );
      toast.success("Deleted successfully");
      setShowConfirm(false);
      fetchData();
    } catch (err) {
      toast.error("Delete failed");
    }
    console.log("Deleting ID:", selectedId);
  };

  const handleEdit = (id, name) => {
    setSelectedId(id);
    setSelectedName(name);
    setEditValue(name);
    setEditModal(true);
  };

  const handleEditSave = async () => {
    try {
      await fetch(`http://127.0.0.1:8000/api/edit-attendance/${selectedId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_congregation: editValue }),
      });
      toast.success("Updated successfully");
      setEditModal(false);
      fetchData();
    } catch (err) {
      toast.error("Update failed");
    }
    console.log("Editing ID:", selectedId, "New Name:", editValue);
  };

  const getAttendanceSummary = () => {
    const summary = {};
    attendanceData.forEach(({ id, congregation, timestamp }) => {
      if (!summary[congregation]) summary[congregation] = [];
      summary[congregation].push({ id, timestamp });
    });
    return summary;
  };

  const summary = getAttendanceSummary();
  const chartData = Object.entries(summary)
    .map(([name, entries]) => ({
      name,
      count: entries.length,
    }))
    .filter((data) => data.name.toLowerCase().includes(search.toLowerCase()));

  const renderCircles = (entries, name) => {
    const total = entries.length;
    const id = entries[0]?.id;

    return (
      <div className="flex gap-2 items-center">
        {[0, 1].map((i) => (
          <span key={i} className="text-lg">
            {i < total ? (
              <FaCheckCircle className="text-green-500" />
            ) : (
              <FaTimesCircle className="text-red-500" />
            )}
          </span>
        ))}
        <button
          onClick={() => handleEdit(id, name)}
          className="text-blue-500 hover:underline text-sm ml-2"
        >
          Edit
        </button>
        <button
          onClick={() => confirmDelete(id, name)}
          className="text-red-500 hover:underline text-sm"
        >
          Delete
        </button>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex min-h-screen relative",
        darkMode ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-900"
      )}
    >
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="text-2xl"
        >
          <FaBars />
        </button>
      </div>

      <Sidebar
        view={view}
        setView={setView}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
        isMobile={showSidebar}
        setShowSidebar={setShowSidebar}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        <div
          className={cn(
            "max-w-6xl mx-auto p-6 rounded-xl shadow-md",
            darkMode ? "bg-gray-800" : "bg-white"
          )}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 dark:text-white rounded shadow">
              <h3 className="text-sm font-semibold">Total Records</h3>
              <p className="text-xl font-bold">{attendanceData.length}</p>
            </div>
            <div className="p-4 bg-green-100 dark:bg-green-900 dark:text-white rounded shadow">
              <h3 className="text-sm font-semibold">Congregations Present</h3>
              <p className="text-xl font-bold">{Object.keys(summary).length}</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-lg font-bold">Attendance Dashboard</h1>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search congregation..."
              className="w-full max-w-xs border px-3 py-1 gap-2 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="overflow-x-auto mb-10">
            <table className="min-w-full border border-gray-300">
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-200"}>
                <tr>
                  <th className="text-left px-4 py-2 border">Congregation</th>
                  <th className="text-left px-4 py-2 border">
                    Submitted Time(s)
                  </th>
                  <th className="text-left px-4 py-2 border">
                    Presence Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {chartData.map(({ name }) => (
                  <tr key={name}>
                    <td className="border px-4 py-2">{name}</td>
                    <td className="border px-4 py-2 space-y-1">
                      {summary[name].map((entry, i) => (
                        <div key={i} className="text-sm">
                          {entry.timestamp}
                        </div>
                      ))}
                    </td>
                    <td className="border px-4 py-2">
                      {renderCircles(summary[name], name)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold mb-2">
            Year-End Attendance Summary
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 30, right: 40, left: 0, bottom: 30 }}
            >
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                stroke={darkMode ? "white" : "black"}
              />
              <YAxis
                allowDecimals={false}
                stroke={darkMode ? "white" : "black"}
              />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#4F46E5"
                animationDuration={500}
                barSize={chartData.length <= 4 ? 20 : 40}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="#4F46E5" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black text-white bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg text-center">
            <p>
              Are you sure you want to delete all records for{" "}
              <strong>{selectedName}</strong>?
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 rounded text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black text-white bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Edit Congregation Name</h2>
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4 dark:bg-gray-700 dark:text-white"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-blue-600 rounded text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
