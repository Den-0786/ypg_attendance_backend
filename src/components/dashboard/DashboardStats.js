import React from "react";
import StatCard from "../ui/StatCard";

export default function DashboardStats({
  filteredData,
  totalCongregationsCount,
  totalMeetingsCount,
  getGrandTotalProgress,
  getTop3Congregations,
  getTop3Attendees,
  getUniquePeopleLessThan5,
  selectedYear,
  isApologyEntry
}) {
  return (
    <>
      {/* Original Four Summary Cards */}
      <div className="overflow-x-auto md:overflow-x-visible custom-scrollbar">
        <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6 min-w-max md:min-w-0">
          <StatCard title="Total Records" value={filteredData.length} color="blue" icon="document" />
          <StatCard title="Congregations Present" value={totalCongregationsCount} color="green" icon="building" />
          <StatCard title="Total Meetings" value={totalMeetingsCount} color="purple" icon="calendar" />
          <StatCard title="Grand Total Progress" value={`${getGrandTotalProgress(filteredData, selectedYear)}%`} color="amber" icon="chart" />
        </div>
      </div>
      {/* Three Stat Cards (Total Congregations, Top Attendees, Unique People) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StatCard 
          title="Total Congregations" 
          value={getTop3Congregations(filteredData.filter((entry) => !isApologyEntry(entry)), selectedYear).length} 
          color="purple" 
          icon="users" 
        />
        <StatCard 
          title="Top Attendees (5+)" 
          value={getTop3Attendees(filteredData.filter((entry) => !isApologyEntry(entry)), selectedYear).length} 
          color="emerald" 
          icon="check" 
        />
        <StatCard 
          title="Unique People (<5)" 
          value={getUniquePeopleLessThan5(filteredData.filter((entry) => !isApologyEntry(entry)), selectedYear).length} 
          color="cyan" 
          icon="person" 
        />
      </div>
    </>
  );
}
