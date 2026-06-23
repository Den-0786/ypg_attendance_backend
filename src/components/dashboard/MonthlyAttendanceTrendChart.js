'use client';
import React from 'react';
import CustomAreaChart from '../charts/CustomAreaChart';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getMonthlyStats(attendanceData, year) {
  const stats = monthNames.map((m, i) => ({ month: m, unique: 0, total: 0 }));
  const seen = Array(12).fill().map(() => new Set());
  attendanceData.forEach(entry => {
    const date = new Date(entry.meeting_date);
    if (date.getFullYear() === year) {
      const monthIdx = date.getMonth();
      stats[monthIdx].total += 1;
      if (entry.name) seen[monthIdx].add(entry.name);
      else if (entry.congregation) seen[monthIdx].add(entry.congregation);
    }
  });
  stats.forEach((s, i) => { s.unique = seen[i].size; });
  return stats;
}

export default function MonthlyAttendanceTrendChart({ attendanceData, previousYearData, darkMode }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const prevYear = currentYear - 1;
  const currentStats = getMonthlyStats(attendanceData, currentYear);
  const prevStats = previousYearData ? getMonthlyStats(previousYearData, prevYear) : null;

  // Filter stats to only show up to current month
  const filteredCurrentStats = currentStats.slice(0, currentMonth + 1);
  const filteredPrevStats = prevStats ? prevStats.slice(0, currentMonth + 1) : null;

  const totalAttendance = filteredCurrentStats.reduce((sum, s) => sum + s.total, 0);
  const totalUnique = filteredCurrentStats.reduce((sum, s) => sum + s.unique, 0);
  const prevTotalAttendance = filteredPrevStats ? filteredPrevStats.reduce((sum, s) => sum + s.total, 0) : 0;
  const avgMonthly = filteredCurrentStats.length > 0 ? (totalAttendance / filteredCurrentStats.length).toFixed(1) : 0;

  // Prepare data for Area Chart - only up to current month
  const chartData = filteredCurrentStats.map((stat, index) => {
    const dataPoint = {
      name: stat.month,
      'Current Year': stat.total,
      'Current Year Change': filteredPrevStats ? stat.total - filteredPrevStats[index].total : 0,
    };
    if (filteredPrevStats) {
      dataPoint['Previous Year'] = filteredPrevStats[index].total;
      dataPoint['Previous Year Change'] = 0;
    }
    return dataPoint;
  });

  // Configure series
  const seriesConfig = [
    {
      dataKey: 'Current Year',
      label: 'Current Year',
      color: '#f59e0b', // Amber/Orange
      showChange: true,
    },
  ];

  if (prevStats) {
    seriesConfig.push({
      dataKey: 'Previous Year',
      label: 'Previous Year',
      color: '#fbbf24', // Lighter amber
      showChange: false,
    });
  }

  return (
    <div className={`w-full rounded-xl shadow-md p-4 md:p-6 border ${darkMode ? 'bg-gray-800 border-amber-500/30' : 'bg-white border-gray-200'}`}>
      <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Monthly Attendance Analytics ({currentYear}{prevStats ? ` vs ${prevYear}` : ''})</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-amber-500/30' : 'bg-gray-100 border-gray-300'}`}>
          <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalAttendance}</div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Attendance</div>
          {prevStats && (
            <div className={`text-xs mt-1 ${totalAttendance > prevTotalAttendance ? 'text-green-600' : 'text-red-600'}`}>
              {totalAttendance > prevTotalAttendance ? '+' : ''}{totalAttendance - prevTotalAttendance} vs last year
            </div>
          )}
        </div>
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-amber-500/30' : 'bg-gray-100 border-gray-300'}`}>
          <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalUnique}</div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unique Attendees</div>
        </div>
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-amber-500/30' : 'bg-gray-100 border-gray-300'}`}>
          <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{avgMonthly}</div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Per Month</div>
        </div>
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-amber-500/30' : 'bg-gray-100 border-gray-300'}`}>
          <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentStats.filter(s => s.total > 0).length}</div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Months</div>
        </div>
      </div>

      {/* Area Chart */}
      <CustomAreaChart
        data={chartData}
        seriesConfig={seriesConfig}
        title=""
        darkMode={darkMode}
      />
    </div>
  );
} 