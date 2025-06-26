'use client';
import { useState, useEffect } from 'react';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyAttendanceGrid({ attendanceData, darkMode }) {
  const [processedData, setProcessedData] = useState([]);
  const [congregations, setCongregations] = useState([]);

  useEffect(() => {
    // Always process data to show the grid, even if no attendance data
    processAttendanceData();
  }, [attendanceData]);

  const processAttendanceData = () => {
    // Get current date to determine which months to show
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    // Define all system congregations
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
    
    // Group data by congregation and month
    const congregationMap = new Map();
    
    // Initialize all system congregations
    allSystemCongregations.forEach(congregation => {
      congregationMap.set(congregation, new Map());
    });
    
    // Process attendance data if available
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach(entry => {
        const date = new Date(entry.meeting_date);
        const month = date.getMonth(); // 0-11
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

    // Always show all months up to current month (including current month)
    const monthsToShow = months.slice(0, currentMonth + 1);
    const processed = monthsToShow.map((monthName, monthIndex) => {
      const monthData = {};
      allSystemCongregations.forEach(congregation => {
        const key = `${currentYear}-${monthIndex}`;
        const entries = congregationMap.get(congregation)?.get(key) || [];
        monthData[congregation] = entries;
      });
      
      return {
        month: monthName,
        data: monthData
      };
    });

    setProcessedData(processed);
    setCongregations(allSystemCongregations);
  };

  const getAttendanceStatus = (entries) => {
    if (entries.length === 0) return { present: 0, absent: 2, status: 'none' };
    if (entries.length === 1) return { present: 1, absent: 1, status: 'partial' };
    if (entries.length >= 2) return { present: 2, absent: 0, status: 'full' };
    return { present: 0, absent: 2, status: 'none' };
  };

  const renderAttendanceBoxes = (entries) => {
    const { present, absent } = getAttendanceStatus(entries);
    
    return (
      <div className="flex gap-1">
        {[...Array(2)].map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-sm border ${
              index < present 
                ? 'bg-green-500 border-green-600' 
                : 'bg-gray-400 border-gray-500'
            }`}
            title={index < present ? 'Present' : 'Absent'}
          />
        ))}
      </div>
    );
  };

  if (!processedData.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500 dark:text-gray-400">
            Loading monthly attendance grid...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
        Monthly Attendance Grid
      </h2>
      
      <div className="overflow-x-auto custom-scrollbar pb-4">
        <div className="min-w-max">
          {/* Data Rows - January at bottom, December at top */}
          {processedData.slice().reverse().map((monthData, index) => (
            <div key={monthData.month} className="grid grid-cols-10 gap-2 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="w-24 md:w-32 font-medium text-gray-900 dark:text-white text-sm md:text-base sticky left-0 bg-white dark:bg-gray-800 z-10">
                {monthData.month}
              </div>
              {congregations.map(congregation => (
                <div key={congregation} className="w-16 md:w-20 flex justify-center">
                  {renderAttendanceBoxes(monthData.data[congregation] || [])}
                </div>
              ))}
            </div>
          ))}

          {/* Header with congregation names - at the bottom */}
          <div className="grid grid-cols-10 gap-2 mt-4 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
            <div className="w-24 md:w-32 font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base sticky left-0 bg-white dark:bg-gray-800 z-10">
              Congregation
            </div>
            {congregations.map(congregation => (
              <div key={congregation} className="w-16 md:w-20 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                {congregation.length > 8 ? congregation.substring(0, 8) + '...' : congregation}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 md:mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs md:text-sm">
        <div className="flex items-center gap-1 md:gap-2">
          <div className="w-3 h-3 bg-green-500 border border-green-600 rounded-sm"></div>
          <span className="text-gray-700 dark:text-gray-300">Present</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <div className="w-3 h-3 bg-gray-400 border border-gray-500 rounded-sm"></div>
          <span className="text-gray-700 dark:text-gray-300">Absent</span>
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-center">
          • 2 boxes per month per congregation (representing 2 participants)
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-center">
          • Shows months up to current month ({months[new Date().getMonth()]})
        </div>
      </div>
    </div>
  );
} 