import React from "react";

export default function FilterButtons({ showType, setShowType, className = "" }) {
  return (
    <div className={`flex flex-wrap gap-2 md:gap-4 mb-4 ${className}`}>
      <button
        className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
          showType === "attendance"
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
            : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
        }`}
        onClick={() => setShowType("attendance")}
      >
        Attendance
      </button>
      <button
        className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
          showType === "apology"
            ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg"
            : "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
        }`}
        onClick={() => setShowType("apology")}
      >
        Apology
      </button>
      <button
        className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
          showType === "all"
            ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700/30 dark:text-gray-300 dark:hover:bg-gray-700/50"
        }`}
        onClick={() => setShowType("all")}
      >
        All
      </button>
    </div>
  );
}
