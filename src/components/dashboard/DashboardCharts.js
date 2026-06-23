import React from "react";
import YearEndChart from "./YearEndChart";
import MonthlyAttendanceTrendChart from "./MonthlyAttendanceTrendChart";
import AttendanceChart from "./AttendanceChart";

export default function DashboardCharts({ filteredData, darkMode, isApologyEntry }) {
  return (
    <>
      {/* Year-End Attendance Chart */}
      <div className="my-8 md:my-12">
        <YearEndChart
          attendanceData={filteredData.filter(
            (entry) => !isApologyEntry(entry)
          )}
          darkMode={darkMode}
        />
      </div>

      {/* Monthly Attendance Trend Chart */}
      <MonthlyAttendanceTrendChart
        attendanceData={filteredData.filter((entry) => !isApologyEntry(entry))}
        darkMode={darkMode}
      />

      {/* Monthly Attendance Chart */}
      <div className="my-8 md:my-12">
        <AttendanceChart
          attendanceData={filteredData.filter(
            (entry) => !isApologyEntry(entry)
          )}
          darkMode={darkMode}
        />
      </div>
    </>
  );
}
