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
  const prevYear = currentYear - 1;
  const currentStats = getMonthlyStats(attendanceData, currentYear);
  const prevStats = previousYearData ? getMonthlyStats(previousYearData, prevYear) : null;

  const totalAttendance = currentStats.reduce((sum, s) => sum + s.total, 0);
  const totalUnique = currentStats.reduce((sum, s) => sum + s.unique, 0);
  const prevTotalAttendance = prevStats ? prevStats.reduce((sum, s) => sum + s.total, 0) : 0;
  const avgMonthly = currentStats.length > 0 ? (totalAttendance / currentStats.length).toFixed(1) : 0;

  // Prepare data for Area Chart
  const chartData = currentStats.map((stat, index) => {
    const dataPoint = {
      name: stat.month,
      'Current Year': stat.total,
      'Current Year Change': prevStats ? stat.total - prevStats[index].total : 0,
    };
    if (prevStats) {
      dataPoint['Previous Year'] = prevStats[index].total;
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
    <div className="w-full bg-gray-800 rounded-xl shadow-md p-4 md:p-6 border border-amber-500/30">
      <h3 className="text-lg font-bold mb-4 text-amber-400">Monthly Attendance Analytics ({currentYear}{prevStats ? ` vs ${prevYear}` : ''})</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded-lg border border-amber-500/30">
          <div className="text-3xl font-bold text-white mb-1">{totalAttendance}</div>
          <div className="text-xs text-gray-400">Total Attendance</div>
          {prevStats && (
            <div className="text-xs text-green-400 mt-1">
              {totalAttendance > prevTotalAttendance ? '+' : ''}{totalAttendance - prevTotalAttendance} vs last year
            </div>
          )}
        </div>
        <div className="bg-gray-700 p-4 rounded-lg border border-amber-500/30">
          <div className="text-3xl font-bold text-white mb-1">{totalUnique}</div>
          <div className="text-xs text-gray-400">Unique Attendees</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg border border-amber-500/30">
          <div className="text-3xl font-bold text-white mb-1">{avgMonthly}</div>
          <div className="text-xs text-gray-400">Avg Per Month</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg border border-amber-500/30">
          <div className="text-3xl font-bold text-white mb-1">{currentStats.filter(s => s.total > 0).length}</div>
          <div className="text-xs text-gray-400">Active Months</div>
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