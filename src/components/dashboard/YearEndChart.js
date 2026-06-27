"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FaFileExport } from "react-icons/fa";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

const monthAbbr = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const allSystemCongregations = [
  "Emmanuel Congregation Ahinsan",
  "Peniel Congregation Esreso No 1",
  "Favour Congregation Esreso No 2",
  "Christ Congregation Ahinsan Estate",
  "Ebenezer Congregation Aprabo",
  "Mizpah Congregation Odagya No 1",
  "Odagya No 2",
  "Liberty Congregation High Tension",
  "NOM",
];

const congregationColors = [
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EC4899",
];

const congregationShortNames = {
  "Emmanuel Congregation Ahinsan": "Emmanuel",
  "Peniel Congregation Esreso No 1": "Peniel",
  "Favour Congregation Esreso No 2": "Favour",
  "Christ Congregation Ahinsan Estate": "Christ",
  "Ebenezer Congregation Aprabo": "Ebenezer",
  "Mizpah Congregation Odagya No 1": "Mizpah",
  "Odagya No 2": "Odagya No 2",
  "Liberty Congregation High Tension": "Liberty",
  "NOM": "NOM",
};

export default function YearEndChart({ attendanceData, darkMode }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [chartHeight, setChartHeight] = useState(320);
  const chartContainerRef = useRef(null);

  useEffect(() => {
    const updateHeight = () => {
      const w = window.innerWidth;
      if (w < 480) setChartHeight(220);
      else if (w < 768) setChartHeight(270);
      else if (w < 1024) setChartHeight(320);
      else setChartHeight(380);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    extractAvailableYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // processData for export/summary: per-congregation stats
  const congregationStats = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const congregationMap = new Map();
    allSystemCongregations.forEach((c) => congregationMap.set(c, Array(12).fill(0)));
    attendanceData.forEach((entry) => {
      const date = new Date(entry.meeting_date);
      if (date.getFullYear() === selectedYear) {
        const month = date.getMonth();
        if (congregationMap.has(entry.congregation)) {
          congregationMap.get(entry.congregation)[month]++;
        }
      }
    });
    return allSystemCongregations.map((congregation) => {
      const monthlyData = congregationMap.get(congregation);
      return {
        congregation,
        totalMeetings: monthlyData.reduce((s, c) => s + c, 0),
        attendanceRate: ((monthlyData.filter((c) => c > 0).length / 12) * 100).toFixed(1),
        currentYearProgress:
          selectedYear === currentYear
            ? (
                (monthlyData.slice(0, currentMonth + 1).filter((c) => c > 0).length /
                  (currentMonth + 1)) *
                100
              ).toFixed(1)
            : null,
        monthlyAttendance: [...monthlyData],
      };
    });
  }, [attendanceData, selectedYear]);

  // streamData: month-based rows, each congregation as a key with value 1 (attended) or 0
  const streamData = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const limit = selectedYear === currentYear ? currentMonth + 1 : 12;
    return months.slice(0, limit).map((month, index) => {
      const row = { month: monthAbbr[index] };
      congregationStats.forEach((cs) => {
        row[cs.congregation] = cs.monthlyAttendance[index] > 0 ? 1 : 0;
      });
      return row;
    });
  }, [congregationStats, selectedYear]);

  const CustomTooltip = useCallback(
    ({ active, payload, label, coordinate }) => {
      if (!active || !payload || !payload.length) return null;

      const attending = payload.filter((p) => p.value > 0).map((p) => p.dataKey);
      const absent = allSystemCongregations.filter((c) => !attending.includes(c));

      // Smart position: flip earlier on smaller screens
      const chartWidth = chartContainerRef.current?.offsetWidth || 600;
      const cx = coordinate?.x || 0;
      const vw = window.innerWidth;
      const isXs = vw < 480;
      const isSm = vw < 768;
      const flipThreshold = isXs ? 0.45 : isSm ? 0.5 : 0.6;
      const flipLeft = cx > chartWidth * flipThreshold;

      const tipWidth = isXs ? 110 : isSm ? 130 : 160;
      const tipPad = isXs ? "3px 5px" : isSm ? "4px 6px" : "6px 8px";
      const labelSize = isXs ? 9 : 10;

      return (
        <div
          className={`rounded-lg shadow-xl border pointer-events-none ${
            darkMode
              ? "bg-gray-900 border-gray-700 text-gray-100"
              : "bg-white border-gray-200 text-gray-800"
          }`}
          style={{
            width: tipWidth,
            padding: tipPad,
            transform: flipLeft ? "translateX(-105%)" : "translateX(5%)",
          }}
        >
          <p
            className={`font-bold mb-0.5 ${darkMode ? "text-white" : "text-gray-900"}`}
            style={{ fontSize: labelSize + 1 }}
          >
            {label}
          </p>
          <div className="space-y-0.5">
            {attending.length > 0 && (
              <div>
                <p className="text-green-500 font-semibold" style={{ fontSize: labelSize }}>
                  Present ({attending.length})
                </p>
                {attending.map((c) => (
                  <div key={c} className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: congregationColors[allSystemCongregations.indexOf(c)] }}
                    />
                    <span style={{ fontSize: labelSize }}>{congregationShortNames[c] || c}</span>
                  </div>
                ))}
              </div>
            )}
            {absent.length > 0 && (
              <div className={`mt-0.5 pt-0.5 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <p className="text-gray-400 font-semibold" style={{ fontSize: labelSize }}>
                  Absent ({absent.length})
                </p>
                {absent.map((c) => (
                  <div key={c} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    <span className="text-gray-400" style={{ fontSize: labelSize }}>{congregationShortNames[c] || c}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    },
    [darkMode]
  );

  const exportData = useCallback(() => {
    const csvContent = [
      ["Congregation", "Total Meetings", "Attendance Rate (%)", "Present Months", "Absent Months", ...months],
      ...congregationStats.map((data) => {
        const presentMonths = data.monthlyAttendance.filter((c) => c > 0).length;
        const absentMonths = 12 - presentMonths;
        return [
          data.congregation,
          data.totalMeetings,
          data.attendanceRate,
          presentMonths,
          absentMonths,
          ...data.monthlyAttendance.map((c) => (c > 0 ? "Present" : "Absent")),
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_summary_${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [congregationStats, selectedYear]);

  if (!congregationStats.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500 dark:text-gray-400 text-center">
            <p>Loading congregations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 md:p-6 lg:p-8 relative"
      ref={chartContainerRef}
    >
      {/* Title, year selector, export */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 sm:mb-4 md:mb-6">
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
          Year-End Attendance Summary
        </h2>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          {availableYears.length > 1 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={`px-2 py-1 text-xs border rounded-md ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
          <button
            onClick={exportData}
            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded-md transition-colors ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
            }`}
            title="Export to CSV"
          >
            <FaFileExport className="inline mr-2" /> Export
          </button>
        </div>
      </div>

      {/* Stream Chart */}
      <div className="w-full">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart
            data={streamData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            stackOffset="wiggle"
          >
            <XAxis
              dataKey="month"
              stroke={darkMode ? "#9ca3af" : "#6b7280"}
              fontSize={11}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: darkMode ? "#6b7280" : "#d1d5db", strokeWidth: 1 }}
            />
            {allSystemCongregations.map((congregation, index) => (
              <Area
                key={congregation}
                type="monotone"
                dataKey={congregation}
                stackId="stream"
                stroke={congregationColors[index]}
                fill={congregationColors[index]}
                fillOpacity={0.75}
                strokeWidth={1.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-2 gap-y-1.5 px-1">
        {allSystemCongregations.map((congregation, index) => (
          <div key={congregation} className="flex items-center gap-1 min-w-0">
            <div
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: congregationColors[index] }}
            />
            <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 truncate">
              {congregationShortNames[congregation]}
            </span>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-4 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {congregationStats.length}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">Congregations</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {congregationStats.reduce((sum, d) => sum + d.totalMeetings, 0)}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">Meetings</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {(
                congregationStats.reduce((sum, d) => sum + parseFloat(d.attendanceRate), 0) /
                congregationStats.length
              ).toFixed(1)}%
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">Avg Rate</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {congregationStats.filter((d) => parseFloat(d.attendanceRate) === 100).length}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">Perfect</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-2 text-xs text-gray-400 dark:text-gray-500">
        <p>Stream shows congregation attendance flow across months for {selectedYear}</p>
      </div>
    </div>
  );
}
