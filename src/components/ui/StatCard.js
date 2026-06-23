import React from "react";

const cardStyles = {
  blue: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 border-blue-200 dark:border-blue-700",
  green: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/50 border-green-200 dark:border-green-700",
  purple: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/50 dark:to-violet-900/50 border-purple-200 dark:border-purple-700",
  amber: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/50 dark:to-orange-900/50 border-amber-200 dark:border-amber-700",
  emerald: "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 border-green-200 dark:border-green-700",
  cyan: "bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 border-blue-200 dark:border-blue-700",
};

const iconColors = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
  emerald: "bg-green-500",
  cyan: "bg-blue-500",
};

const textColors = {
  blue: "text-blue-700 dark:text-blue-300",
  green: "text-green-700 dark:text-green-300",
  purple: "text-purple-700 dark:text-purple-300",
  amber: "text-amber-700 dark:text-amber-300",
  emerald: "text-green-700 dark:text-green-300",
  cyan: "text-blue-700 dark:text-blue-300",
};

const valueColors = {
  blue: "text-blue-900 dark:text-blue-100",
  green: "text-green-900 dark:text-green-100",
  purple: "text-purple-900 dark:text-purple-100",
  amber: "text-amber-900 dark:text-amber-100",
  emerald: "text-green-900 dark:text-green-100",
  cyan: "text-blue-900 dark:text-blue-100",
};

const icons = {
  document: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  building: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  person: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

export default function StatCard({ title, value, color = "blue", icon = "document" }) {
  return (
    <div className={`p-4 md:p-5 border rounded-2xl shadow-lg hover:shadow-xl transition-shadow ${cardStyles[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 ${iconColors[color]} rounded-lg flex items-center justify-center`}>
          {icons[icon]}
        </div>
        <h3 className="text-xs md:text-sm font-semibold">{title}</h3>
      </div>
      <p className={`text-2xl md:text-3xl font-bold ${valueColors[color]}`}>
        {value}
      </p>
    </div>
  );
}
