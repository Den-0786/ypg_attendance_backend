/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useEffect } from "react";
import { FaUsers } from "react-icons/fa";
import CustomAreaChart from '../charts/CustomAreaChart';

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const positionsList = [
  "President",
  "President's Rep",
  "Secretary",
  "Assistant Secretary",
  "Financial Secretary",
  "Treasurer",
  "Organizer",
  "Bible Studies Coordinator",
];

export default function DistrictExecutiveChart({ attendanceData, darkMode }) {
  const [chartData, setChartData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    extractAvailableYears();
    processData();
  }, [attendanceData, selectedYear]);

  const extractAvailableYears = () => {
    const years = new Set();
    const currentYear = new Date().getFullYear();

    years.add(currentYear);

    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach((entry) => {
        const date = new Date(entry.meeting_date);
        years.add(date.getFullYear());
      });
    }

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    setAvailableYears(sortedYears);

    if (!selectedYear || !sortedYears.includes(selectedYear)) {
      setSelectedYear(currentYear);
    }
  };

  const processData = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const positionMap = new Map();

    positionsList.forEach((position) => {
      positionMap.set(position, Array(12).fill(0));
    });

    attendanceData.forEach((entry) => {
      const date = new Date(entry.meeting_date);
      if (date.getFullYear() === selectedYear && entry.type === "district") {
        const position = entry.position;
        const month = date.getMonth();

        if (positionMap.has(position)) {
          positionMap.get(position)[month]++;
        }
      }
    });

    // Only show months up to current month
    const monthsToShow = months.slice(0, currentMonth + 1);
    
    const data = positionsList.map((position) => {
      const monthlyData = positionMap.get(position);
      // Only include months up to current month
      const monthlyDataToShow = monthlyData.slice(0, currentMonth + 1);
      const totalMeetings = monthlyDataToShow.reduce((sum, count) => sum + count, 0);
      const attendanceRate = (
        (monthlyDataToShow.filter((count) => count > 0).length / monthsToShow.length) *
        100
      ).toFixed(1);

      return {
        position: position,
        totalMeetings: totalMeetings,
        attendanceRate: attendanceRate,
        monthlyAttendance: monthlyData,
      };
    });

    data.sort(
      (a, b) => parseFloat(b.attendanceRate) - parseFloat(a.attendanceRate)
    );

    if (
      attendanceData?.filter((e) => e.type === "district").length > 0 ||
      chartData.length === 0
    ) {
      setChartData(data);
    }
  };

  const exportData = () => {
    const csvContent = [
      [
        "Position",
        "Total Meetings",
        "Attendance Rate (%)",
        ...months,
      ],
      ...chartData.map((data) => {
        return [
          data.position,
          data.totalMeetings,
          data.attendanceRate,
          ...data.monthlyAttendance,
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `district_executives_attendance_${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!chartData.length) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-4 md:p-6 border ${darkMode ? 'border-amber-500/30' : 'border-gray-200'}`}>
        <div className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-center`}>
          <p>Loading district executives...</p>
        </div>
      </div>
    );
  }

  const totalMeetings = chartData.reduce((sum, data) => sum + data.totalMeetings, 0);
  const avgAttendanceRate = (
    chartData.reduce((sum, data) => sum + parseFloat(data.attendanceRate), 0) /
    chartData.length
  ).toFixed(1);

  // Only show months up to current month
  const currentMonth = new Date().getMonth();
  const monthsToShow = months.slice(0, currentMonth + 1);
  
  // Prepare data for Area Chart - only show months up to current month
  const chartDataForGraph = monthsToShow.map((month, index) => {
    const dataPoint = { name: month };
    chartData.forEach(positionData => {
      const shortName = positionData.position.split(' ').slice(0, 2).join(' ');
      dataPoint[shortName] = positionData.monthlyAttendance[index];
    });
    return dataPoint;
  });

  // Configure series with orange/amber colors
  const seriesConfig = chartData.map((data, index) => {
    const shortName = data.position.split(' ').slice(0, 2).join(' ');
    const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fed7aa', '#f59e0b', '#fbbf24', '#fcd34d'];
    return {
      dataKey: shortName,
      label: shortName,
      color: colors[index % colors.length],
      showChange: false,
    };
  });

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-4 md:p-6 border ${darkMode ? 'border-amber-500/30' : 'border-gray-200'}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <h2 className={`text-lg md:text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-amber-400' : 'text-gray-900'}`}>
          <FaUsers className={darkMode ? 'text-amber-400' : 'text-amber-600'} />
          District Executive Attendance Analytics
        </h2>

        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <label className="text-sm flex items-center gap-2">
            <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Year:</span>
            <select
              value={selectedYear || ""}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={`px-3 py-2 border-2 rounded-xl ${darkMode ? 'bg-gray-700 border-amber-500/30 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500'} transition-all`}
            >
              {Array.isArray(availableYears) &&
                availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
            </select>
          </label>
          {chartData.length > 0 && (
            <button
              onClick={exportData}
              className="px-3 py-1 text-sm border rounded-md transition-colors bg-gray-700 border-amber-500/50 text-white hover:bg-gray-600 hover:border-amber-500"
              title="Export to CSV"
            >
              📊 Export
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg border ${darkMode ? 'border-amber-500/30' : 'border-gray-200'}`}>
          <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{chartData.length}</div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Positions</div>
        </div>
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg border ${darkMode ? 'border-amber-500/30' : 'border-gray-200'}`}>
          <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalMeetings}</div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Meetings</div>
        </div>
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg border ${darkMode ? 'border-amber-500/30' : 'border-gray-200'}`}>
          <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{avgAttendanceRate}%</div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Attendance Rate</div>
        </div>
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg border ${darkMode ? 'border-amber-500/30' : 'border-gray-200'}`}>
          <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {chartData.filter((data) => parseFloat(data.attendanceRate) === 100).length}
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Perfect Attendance</div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="mb-6">
        <CustomAreaChart
          data={chartDataForGraph}
          seriesConfig={seriesConfig}
          title=""
          darkMode={darkMode}
        />
      </div>

      {/* Position Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {chartData.map((data, index) => (
          <div
            key={data.position}
            className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg border ${darkMode ? 'border-amber-500/30 hover:border-amber-500' : 'border-gray-200 hover:border-amber-500'} transition-colors`}
          >
            <h3 className={`text-sm font-semibold mb-2 truncate ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              {data.position}
            </h3>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.totalMeetings}</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Meetings</div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.attendanceRate}%</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rate</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  parseFloat(data.attendanceRate) >= 90 
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : parseFloat(data.attendanceRate) >= 70
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${data.attendanceRate}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Performance Categories */}
      <div className={`mt-6 p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-amber-500/30' : 'bg-gray-50 border-gray-200'}`}>
        <h4 className={`text-sm font-semibold mb-3 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Attendance Performance Categories
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className={`flex items-center justify-between p-2 rounded ${darkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
            <span className={darkMode ? 'text-green-300' : 'text-green-700'}>
              Excellent (90-100%)
            </span>
            <span className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
              {
                chartData.filter(
                  (data) => parseFloat(data.attendanceRate) >= 90
                ).length
              }
            </span>
          </div>
          <div className={`flex items-center justify-between p-2 rounded ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
            <span className={darkMode ? 'text-amber-300' : 'text-amber-700'}>
              Good (70-89%)
            </span>
            <span className={`font-semibold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
              {
                chartData.filter(
                  (data) => {
                    const rate = parseFloat(data.attendanceRate);
                    return rate >= 70 && rate < 90;
                  }
                ).length
              }
            </span>
          </div>
          <div className={`flex items-center justify-between p-2 rounded ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
            <span className={darkMode ? 'text-red-300' : 'text-red-700'}>
              Needs Improvement (&lt;70%)
            </span>
            <span className={`font-semibold ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
              {
                chartData.filter(
                  (data) => parseFloat(data.attendanceRate) < 70
                ).length
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
