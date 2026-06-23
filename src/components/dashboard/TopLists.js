import React from "react";
import { 
  getTop3Congregations,
  getTop3Attendees,
  getUniquePeopleLessThan5,
  isApologyEntry
} from "../../lib/dashboardHelpers";

export default function TopLists({
  filteredData,
  selectedYear,
  darkMode = false
}) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Top 3 Congregations */}
        <div className={`p-4 rounded-lg shadow border ${darkMode ? 'bg-gray-800 border-amber-500/30' : 'bg-white border-gray-300'}`}>
          <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
            Top 3 Congregations
          </h3>
          {getTop3Congregations(
            filteredData.filter((entry) => !isApologyEntry(entry)),
            selectedYear
          ).length === 0 ? (
            <p className={darkMode ? 'text-gray-500' : 'text-gray-600'}>
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
                  className={`flex justify-between items-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {idx + 1}. {congregation}
                  </span>
                  <span className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 3 Attendees (5+ meetings) */}
        <div className={`p-4 rounded-lg shadow border ${darkMode ? 'bg-gray-800 border-amber-500/30' : 'bg-white border-gray-300'}`}>
          <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
            Top 3 Attendees (5+ meetings)
          </h3>
          {getTop3Attendees(
            filteredData.filter((entry) => !isApologyEntry(entry)),
            selectedYear
          ).length === 0 ? (
            <p className={darkMode ? 'text-gray-500' : 'text-gray-600'}>
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
                  className={`flex justify-between items-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {idx + 1}. {person}
                  </span>
                  <span className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                    {count} meetings
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unique People (less than 5 meetings) */}
        <div className={`p-4 rounded-lg shadow border ${darkMode ? 'bg-gray-800 border-amber-500/30' : 'bg-white border-gray-300'}`}>
          <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
            Unique People (&lt;5 meetings)
          </h3>
          {getUniquePeopleLessThan5(
            filteredData.filter((entry) => !isApologyEntry(entry)),
            selectedYear
          ).length === 0 ? (
            <p className={darkMode ? 'text-gray-500' : 'text-gray-600'}>
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
                  className={`flex justify-between items-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
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
