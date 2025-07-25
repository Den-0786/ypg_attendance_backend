import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area
} from 'recharts';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getMonthlyStats(attendanceData, year) {
  // Returns [{month: 'Jan', unique: 0, total: 0}, ...]
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

  // Y-axis max: 10 or max attendance, whichever is higher
  const maxY = Math.max(10, ...currentStats.map(s => s.total), ...(prevStats ? prevStats.map(s => s.total) : []));

  return (
    <div className="w-full h-96 bg-white dark:bg-gray-900 rounded-xl shadow-md p-4">
      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Monthly Attendance Trend ({currentYear}{prevStats ? ` vs ${prevYear}` : ''})</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={currentStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#eee'} />
          <XAxis dataKey="month" stroke={darkMode ? '#fff' : '#333'} />
          <YAxis domain={[0, maxY]} stroke={darkMode ? '#fff' : '#333'} allowDecimals={false} />
          <Tooltip contentStyle={{ background: darkMode ? '#222' : '#fff', color: darkMode ? '#fff' : '#333' }} />
          <Legend />
          {/* Area for total attendance */}
          <Area type="monotone" dataKey="total" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} name="Total Attendance" />
          {/* Line for total attendance */}
          <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} name="Total Attendance" />
          {/* Line for unique attendees */}
          <Line type="monotone" dataKey="unique" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Unique Attendees" />
          {/* Previous year comparison */}
          {prevStats && (
            <Line type="monotone" data={prevStats} dataKey="total" stroke="#f59e42" strokeDasharray="5 5" strokeWidth={2} dot={false} name={`Total (${prevYear})`} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 