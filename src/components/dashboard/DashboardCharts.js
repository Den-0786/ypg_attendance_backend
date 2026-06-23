import React from "react";
import YearEndChart from "./YearEndChart";
import MonthlyAttendanceTrendChart from "./MonthlyAttendanceTrendChart";
import AttendanceChart from "./AttendanceChart";
import { isApologyEntry } from "../../lib/dashboardHelpers";

export default function DashboardCharts({ filteredData, darkMode }) {
  const attendanceData = filteredData.filter((entry) => !isApologyEntry(entry));
  
  return (
    <>
      {/* Year-End Attendance Chart */}
      <div className="my-8 md:my-12">
        <YearEndChart
          attendanceData={attendanceData}
          darkMode={darkMode}
        />
      </div>

      {/* Monthly Attendance Trend Chart */}
      <MonthlyAttendanceTrendChart
        attendanceData={attendanceData}
        darkMode={darkMode}
      />

      {/* Monthly Attendance Chart */}
      <div className="my-8 md:my-12">
        <AttendanceChart
          attendanceData={attendanceData}
          darkMode={darkMode}
        />
      </div>
    </>
  );
}
