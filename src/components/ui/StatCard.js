import React from "react";

const cardStyles = {
  blue: "shadow-lg",
  green: "shadow-lg",
  purple: "shadow-lg",
  amber: "shadow-lg",
  emerald: "shadow-lg",
  cyan: "shadow-lg",
};

const textColors = {
  blue: "text-amber-600",
  green: "text-amber-600",
  purple: "text-amber-600",
  amber: "text-amber-600",
  emerald: "text-amber-600",
  cyan: "text-amber-600",
};

const textColorsDark = {
  blue: "text-amber-400",
  green: "text-amber-400",
  purple: "text-amber-400",
  amber: "text-amber-400",
  emerald: "text-amber-400",
  cyan: "text-amber-400",
};

const valueColors = {
  blue: "text-gray-900",
  green: "text-gray-900",
  purple: "text-gray-900",
  amber: "text-gray-900",
  emerald: "text-gray-900",
  cyan: "text-gray-900",
};

const valueColorsDark = {
  blue: "text-white",
  green: "text-white",
  purple: "text-white",
  amber: "text-white",
  emerald: "text-white",
  cyan: "text-white",
};

const iconColors = {
  blue: "bg-blue-700",
  green: "bg-amber-500",
  purple: "bg-blue-700",
  amber: "bg-amber-500",
  emerald: "bg-amber-500",
  cyan: "bg-blue-700",
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

export default function StatCard({ title, value, color = "blue", icon = "document", darkMode = false }) {
  return (
    <div className={`p-4 md:p-5 border rounded-2xl shadow-lg hover:shadow-xl transition-shadow ${cardStyles[color]} ${darkMode ? 'bg-gray-800 border-amber-500/30' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 ${iconColors[color]} rounded-lg flex items-center justify-center`}>
          {icons[icon]}
        </div>
        <h3 className={`text-xs md:text-sm font-semibold ${darkMode ? textColorsDark[color] : textColors[color]}`}>{title}</h3>
      </div>
      <p className={`text-2xl md:text-3xl font-bold ${darkMode ? valueColorsDark[color] : valueColors[color]}`}>
        {value}
      </p>
    </div>
  );
}
