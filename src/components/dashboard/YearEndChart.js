"use client";
import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

export default function YearEndChart({ attendanceData, darkMode }) {
  const [chartData, setChartData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltipHovered, setTooltipHovered] = useState(false);
  const chartContainerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    // Always process data to show all congregations, even if no attendance data
    extractAvailableYears();
    processData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceData, selectedYear]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target) &&
        !chartContainerRef.current?.contains(event.target)
      ) {
        setHoveredBar(null);
        setTooltipHovered(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const extractAvailableYears = () => {
    const years = new Set();
    const currentYear = new Date().getFullYear();

    // Always include current year
    years.add(currentYear);

    // Add years from attendance data
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach((entry) => {
        const date = new Date(entry.meeting_date);
        years.add(date.getFullYear());
      });
    }

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    setAvailableYears(sortedYears);

    // Set current year as default if not already set
    if (!selectedYear || !sortedYears.includes(selectedYear)) {
      setSelectedYear(currentYear);
    }
  };

  const processData = () => {
    // Get current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11 (June = 5)

    // Define all congregations from the system
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

    // Group data by congregation and month
    const congregationMap = new Map();

    // Initialize all system congregations with 12 months of data (all 0 initially)
    allSystemCongregations.forEach((congregation) => {
      congregationMap.set(congregation, Array(12).fill(0));
    });

    // Fill in actual attendance data for selected year
    attendanceData.forEach((entry) => {
      const date = new Date(entry.meeting_date);
      if (date.getFullYear() === selectedYear) {
        const congregation = entry.congregation;
        const month = date.getMonth();

        if (congregationMap.has(congregation)) {
          congregationMap.get(congregation)[month]++;
        }
      }
    });

    const congregationsList = Array.from(congregationMap.keys()).sort();

    // Create chart data with congregations as bars and months as segments
    const data = congregationsList.map((congregation) => {
      const monthlyData = congregationMap.get(congregation);

// sourcery skip: inline-immediately-returned-variable
      const barData = {
        congregation: congregation,
        // Each month gets its own data point for the bar - fill up to current month
// sourcery skip: flip-comparison
        january: selectedYear === currentYear && 0 <= currentMonth ? 1 : 0,
        february: selectedYear === currentYear && 1 <= currentMonth ? 1 : 0,
        march: selectedYear === currentYear && 2 <= currentMonth ? 1 : 0,
        april: selectedYear === currentYear && 3 <= currentMonth ? 1 : 0,
        may: selectedYear === currentYear && 4 <= currentMonth ? 1 : 0,
        june: selectedYear === currentYear && 5 <= currentMonth ? 1 : 0,
        july: selectedYear === currentYear && 6 <= currentMonth ? 1 : 0,
        august: selectedYear === currentYear && 7 <= currentMonth ? 1 : 0,
        september: selectedYear === currentYear && 8 <= currentMonth ? 1 : 0,
        october: selectedYear === currentYear && 9 <= currentMonth ? 1 : 0,
        november: selectedYear === currentYear && 10 <= currentMonth ? 1 : 0,
        december: selectedYear === currentYear && 11 <= currentMonth ? 1 : 0,
        // Add total attendance count for tooltip
        totalMeetings: monthlyData.reduce((sum, count) => sum + count, 0),
        attendanceRate: (
          (monthlyData.filter((count) => count > 0).length / 12) *
          100
        ).toFixed(1),
        // Add current year progress info
        currentYearProgress:
          selectedYear === currentYear
            ? (
                (monthlyData
                  .slice(0, currentMonth + 1)
                  .filter((count) => count > 0).length /
                  (currentMonth + 1)) *
                100
              ).toFixed(1)
            : null,
        // Store monthly attendance data for color determination
        monthlyAttendance: [...monthlyData], // Create a copy of the array
      };
      return barData;
    });

    // Sort by attendance rate (descending) but keep all congregations
    data.sort(
      (a, b) => parseFloat(b.attendanceRate) - parseFloat(a.attendanceRate)
    );

    // Only set chart data if we have attendance data or if this is the initial load
    if (attendanceData?.length > 0 || chartData.length === 0) {
      setChartData(data);
    }
  };

  const getBarColor = (monthIndex, data) => {
    // Check if this month has attendance data
    const hasAttendance =
      data.monthlyAttendance && data.monthlyAttendance[monthIndex] > 0;

    if (hasAttendance) {
      // Colors for months with attendance
      const attendanceColors = [
        "#10B981", // Green - January
        "#3B82F6", // Blue - February
        "#8B5CF6", // Purple - March
        "#F59E0B", // Yellow - April
        "#EF4444", // Red - May
        "#06B6D4", // Cyan - June
        "#84CC16", // Lime - July
        "#F97316", // Orange - August
        "#EC4899", // Pink - September
        "#6366F1", // Indigo - October
        "#14B8A6", // Teal - November
        "#F43F5E", // Rose - December
      ];
// sourcery skip: inline-immediately-returned-variable
      const color = attendanceColors[monthIndex];
      return color;
    } else {
      // Ash/Gray for months with no attendance (instead of black)
// sourcery skip: inline-immediately-returned-variable
      const color = "#D1D5DB"; // Light gray/ash color
      return color;
    }
  };

  // Custom top-centered modal for hovered bar
  const TopCenterTooltip = ({ data, label }) => {
    if (!data) return null;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    return (
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          transform: "translateX(-50%)",
          zIndex: 50,
          width: "min(320px, 95vw)",
          pointerEvents: "auto",
        }}
        className={
          "p-4 rounded-xl shadow-2xl border backdrop-blur-sm bg-gray-900 border-gray-700 text-white mt-2"
        }
        onMouseEnter={() => setTooltipHovered(true)}
        onMouseLeave={() => setTooltipHovered(false)}
      >
        <p className="font-bold text-lg mb-3 text-center">{label}</p>
        
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Total Meetings</p>
              <p className="font-semibold text-lg">{data.totalMeetings}</p>
            </div>
            <div>
              <p className="text-gray-400">Full Year Rate</p>
              <p className="font-semibold text-lg">{data.attendanceRate}%</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Monthly Breakdown:</p>
            <div className="grid grid-cols-4 gap-1">
              {months.map((month, index) => {
                const hasAttendance =
                  data.monthlyAttendance && data.monthlyAttendance[index] > 0;
                const isCurrentMonth =
                  selectedYear === currentYear && index === currentMonth;
                const isFutureMonth =
                  selectedYear === currentYear && index > currentMonth;
                return (
                  <div key={month} className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        hasAttendance
                          ? "bg-green-500"
                          : isFutureMonth
                            ? "bg-gray-600"
                            : "bg-gray-600"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        isCurrentMonth
                          ? "font-bold text-blue-400"
                          : isFutureMonth
                            ? "text-gray-500"
                            : "text-gray-300"
                      }`}
                    >
                      {month.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const exportData = () => {
    const csvContent = [
      [
        "Congregation",
        "Total Meetings",
        "Attendance Rate (%)",
        "Present Months",
        "Absent Months",
        ...months,
      ],
      ...chartData.map((data) => {
        const presentMonths = months.filter(
          (month) => data[month.toLowerCase()] === 1
        ).length;
        const absentMonths = 12 - presentMonths;
        return [
          data.congregation,
          data.totalMeetings,
          data.attendanceRate,
          presentMonths,
          absentMonths,
          ...months.map((month) =>
            data[month.toLowerCase()] === 1 ? "Present" : "Absent"
          ),
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
  };

  if (!chartData.length) {
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
      {/* Top-centered tooltip/modal */}
      {(hoveredBar || tooltipHovered) && (
        <TopCenterTooltip data={hoveredBar?.data} label={hoveredBar?.label} />
      )}
      {/* Chart title and export button above scrollable area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 sm:mb-4 md:mb-6">
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
          Year-End Attendance Summary
        </h2>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <button
            onClick={exportData}
            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded-md transition-colors ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
            }`}
            title="Export to CSV"
          >
            📊 Export
          </button>
        </div>
      </div>
      {/* Chart with horizontal scroll - only the chart is scrollable */}
      <div className="w-full overflow-x-auto justify-start">
        <div className="min-w-[700px]">
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: chartData.length > 5 ? 100 : 60,
              }}
              barGap={4}
              barCategoryGap={12}
              onMouseLeave={() => {
                if (!tooltipHovered) {
                  setHoveredBar(null);
                }
              }}
            >
              <XAxis
                type="category"
                dataKey="congregation"
                stroke={darkMode ? "white" : "black"}
                fontSize={8}
                angle={-45}
                textAnchor="end"
                height={chartData.length > 5 ? 140 : 100}
                interval={0}
                tick={{ fontSize: 8 }}
                axisLine={true}
                tickLine={true}
              />
              <YAxis
                type="number"
                stroke={darkMode ? "white" : "black"}
                fontSize={10}
                allowDecimals={false}
                domain={[0, 12]}
                ticks={[0, 2, 4, 6, 8, 10, 12]}
                label={{
                  value: "Months with Attendance",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    textAnchor: "middle",
                    fontSize: 10,
                  },
                }}
                axisLine={true}
                tickLine={true}
              />
              {/* Hide default tooltip */}
              <Tooltip content={() => null} />
              
              {months.map((month, monthIndex) => (
                <Bar
                  key={month}
                  dataKey={month.toLowerCase()}
                  barSize={8}
                  radius={[2, 2, 2, 2]}
                  stackId="a"
                  onMouseOver={(_, barIndex) => {
                    // Find the data for the hovered bar
                    const barData = chartData[barIndex];
                    setHoveredBar({
                      data: barData,
                      label: barData.congregation,
                    });
                  }}
                  onMouseEnter={(_, barIndex) => {
                    // Immediate response on mouse enter
                    const barData = chartData[barIndex];
                    setHoveredBar({
                      data: barData,
                      label: barData.congregation,
                    });
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(monthIndex, entry)}
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Legend and summary below the chart and scrollbar */}
      <div className="mt-12 sm:mt-10 md:-mt-16 space-y-2 sm:space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-6 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 border border-green-600 rounded-sm"></div>
            <span className="text-gray-700 dark:text-gray-300">Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-300 border border-gray-400 rounded-sm"></div>
            <span className="text-gray-700 dark:text-gray-300">Absent</span>
          </div>
          {selectedYear === new Date().getFullYear() && (
            <>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-300 dark:bg-gray-600 border border-gray-400 dark:border-gray-500 rounded-sm"></div>
                <span className="text-gray-700 dark:text-gray-300">Future</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 border border-blue-600 rounded-sm"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Current
                </span>
              </div>
            </>
          )}
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1 px-2">
          <p>• Each bar shows congregation attendance for {selectedYear}</p>
          <p>• All 9 congregations displayed with monthly segments</p>
        </div>
        
        {chartData.length > 0 && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center text-xs">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {chartData.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Congregations
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {chartData.reduce((sum, data) => sum + data.totalMeetings, 0)}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Meetings
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {(
                    chartData.reduce(
                      (sum, data) => sum + parseFloat(data.attendanceRate),
                      0
                    ) / chartData.length
                  ).toFixed(1)}
                  %
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Avg Rate
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {
                    chartData.filter(
                      (data) => parseFloat(data.attendanceRate) === 100
                    ).length
                  }
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Perfect
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
