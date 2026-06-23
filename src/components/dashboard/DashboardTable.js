import React from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function DashboardTable({
  darkMode,
  groupedSummary,
  congregationColors,
  handleEdit,
  handleDelete,
  isApologyEntry
}) {
  return (
    <div className="overflow-x-auto custom-scrollbar mb-6 md:mb-10 max-w-full">
      {groupedSummary &&
      typeof groupedSummary === "object" &&
      Object.keys(groupedSummary).length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            No data available
          </div>
        </div>
      ) : (
        groupedSummary &&
        typeof groupedSummary === "object" &&
        Object.keys(groupedSummary).map((cong) => (
          <div
            key={cong}
            className={`w-full max-w-full mb-6 rounded-2xl shadow-lg border p-4 md:p-5 ${congregationColors[cong] || "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"}`}
          >
            <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{cong}</h3>
            {groupedSummary[cong] &&
              typeof groupedSummary[cong] === "object" &&
              Object.keys(groupedSummary[cong]).map((month) => (
                <div key={month} className="mb-4">
                  <h4 className="text-base font-semibold text-blue-700 dark:text-blue-300 mb-1">
                    {month}
                  </h4>
                  {groupedSummary[cong][month] &&
                    typeof groupedSummary[cong][month] === "object" &&
                    Object.keys(groupedSummary[cong][month]).map((day) => (
                      <div key={day} className="mb-2 pl-2 border-l-2 border-blue-300 dark:border-blue-600">
                        <div className="font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">
                          {day}
                        </div>
                        <div className="overflow-x-auto w-full">
                          <table className="min-w-max w-full text-gray-900 dark:text-gray-100 mb-2 border-collapse">
                            <thead
                              className={
                                darkMode
                                  ? "bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100"
                                  : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900"
                              }
                            >
                              <tr>
                                <th className="text-center px-3 md:px-4 py-3 border-r border-gray-300 dark:border-gray-600 text-xs md:text-sm font-semibold">
                                  Meeting
                                </th>
                                <th className="text-center px-3 md:px-4 py-3 border-r border-gray-300 dark:border-gray-600 text-xs md:text-sm font-semibold">
                                  Attendee(s)
                                </th>
                                <th className="px-3 md:px-4 py-3 border-r border-gray-300 dark:border-gray-600 text-xs md:text-sm font-semibold">
                                  Submitted Time
                                </th>
                                <th className="px-3 md:px-4 py-3 border-r border-gray-300 dark:border-gray-600 text-xs md:text-sm font-semibold">
                                  Status
                                </th>
                                <th className="px-3 md:px-4 py-3 border-r border-gray-300 dark:border-gray-600 text-xs md:text-sm font-semibold">
                                  Reason
                                </th>
                                <th className="text-center px-3 md:px-4 py-3 text-xs md:text-sm font-semibold">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(groupedSummary[cong][month][day]) &&
                                groupedSummary[cong][month][day].map((entry, i) => (
                                  <tr
                                    key={entry.id || i}
                                    className="text-sm md:text-base hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                  >
                                    <td className="border px-3 md:px-4 py-3 text-xs md:text-sm border-r border-gray-300 dark:border-gray-600 text-center">
                                      <div className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-300">
                                        {entry.meeting_title || "Unknown Meeting"}
                                      </div>
                                    </td>
                                    <td className="border px-3 md:px-4 py-3 text-xs md:text-sm border-r border-gray-300 dark:border-gray-600 text-center">
                                      <span className="font-bold">{entry.name}</span>
                                      <span className="text-gray-500 dark:text-gray-400"> ({entry.position})</span>
                                    </td>
                                    <td className="border px-3 md:px-4 py-3 space-y-1 border-r border-gray-300 dark:border-gray-600 text-center">
                                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                                        {entry.timestamp}
                                      </div>
                                    </td>
                                    <td className="border px-3 md:px-4 py-3 border-r border-gray-300 dark:border-gray-600 text-center">
                                      <div className="flex items-center gap-2 mb-1 justify-center">
                                        <span className="text-lg">
                                          {isApologyEntry(entry) ? (
                                            <FaTimesCircle className="text-red-500" />
                                          ) : (
                                            <FaCheckCircle className="text-green-500" />
                                          )}
                                        </span>
                                      </div>
                                    </td>
                                    {isApologyEntry(entry) ? (
                                      <td className="border px-3 md:px-4 py-3 text-xs md:text-sm border-r border-gray-300 dark:border-gray-600 text-center">
                                        <span className="text-gray-600 dark:text-gray-300">
                                          {entry.reason || "No reason provided"}
                                        </span>
                                      </td>
                                    ) : (
                                      <td className="border px-3 md:px-4 py-3 text-xs md:text-sm border-r border-gray-300 dark:border-gray-600 text-center">
                                        <span className="text-gray-400">-</span>
                                      </td>
                                    )}
                                    <td className="border px-3 md:px-4 py-3 text-center">
                                      <div className="flex gap-2 justify-center">
                                        <button
                                          onClick={() => handleEdit(entry.id)}
                                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDelete(entry.id)}
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
        ))
      )}
    </div>
  );
}
