'use client';
import React, { useState, useEffect } from 'react';
import CustomAreaChart from '../charts/CustomAreaChart';

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function MonthlyAttendanceGrid({ attendanceData, darkMode }) {
  const [processedData, setProcessedData] = useState([]);
  const [congregations, setCongregations] = useState([]);

  useEffect(() => {
    processAttendanceData();
  }, [attendanceData]);

  const processAttendanceData = () => {
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
      "NOM"
    ];
    
    const congregationMap = new Map();
    
    allSystemCongregations.forEach(congregation => {
      congregationMap.set(congregation, new Map());
    });
    
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach(entry => {
        if (entry.type !== 'local') return;
        const date = new Date(entry.meeting_date);
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${month}`;
        if (congregationMap.has(entry.congregation)) {
          const congregationData = congregationMap.get(entry.congregation);
          if (!congregationData.has(key)) {
            congregationData.set(key, []);
          }
          congregationData.get(key).push(entry);
        }
      });
    }

    const monthsToShow = months.slice(0, currentMonth + 1);
    const processed = monthsToShow.map((monthName, monthIndex) => {
      const monthData = {};
      allSystemCongregations.forEach(congregation => {
        const key = `${currentYear}-${monthIndex}`;
        const entries = congregationMap.get(congregation)?.get(key) || [];
        monthData[congregation] = entries.length;
      });
      
      return {
        month: monthName,
        ...monthData
      };
    });

    setProcessedData(processed);
    setCongregations(allSystemCongregations);
  };

  if (!processedData.length) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4 md:p-6 border ${darkMode ? 'border-amber-500/30' : 'border-gray-200'}`}>
        <div className="flex justify-center items-center h-64">
          <div className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Loading monthly attendance analytics...
          </div>
        </div>
      </div>
    );
  }

  const totalAttendance = processedData.reduce((sum, month) => sum + Object.values(month).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0), 0);

  // Prepare data for Area Chart - show all congregations
  const chartData = processedData.map(month => {
    const dataPoint = { name: month.month };
    congregations.forEach(cong => {
      const shortName = cong.split(' ').slice(0, 2).join(' ');
      dataPoint[shortName] = month[cong] || 0;
    });
    return dataPoint;
  });

  // Configure series with orange/amber colors for all congregations
  const seriesConfig = congregations.map((cong, index) => {
    const shortName = cong.split(' ').slice(0, 2).join(' ');
    const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fed7aa', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fed7aa'];
    return {
      dataKey: shortName,
      label: shortName,
      color: colors[index % colors.length],
      showChange: false,
    };
  });

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-4 md:p-6 border ${darkMode ? 'border-amber-500/30' : 'border-gray-200'}`}>
      <h2 className={`text-lg md:text-xl font-bold mb-4 md:mb-6 ${darkMode ? 'text-amber-400' : 'text-gray-900'}`}>
        Monthly Attendance Analytics
      </h2>
      
      {/* Summary Card */}
      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg border ${darkMode ? 'border-amber-500/30' : 'border-gray-200'} mb-6`}>
        <div className={`text-4xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalAttendance}</div>
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Attendance (All Congregations)</div>
      </div>

      {/* Area Chart */}
      <div className="mb-6">
        <CustomAreaChart
          data={chartData}
          seriesConfig={seriesConfig}
          title=""
          darkMode={darkMode}
        />
      </div>

      {/* Congregation Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {congregations.map(congregation => {
          const congregationTotal = processedData.reduce((sum, month) => sum + (month[congregation] || 0), 0);
          const maxPossible = processedData.length * 2;
          const percentage = maxPossible > 0 ? ((congregationTotal / maxPossible) * 100).toFixed(0) : 0;
          
          return (
            <div key={congregation} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg border ${darkMode ? 'border-amber-500/30 hover:border-amber-500' : 'border-gray-200 hover:border-amber-500'} transition-colors`}>
              <h3 className={`text-sm font-semibold mb-2 truncate ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                {congregation}
              </h3>
              <div className="flex items-center justify-between mb-2">
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{congregationTotal}</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{percentage}%</div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 md:mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs md:text-sm">
        <div className="flex items-center gap-1 md:gap-2">
          <div className="w-3 h-3 bg-green-500 border border-green-600 rounded-sm"></div>
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Present</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <div className="w-3 h-3 bg-gray-400 border border-gray-500 rounded-sm"></div>
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Absent</span>
        </div>
        <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          • Shows months up to current month ({months[new Date().getMonth()]})
        </div>
      </div>
    </div>
  );
} 