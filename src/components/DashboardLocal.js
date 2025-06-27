import React, { useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import MonthlyAttendanceGrid from "./dashboard/MonthlyAttendanceGrid";

export default function DashboardLocal({
  attendanceData = [],
  darkMode = false,
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState("");

  // Filter only local congregation entries
  const summary = {};
  attendanceData.forEach((entry) => {
    if (entry.type !== "district") {
      if (!summary[entry.congregation]) {
        summary[entry.congregation] = [];
      }
      summary[entry.congregation].push(entry);
    }
  });

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
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Attendance</button>
        <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Apology</button>
      </div>
      
      {/* Table of Local Congregations */}
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
              .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
              .map((name) => (
                <tr key={name}>
                  <td className="border px-2 md:px-4 py-2">
                    {summary[name].map((entry, i) => (
                      <div key={i} className="text-xs md:text-sm font-medium text-blue-600">
                        {entry.meeting_title || "Unknown Meeting"}
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
                    <div className="flex gap-2 items-center">
                      {[0, 1].map((i) => (
                        <span key={i} className="text-lg">
                          {i < summary[name].length ? (
                            <FaCheckCircle className="text-green-500" />
                          ) : (
                            <FaTimesCircle className="text-red-500" />
                          )}
                        </span>
                      ))}
                      <button
                        onClick={() => onEdit(summary[name][0]?.id, name)}
                        className="text-blue-500 hover:underline text-sm ml-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(summary[name][0]?.id, name)}
                        className="text-red-500 hover:underline text-sm"
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
      {/* Monthly Attendance Grid */}
      <div className="my-8 md:my-12">
        <MonthlyAttendanceGrid attendanceData={attendanceData} darkMode={darkMode} />
      </div>
    </div>
  );
} 