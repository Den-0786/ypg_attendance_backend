"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  const chartContainerRef = useRef(null);

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

  const processData = useMemo(() => {
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    
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


    const congregationMap = new Map();

   
    allSystemCongregations.forEach((congregation) => {
      congregationMap.set(congregation, Array(12).fill(0));
    });

    
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


    const data = congregationsList.map((congregation) => {
      const monthlyData = congregationMap.get(congregation);


      const barData = {
        congregation: congregation,

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

        totalMeetings: monthlyData.reduce((sum, count) => sum + count, 0),
        attendanceRate: (
          (monthlyData.filter((count) => count > 0).length / 12) *
          100
        ).toFixed(1),

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
       
        monthlyAttendance: [...monthlyData],
      };
      return barData;
    });

   
    data.sort(
      (a, b) => parseFloat(b.attendanceRate) - parseFloat(a.attendanceRate)
    );

    return data;
  }, [attendanceData, selectedYear]);

  const getBarColor = useCallback((monthIndex, data) => {

    const hasAttendance =
      data.monthlyAttendance && data.monthlyAttendance[monthIndex] > 0;

    if (hasAttendance) {

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
      const color = attendanceColors[monthIndex];
      return color;
    } else {
      
      const color = "#D1D5DB";
      return color;
    }
  }, []);


  const CustomTooltip = useCallback(
    ({ active, payload, label }) => {
      if (!active || !payload || !payload.length) return null;


      const congregationData = processData.find(
        (item) => item.congregation === label
      );
      if (!congregationData) return null;


      const congregationIndex = processData.findIndex(
        (item) => item.congregation === label
      );

      const isMobile = window.innerWidth < 768;

      let tooltipPosition = "center";
      if (!isMobile) {

        tooltipPosition = congregationIndex < 5 ? "right" : "left";
      }

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      
      const getPositionClasses = () => {
        if (isMobile) {
          return "mx-2 max-w-[280px]";
        }
        return tooltipPosition === "right" ? "ml-4" : "mr-4";
      };

      const getPositionStyle = () => {
        if (isMobile) {
          return { transform: "translateX(-50%)" };
        }
        return tooltipPosition === "right"
          ? { transform: "translateX(0)" }
          : { transform: "translateX(-100%)" };
      };

      return (
        <div
          className={`p-3 sm:p-4 rounded-xl shadow-2xl border backdrop-blur-sm bg-gray-900 border-gray-700 text-white ${getPositionClasses()}`}
          style={getPositionStyle()}
        >
          <p className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-center break-words">
            {label}
          </p>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <p className="text-gray-400 text-xs">Total Meetings</p>
                <p className="font-semibold text-sm sm:text-lg">
                  {congregationData.totalMeetings}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Full Year Rate</p>
                <p className="font-semibold text-sm sm:text-lg">
                  {congregationData.attendanceRate}%
                </p>
              </div>
            </div>
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-1 sm:mb-2">
                Monthly Breakdown:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                {months.map((month, index) => {
                  const hasAttendance =
                    congregationData.monthlyAttendance &&
                    congregationData.monthlyAttendance[index] > 0;
                  const isCurrentMonth =
                    selectedYear === currentYear && index === currentMonth;
                  const isFutureMonth =
                    selectedYear === currentYear && index > currentMonth;

                  return (
                    <div key={index} className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          hasAttendance ? "bg-green-500" : "bg-gray-600"
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
    },
    [processData, selectedYear]
  );

  const exportData = useCallback(() => {
    const csvContent = [
      [
        "Congregation",
        "Total Meetings",
        "Attendance Rate (%)",
        "Present Months",
        "Absent Months",
        ...months,
      ],
      ...processData.map((data) => {
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
  }, [processData, selectedYear]);

  if (!processData.length) {
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
        <div className="min-w-[900px] lg:min-w-[1100px] xl:min-w-[1300px]">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={processData}
              layout="horizontal"
              margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: processData.length > 5 ? 100 : 60,
              }}
              barGap={4}
              barCategoryGap={12}
            >
              <XAxis
                type="category"
                dataKey="congregation"
                stroke={darkMode ? "white" : "black"}
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={processData.length > 5 ? 120 : 80}
                interval={0}
                tick={{ fontSize: 10 }}
                axisLine={true}
                tickLine={true}
              />
              <YAxis
                type="number"
                stroke={darkMode ? "white" : "black"}
                fontSize={12}
                allowDecimals={false}
                domain={[0, 12]}
                ticks={[0, 2, 4, 6, 8, 10, 12]}
                label={{
                  value: "Months with Attendance",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    textAnchor: "middle",
                    fontSize: 12,
                    fill: darkMode ? "white" : "black",
                  },
                }}
                axisLine={true}
                tickLine={true}
              />
              {/* Custom tooltip */}
              <Tooltip content={<CustomTooltip />} />

              {months.map((month, monthIndex) => (
                <Bar
                  key={month}
                  dataKey={month.toLowerCase()}
                  barSize={10}
                  radius={[3, 3, 3, 3]}
                  stackId="a"
                >
                  {processData.map((entry, index) => (
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
      <div className="mt-8 sm:mt-6 md:-mt-12 space-y-2 sm:space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-6 text-xs sm:text-sm">
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
        <div className="text-center relative top-[1.3rem] text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-1 px-2">
          <p>• Each bar shows congregation attendance for {selectedYear}</p>
          <p>• All 9 congregations displayed with monthly segments</p>
        </div>

        {processData.length > 0 && (
          <div className="mt-3 relative top-[1rem] sm:mt-4 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {processData.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Congregations
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {processData.reduce(
                    (sum, data) => sum + data.totalMeetings,
                    0
                  )}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Meetings
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {(
                    processData.reduce(
                      (sum, data) => sum + parseFloat(data.attendanceRate),
                      0
                    ) / processData.length
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
                    processData.filter(
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
