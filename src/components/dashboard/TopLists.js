import React from "react";
import { 
  getTop3Congregations,
  getTop3Attendees,
  getUniquePeopleLessThan5,
  isApologyEntry
} from "../../lib/dashboardHelpers";

export default function TopLists({
  filteredData,
  selectedYear
}) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Top 3 Congregations */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-3">
            Top 3 Congregations
          </h3>
          {getTop3Congregations(
            filteredData.filter((entry) => !isApologyEntry(entry)),
            selectedYear
          ).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No data available
            </p>
          ) : (
            <div className="space-y-2">
              {getTop3Congregations(
                filteredData.filter((entry) => !isApologyEntry(entry)),
                selectedYear
              ).map(([congregation, count], idx) => (
                <div
                  key={congregation}
                  className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {idx + 1}. {congregation}
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 3 Attendees (5+ meetings) */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-3">
            Top 3 Attendees (5+ meetings)
          </h3>
          {getTop3Attendees(
            filteredData.filter((entry) => !isApologyEntry(entry)),
            selectedYear
          ).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No data available
            </p>
          ) : (
            <div className="space-y-2">
              {getTop3Attendees(
                filteredData.filter((entry) => !isApologyEntry(entry)),
                selectedYear
              ).map(([person, count], idx) => (
                <div
                  key={person}
                  className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {idx + 1}. {person}
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400 font-bold">
                    {count} meetings
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unique People (less than 5 meetings) */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-3">
            Unique People (&lt;5 meetings)
          </h3>
          {getUniquePeopleLessThan5(
            filteredData.filter((entry) => !isApologyEntry(entry)),
            selectedYear
          ).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No data available
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {getUniquePeopleLessThan5(
                filteredData.filter((entry) => !isApologyEntry(entry)),
                selectedYear
              ).map((person, idx) => (
                <div
                  key={person}
                  className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {idx + 1}. {person}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
