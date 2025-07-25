'use client';
import { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function AttendanceChart({ attendanceData, darkMode }) {
  const [processedData, setProcessedData] = useState([]);
  const [congregations, setCongregations] = useState([]);

  useEffect(() => {
    if (attendanceData && attendanceData.length > 0) {
      processAttendanceData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceData]);

  const processAttendanceData = () => {
    // Get current date to determine which months to show
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    // Group data by congregation and month
    const congregationMap = new Map();
    
    attendanceData.forEach(entry => {
      const date = new Date(entry.meeting_date);
      const month = date.getMonth(); // 0-11
      const year = date.getFullYear();
      const key = `${year}-${month}`;
      
      if (!congregationMap.has(entry.congregation)) {
        congregationMap.set(entry.congregation, new Map());
      }
      
      const congregationData = congregationMap.get(entry.congregation);
      if (!congregationData.has(key)) {
        congregationData.set(key, []);
      }
      
      congregationData.get(key).push(entry);
    });

    // Convert to array format for rendering
    const congregationsList = Array.from(congregationMap.keys());
    setCongregations(congregationsList);

    // Show all months up to current month (including current month)
    const monthsToShow = months.slice(0, currentMonth + 1);
    const processed = monthsToShow.map((monthName, monthIndex) => {
      const monthData = {};
      congregationsList.forEach(congregation => {
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
      <div className="flex gap-0.5 md:gap-1">
        {[...Array(2)].map((_, index) => (
          <div
            key={index}
            className={`w-2 md:w-3 h-2 md:h-3 rounded-sm border ${
              index < present 
                ? 'bg-green-500 border-green-600' 
                : 'bg-yellow-500 border-yellow-600'
            }`}
            title={index < present ? 'Present' : 'No Attendance'}
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
            No attendance data available for completed months
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
        Monthly Attendance Overview
      </h2>
      
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-max">
          {/* Header with congregation names */}
          <div className="grid" style={{ gridTemplateColumns: `minmax(60px, 1fr) repeat(${congregations.length}, minmax(70px, 1fr))` }}>
            <div className="w-16 md:w-20 font-semibold text-gray-700 dark:text-gray-300 text-xs md:text-sm sticky left-0 bg-white dark:bg-gray-800 z-10">
              Month
            </div>
            {congregations.map(congregation => (
              <div key={congregation} className="w-20 min-w-[70px] text-center text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">
                {congregation}
              </div>
            ))}
          </div>

          {/* Data Rows - January at bottom, December at top */}
          {processedData.slice().reverse().map((monthData, index) => (
            <div key={monthData.month} className="grid" style={{ gridTemplateColumns: `minmax(60px, 1fr) repeat(${congregations.length}, minmax(70px, 1fr))` }}>
              <div className="w-16 md:w-20 font-medium text-gray-900 dark:text-white text-xs md:text-sm sticky left-0 bg-white dark:bg-gray-800 z-10">
                {monthData.month}
              </div>
              {congregations.map(congregation => (
                <div key={congregation} className="w-20 min-w-[70px] flex justify-center">
                  {renderAttendanceBoxes(monthData.data[congregation] || [])}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 md:mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs md:text-sm">
        <div className="flex items-center gap-1 md:gap-2">
          <div className="w-3 h-3 bg-green-500 border border-green-600 rounded-sm"></div>
          <span className="text-gray-700 dark:text-gray-300">Present</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <div className="w-3 h-3 bg-yellow-500 border border-yellow-600 rounded-sm"></div>
          <span className="text-gray-700 dark:text-gray-300">No Attendance</span>
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