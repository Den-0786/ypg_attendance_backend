import React from "react";

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className = "" 
}) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full md:max-w-xs border-2 border-gray-200 dark:border-gray-600 px-4 py-2.5 rounded-xl dark:bg-gray-700 dark:text-white text-sm md:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
      />
      <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}
