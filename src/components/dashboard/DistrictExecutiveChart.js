'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FaUsers } from 'react-icons/fa';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Define all district executive positions
const districtPositions = [
  'President', "President's Rep", 'Secretary', 'Assistant Secretary',
  'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
];

export default function DistrictExecutiveChart({ attendanceData, darkMode }) {
  const [chartData, setChartData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    // Always process data to show all positions, even if no attendance data
    extractAvailableYears();
    processData();
  }, [attendanceData, selectedYear]);

  const extractAvailableYears = () => {
    const years = new Set();
    const currentYear = new Date().getFullYear();
    
    // Always include current year
    years.add(currentYear);
    
    // Add years from attendance data
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach(entry => {
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
    
    // Group data by position and month
    const positionMap = new Map();
    
    // Initialize all district positions with 12 months of data (all 0 initially)
    districtPositions.forEach(position => {
      positionMap.set(position, Array(12).fill(0));
    });
    
    // Fill in actual attendance data for selected year (district type only)
    attendanceData.forEach(entry => {
      const date = new Date(entry.meeting_date);
      if (date.getFullYear() === selectedYear && entry.type === 'district') {
        const position = entry.position;
        const month = date.getMonth();
        
        if (positionMap.has(position)) {
          positionMap.get(position)[month]++;
        }
      }
    });

    // Debug: Log President's data specifically
    const presidentData = positionMap.get("President");
    console.log('DistrictChart - President monthly data:', presidentData);
    console.log('DistrictChart - President June data:', presidentData ? presidentData[5] : 'N/A');
    console.log('DistrictChart - Selected year:', selectedYear);
    console.log('DistrictChart - Current year:', currentYear);
    console.log('DistrictChart - District attendance data length:', attendanceData?.filter(e => e.type === 'district').length || 0);

    const positionsList = Array.from(positionMap.keys()).sort();

    // Create chart data with positions as bars and months as segments
    const data = positionsList.map(position => {
      const monthlyData = positionMap.get(position);
      
      const barData = {
        position: position,
        // Each month gets its own data point for the bar - fill up to current month
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
        attendanceRate: (monthlyData.filter(count => count > 0).length / 12 * 100).toFixed(1),
        // Add current year progress info
        currentYearProgress: selectedYear === currentYear ? 
          (monthlyData.slice(0, currentMonth + 1).filter(count => count > 0).length / (currentMonth + 1) * 100).toFixed(1) : null,
        // Store monthly attendance data for color determination
        monthlyAttendance: [...monthlyData] // Create a copy of the array
      };
      return barData;
    });

    // Sort by attendance rate (descending) but keep all positions
    data.sort((a, b) => parseFloat(b.attendanceRate) - parseFloat(a.attendanceRate));
    
    console.log('DistrictChart - All positions being displayed:', positionsList);
    console.log('DistrictChart - Chart data:', data);
    console.log('DistrictChart - President chart data:', data.find(d => d.position === 'President'));
    console.log('DistrictChart - Current year:', selectedYear, 'Current month:', currentMonth);
    console.log('DistrictChart - District attendance data received:', attendanceData?.filter(e => e.type === 'district').length || 0, 'entries');
    console.log('DistrictChart - Available years:', availableYears);
    
    // Only set chart data if we have attendance data or if this is the initial load
    if (attendanceData?.filter(e => e.type === 'district').length > 0 || chartData.length === 0) {
      setChartData(data);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const presentMonths = payload.filter(p => p.value === 1).length;
      const absentMonths = 12 - presentMonths;
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      return (
        <div className={`p-4 rounded-xl shadow-xl border backdrop-blur-sm ${
          darkMode ? 'bg-gray-800/95 border-gray-600 text-white' : 'bg-white/95 border-gray-200 text-gray-900'
        }`}>
          <p className="font-bold text-lg mb-3 text-center">{label}</p>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Meetings</p>
                <p className="font-semibold text-lg">{data.totalMeetings}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Full Year Rate</p>
                <p className="font-semibold text-lg">{data.attendanceRate}%</p>
              </div>
            </div>
            
            {selectedYear === currentYear && data.currentYearProgress && (
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-blue-700 dark:text-blue-300 font-medium">Current Year Progress</p>
                <p className="text-blue-800 dark:text-blue-200 font-bold text-lg">
                  {data.currentYearProgress}% ({months.slice(0, currentMonth + 1).join(', ')})
                </p>
              </div>
            )}
            
            <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Monthly Breakdown:</p>
              <div className="grid grid-cols-4 gap-1">
                {months.map((month, index) => {
                  const hasAttendance = data.monthlyAttendance && data.monthlyAttendance[index] > 0;
                  const isCurrentMonth = selectedYear === currentYear && index === currentMonth;
                  const isFutureMonth = selectedYear === currentYear && index > currentMonth;
                  
                  return (
                    <div key={month} className="flex items-center gap-1">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          hasAttendance ? 'bg-green-500' : 
                          isFutureMonth ? 'bg-gray-300 dark:bg-gray-600' :
                          'bg-gray-300'
                        }`}
                      />
                      <span className={`text-xs ${
                        isCurrentMonth ? 'font-bold text-blue-600 dark:text-blue-400' :
                        isFutureMonth ? 'text-gray-400 dark:text-gray-500' :
                        'text-gray-600 dark:text-gray-300'
                      }`}>
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
    }
    return null;
  };

  const exportData = () => {
    const csvContent = [
      ['Position', 'Total Meetings', 'Attendance Rate (%)', 'Present Months', 'Absent Months', ...months],
      ...chartData.map(data => {
        const presentMonths = months.filter(month => data[month.toLowerCase()] === 1).length;
        const absentMonths = 12 - presentMonths;
        return [
          data.position,
          data.totalMeetings,
          data.attendanceRate,
          presentMonths,
          absentMonths,
          ...months.map(month => data[month.toLowerCase()] === 1 ? 'Present' : 'Absent')
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `district_executives_attendance_${selectedYear}.csv`;
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
            <p>Loading district executives...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaUsers className="text-blue-500" />
          District Executive Attendance Summary
        </h2>
        
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          {availableYears.length > 1 && (
            <>
              <label className="text-sm text-gray-600 dark:text-gray-400">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={`px-3 py-1 text-sm border rounded-md ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </>
          )}
          
          {chartData.length > 0 && (
            <button
              onClick={exportData}
              className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              }`}
              title="Export to CSV"
            >
              📊 Export
            </button>
          )}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 100, bottom: 80 }}
          barGap={4}
          barCategoryGap={16}
        >
          <XAxis 
            type="category" 
            dataKey="position" 
            stroke={darkMode ? "white" : "black"}
            fontSize={8}
            angle={-45}
            textAnchor="end"
            height={120}
            interval={0}
            tick={{ fontSize: 8 }}
            axisLine={true}
            tickLine={true}
          />
          <YAxis 
            type="number" 
            stroke={darkMode ? "white" : "black"}
            fontSize={12}
            allowDecimals={false}
            domain={[0, 12]}
            ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
            label={{ 
              value: 'Months with Attendance', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
            axisLine={true}
            tickLine={true}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Create bars for each month */}
          {months.map((month, monthIndex) => {
            const monthKey = month.toLowerCase();
            console.log(`Rendering district bar for ${month} (index ${monthIndex})`);
            return (
              <Bar
                key={month}
                dataKey={monthKey}
                barSize={8}
                radius={[2, 2, 2, 2]}
                stackId="a"
              >
                {chartData.map((entry, index) => {
                  const hasAttendance = entry.monthlyAttendance && entry.monthlyAttendance[monthIndex] > 0;
                  const color = hasAttendance ? 
                    ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'][monthIndex] : 
                    '#D1D5DB';
                  console.log(`District cell color for ${month} (${entry.position}): ${color}, HasAttendance: ${hasAttendance}`);
                  return (
                    <Cell key={`cell-${index}`} fill={color} />
                  );
                })}
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>

      {/* Enhanced Legend */}
      <div className="mt-4 md:mt-6 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs md:text-sm">
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-3 h-3 bg-green-500 border border-green-600 rounded-sm"></div>
            <span className="text-gray-700 dark:text-gray-300">Present</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-3 h-3 bg-gray-300 border border-gray-400 rounded-sm"></div>
            <span className="text-gray-700 dark:text-gray-300">Absent/No Meeting</span>
          </div>
          {selectedYear === new Date().getFullYear() && (
            <>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 border border-gray-400 dark:border-gray-500 rounded-sm"></div>
                <span className="text-gray-700 dark:text-gray-300">Future Months</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-3 h-3 bg-blue-500 border border-blue-600 rounded-sm"></div>
                <span className="text-gray-700 dark:text-gray-300">Current Month</span>
              </div>
            </>
          )}
        </div>
        
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Each bar represents a district executive position's attendance throughout {selectedYear}</p>
          <p>• All 8 district positions are displayed with monthly attendance segments</p>
          <p>• Bars fill up to current month ({months[new Date().getMonth()]}) with modern rounded design</p>
          {selectedYear === new Date().getFullYear() && (
            <p>• Current year progress is highlighted with special indicators</p>
          )}
        </div>
        
        {/* Summary Statistics */}
        {chartData.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {chartData.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Total Positions</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {chartData.reduce((sum, data) => sum + data.totalMeetings, 0)}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Total Meetings</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {(chartData.reduce((sum, data) => sum + parseFloat(data.attendanceRate), 0) / chartData.length).toFixed(1)}%
                </p>
                <p className="text-gray-600 dark:text-gray-400">Avg Attendance Rate</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {chartData.filter(data => parseFloat(data.attendanceRate) === 100).length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Perfect Attendance</p>
              </div>
            </div>
            
            {/* Attendance Progress Indicators */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center">
                Attendance Performance Categories
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="text-green-700 dark:text-green-300">Excellent (90-100%)</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    {chartData.filter(data => parseFloat(data.attendanceRate) >= 90).length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <span className="text-yellow-700 dark:text-yellow-300">Good (70-89%)</span>
                  <span className="font-semibold text-yellow-700 dark:text-yellow-300">
                    {chartData.filter(data => parseFloat(data.attendanceRate) >= 70 && parseFloat(data.attendanceRate) < 90).length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span className="text-red-700 dark:text-red-300">Needs Improvement (&lt;70%)</span>
                  <span className="font-semibold text-red-700 dark:text-red-300">
                    {chartData.filter(data => parseFloat(data.attendanceRate) < 70).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
