// Helper functions for dashboard components
// Helper function to identify apology entries
export function isApologyEntry(entry) {
  return entry && entry.reason && entry.reason.length > 0;
}

// Helper functions for progress calculations
export function getLocalProgress(attendanceData, year) {
  if (!Array.isArray(attendanceData)) return 0;
  const targetYear = year || new Date().getFullYear();
  const congregationsWithAttendance = new Set();
  attendanceData.forEach((entry) => {
    const date = new Date(entry.meeting_date);
    if (
      date.getFullYear() === targetYear &&
      entry.type !== "district" &&
      !isApologyEntry(entry)
    ) {
      congregationsWithAttendance.add(entry.congregation);
    }
  });
  const totalCongregations = 9;
  const progress =
    (congregationsWithAttendance.size / totalCongregations) * 100;
  return Math.round(progress);
}

export function getDistrictProgress(attendanceData, year) {
  if (!Array.isArray(attendanceData)) return 0;
  const targetYear = year || new Date().getFullYear();
  const executivesWithAttendance = new Set();
  attendanceData.forEach((entry) => {
    const date = new Date(entry.meeting_date);
    if (
      date.getFullYear() === targetYear &&
      entry.type === "district" &&
      !isApologyEntry(entry)
    ) {
      executivesWithAttendance.add(entry.position);
    }
  });
  const totalExecutives = 8;
  const progress = (executivesWithAttendance.size / totalExecutives) * 100;
  return Math.round(progress);
}

export function getGrandTotalProgress(attendanceData, year) {
  if (!Array.isArray(attendanceData)) return 0;
  const targetYear = year || new Date().getFullYear();
  const localProgress = getLocalProgress(attendanceData, targetYear);
  const districtProgress = getDistrictProgress(attendanceData, targetYear);
  const grandTotal = (localProgress + districtProgress) / 2;
  return Math.round(grandTotal);
}

// Function to get unique people with less than 5 meetings (local only)
export function getUniquePeopleLessThan5(attendanceData, year) {
  if (!Array.isArray(attendanceData)) return [];

  const targetYear = year || new Date().getFullYear();
  const personCounts = {};

  attendanceData.forEach((entry) => {
    const date = new Date(entry.meeting_date);
    if (date.getFullYear() === targetYear && entry.type !== "district" && !isApologyEntry(entry)) {
      personCounts[entry.name] = (personCounts[entry.name] || 0) + 1;
    }
  });

  return Object.keys(personCounts).filter((person) => personCounts[person] < 5);
}

// Function to get top 3 attendees with 5 or more meetings (local only)
export function getTop3Attendees(attendanceData, year) {
  if (!Array.isArray(attendanceData)) return [];

  const targetYear = year || new Date().getFullYear();
  const personCounts = {};

  attendanceData.forEach((entry) => {
    const date = new Date(entry.meeting_date);
    if (date.getFullYear() === targetYear && entry.type !== "district" && !isApologyEntry(entry)) {
      personCounts[entry.name] = (personCounts[entry.name] || 0) + 1;
    }
  });

  const topAttendees = Object.entries(personCounts)
    .filter(([_, count]) => count >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return topAttendees;
}

// Function to get top 3 congregations (local only)
export function getTop3Congregations(attendanceData, year) {
  if (!Array.isArray(attendanceData)) return [];

  const targetYear = year || new Date().getFullYear();
  const congregationCounts = {};

  attendanceData.forEach((entry) => {
    const date = new Date(entry.meeting_date);
    if (date.getFullYear() === targetYear && entry.type !== "district" && !isApologyEntry(entry)) {
      congregationCounts[entry.congregation] = (congregationCounts[entry.congregation] || 0) + 1;
    }
  });

  const topCongregations = Object.entries(congregationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return topCongregations;
}
