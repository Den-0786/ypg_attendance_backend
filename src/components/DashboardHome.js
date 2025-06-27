import React, { useState } from "react";
import YearEndChart from "./dashboard/YearEndChart";
import MonthlyAttendanceTrendChart from "./dashboard/MonthlyAttendanceTrendChart";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

// Helper functions for progress calculations
function getLocalProgress(attendanceData) {
  const currentYear = new Date().getFullYear();
  const congregationsWithAttendance = new Set();
  attendanceData.forEach(entry => {
    const date = new Date(entry.meeting_date);
    if (date.getFullYear() === currentYear && entry.type !== 'district') {
      congregationsWithAttendance.add(entry.congregation);
    }
  });
  const totalCongregations = 9;
  const progress = (congregationsWithAttendance.size / totalCongregations) * 100;
  return Math.round(progress);
}

function getDistrictProgress(attendanceData) {
  const currentYear = new Date().getFullYear();
  const positionsWithAttendance = new Set();
  attendanceData.forEach(entry => {
    const date = new Date(entry.meeting_date);
    if (date.getFullYear() === currentYear && entry.type === 'district') {
      positionsWithAttendance.add(entry.position);
    }
  });
  const totalPositions = 8;
  const progress = (positionsWithAttendance.size / totalPositions) * 100;
  return Math.round(progress);
}

function getGrandTotalProgress(attendanceData) {
  const currentYear = new Date().getFullYear();
  const entitiesWithAttendance = new Set();
  attendanceData.forEach(entry => {
    const date = new Date(entry.meeting_date);
    if (date.getFullYear() === currentYear) {
      if (entry.type === 'district') {
        entitiesWithAttendance.add(`district_${entry.position}`);
      } else {
        entitiesWithAttendance.add(`local_${entry.congregation}`);
      }
    }
  });
  const totalEntities = 17;
  const progress = (entitiesWithAttendance.size / totalEntities) * 100;
  return Math.round(progress);
}

export default function DashboardHome({
  attendanceData = [],
  darkMode = false,
  yearEndData = [],
  summary = {},
  leaderboard = [],
  uniquePeople = [],
  getTopCongregations,
  currentYear,
  previousYearAttendanceData = [],
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState("");

  // Show all entries in the table, grouped by congregation
  const filteredSummary = Object.keys(summary)
    .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
    .reduce((acc, name) => {
      acc[name] = summary[name];
      return acc;
    }, {});

  return (
    <div>
      
      {/* Dashboard Summary Cards */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
            <h3 className="text-xs md:text-sm font-semibold text-blue-700 dark:text-blue-300">Total Records</h3>
            <p className="text-lg md:text-xl font-bold text-blue-900 dark:text-blue-100">{attendanceData.length}</p>
          </div>
          <div className="p-3 md:p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg shadow-sm">
            <h3 className="text-xs md:text-sm font-semibold text-green-700 dark:text-green-300">Congregations Present</h3>
            <p className="text-lg md:text-xl font-bold text-green-900 dark:text-green-100">{Object.keys(summary).length}</p>
          </div>
          <div className="p-3 md:p-4 bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-800 rounded-lg shadow-sm">
            <h3 className="text-xs md:text-sm font-semibold text-purple-700 dark:text-purple-300">Total Meetings</h3>
            <p className="text-lg md:text-xl font-bold text-purple-900 dark:text-purple-100">{yearEndData.length}</p>
          </div>
          <div className="p-3 md:p-4 bg-amber-50 dark:bg-orange-900 border border-amber-200 dark:border-orange-800 rounded-lg shadow-sm">
            <h3 className="text-xs md:text-sm font-semibold text-amber-700 dark:text-orange-300">Grand Total Progress</h3>
            <p className="text-lg md:text-xl font-bold text-amber-900 dark:text-orange-100">{getGrandTotalProgress(attendanceData)}%</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-200 dark:border-blue-700 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm md:text-base font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  Local Congregations Progress
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Yearly Progress: {getLocalProgress(attendanceData)}%
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Current Year: {new Date().getFullYear()}
                </p>
              </div>
              <div className="relative w-20 h-20 md:w-24 md:h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    className="text-blue-200 dark:text-blue-700"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Yearly progress circle */}
                  <path
                    className="text-blue-500 dark:text-blue-400"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${getLocalProgress(attendanceData)} 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm md:text-base font-bold text-blue-700 dark:text-blue-300">
                    {getLocalProgress(attendanceData)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border border-green-200 dark:border-green-700 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm md:text-base font-semibold text-green-700 dark:text-green-300 mb-2">
                  District Executives Progress
                </h3>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Yearly Progress: {getDistrictProgress(attendanceData)}%
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Current Year: {new Date().getFullYear()}
                </p>
              </div>
              <div className="relative w-20 h-20 md:w-24 md:h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    className="text-green-200 dark:text-green-700"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Yearly progress circle */}
                  <path
                    className="text-green-500 dark:text-green-400"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${getDistrictProgress(attendanceData)} 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm md:text-base font-bold text-green-700 dark:text-green-300">
                    {getDistrictProgress(attendanceData)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Performance Categories Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(() => {
          // Calculate attendance rate per congregation for the current year
          const currentYear = new Date().getFullYear();
          const congregationAttendance = {};
          attendanceData.forEach(entry => {
            const date = new Date(entry.meeting_date);
            if (date.getFullYear() === currentYear && entry.type !== 'district') {
              if (!congregationAttendance[entry.congregation]) {
                congregationAttendance[entry.congregation] = 0;
              }
              congregationAttendance[entry.congregation] += 1;
            }
          });
          // Assume 2 meetings per month, 12 months
          const totalPossible = 2 * 12;
          const categories = { excellent: 0, good: 0, needsImprovement: 0 };
          Object.values(congregationAttendance).forEach(count => {
            const rate = (count / totalPossible) * 100;
            if (rate >= 90) categories.excellent += 1;
            else if (rate >= 70) categories.good += 1;
            else categories.needsImprovement += 1;
          });
          return (
            <>
              <div className="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-xl shadow-sm flex flex-col items-center">
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">{categories.excellent}</span>
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">Excellent (90%+)</span>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-xl shadow-sm flex flex-col items-center">
                <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{categories.good}</span>
                <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Good (70-89%)</span>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-xl shadow-sm flex flex-col items-center">
                <span className="text-2xl font-bold text-red-700 dark:text-red-300">{categories.needsImprovement}</span>
                <span className="text-sm font-semibold text-red-700 dark:text-red-300">Needs Improvement (- 69%)</span>
              </div>
            </>
          );
        })()}
      </div>
      {/* Search Bar and Attendance/Apology Buttons */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 space-y-3 md:space-y-0">
        <h1 className="text-lg md:text-xl font-bold">All Attendance & Apologies</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search congregation..."
          className="w-full md:max-w-xs border px-3 py-2 rounded-md dark:bg-gray-700 dark:text-white text-sm md:text-base"
        />
      </div>
      <div className="flex gap-4 mb-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Attendance</button>
        <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Apology</button>
      </div>
      {/* Table of All Attendance/Apology Records */}
      <div className="overflow-x-auto custom-scrollbar mb-6 md:mb-10">
        <table className="min-w-full border border-gray-300">
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-200"}>
            <tr>
              <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Meeting</th>
              <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Congregation/Executive</th>
              <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Submitted Time(s)</th>
              <th className="text-left px-2 md:px-4 py-2 border text-xs md:text-sm">Presence Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(filteredSummary).map((name) => (
              <tr key={name}>
                <td className="border px-2 md:px-4 py-2">
                  {filteredSummary[name].map((entry, i) => (
                    <div key={i} className={`text-xs md:text-sm font-medium ${entry.type === 'district' ? 'text-green-600' : 'text-blue-600'}`}>
                      {entry.meeting_title || "Unknown Meeting"}
                    </div>
                  ))}
                </td>
                <td className="border px-2 md:px-4 py-2 text-xs md:text-sm">{name}</td>
                <td className="border px-2 md:px-4 py-2 space-y-1">
                  {filteredSummary[name].map((entry, i) => (
                    <div key={i} className="text-xs md:text-sm">
                      {entry.timestamp}
                    </div>
                  ))}
                </td>
                <td className="border px-2 md:px-4 py-2">
                  <div className="flex gap-2 items-center">
                    {[0, 1].map((i) => (
                      <span key={i} className="text-lg">
                        {i < filteredSummary[name].length ? (
                          <FaCheckCircle className="text-green-500" />
                        ) : (
                          <FaTimesCircle className="text-red-500" />
                        )}
                      </span>
                    ))}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(filteredSummary[name][0]?.id, name)}
                        className="text-blue-500 hover:underline text-sm ml-2"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(filteredSummary[name][0]?.id, name)}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Year-End Attendance Chart */}
      <div className="my-8 md:my-12">
        <YearEndChart attendanceData={attendanceData} darkMode={darkMode} />
      </div>

      {/* Top Congregations and Attendees */}
      <div className="mb-6">
        <div className="font-bold text-purple-700 mb-1">
          Top 3 Congregations: {getTopCongregations(attendanceData, currentYear).length === 0 ? 'No data' : (
            getTopCongregations(attendanceData, currentYear).map(([cong, count], idx) => (
              <span key={cong} className="inline-block mr-3">
                {idx + 1}. {cong} ({count} times)
              </span>
            ))
          )}
        </div>
        <div className="font-bold text-green-700 mb-1">
          Top 3 Attendees: {leaderboard.length === 0 ? 'No data' : (
            leaderboard.slice(0, 3).map(([person, count], idx) => (
              <span key={person} className="inline-block mr-3">
                {idx + 1}. {person} ({count} times)
              </span>
            ))
          )}
        </div>
        <p className="mb-2 text-blue-700 font-semibold">
          Unique People Attended This Year: {uniquePeople.length}
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-[300px] border border-gray-300 rounded-lg">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Attendance Count</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(([person, count]) => (
                <tr key={person}>
                  <td className="border px-3 py-1">{person}</td>
                  <td className="border px-3 py-1">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Attendance Trend Chart */}
      <MonthlyAttendanceTrendChart
        attendanceData={attendanceData}
        previousYearData={previousYearAttendanceData}
        darkMode={darkMode}
      />
    </div>
  );
} 