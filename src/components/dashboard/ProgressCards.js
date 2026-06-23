import React from "react";
import { getLocalProgress, getDistrictProgress } from "../../lib/dashboardHelpers";

export default function ProgressCards({ localProgress, districtProgress, selectedYear }) {
  const progressCardClass =
    "flex flex-col justify-between items-center p-5 rounded-2xl shadow-xl min-w-[260px] max-w-xs w-full backdrop-blur-sm border border-white/20";

  return (
    <div className="flex gap-4 mb-6 mt-2 items-center overflow-x-auto custom-scrollbar snap-x snap-mandatory pl-8 pr-4">
      <div
        className={
          progressCardClass +
          " bg-gradient-to-br from-blue-600 to-indigo-700 text-white min-w-[280px] snap-start"
        }
      >
        <div className="font-bold text-lg mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Local Congregations Progress
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="url(#blueGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - localProgress / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(.4,2,.3,1)" }}
              />
              <defs>
                <linearGradient
                  id="blueGradient"
                  x1="0"
                  y1="0"
                  x2="64"
                  y2="64"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-xl font-bold">{localProgress}%</span>
          </div>
          <div className="flex flex-col text-sm">
            <span>Yearly Progress: {localProgress}%</span>
            <span>Current Year: {selectedYear || new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
      <div
        className={
          progressCardClass +
          " bg-gradient-to-br from-emerald-600 to-green-700 text-white min-w-[280px] snap-center"
        }
      >
        <div className="font-bold text-lg mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          District Executives Progress
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="url(#greenGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - districtProgress / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(.4,2,.3,1)" }}
              />
              <defs>
                <linearGradient
                  id="greenGradient"
                  x1="0"
                  y1="0"
                  x2="64"
                  y2="64"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#10b981" />
                  <stop offset="1" stopColor="#6ee7b7" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-xl font-bold">{districtProgress}%</span>
          </div>
          <div className="flex flex-col text-sm">
            <span>Yearly Progress: {districtProgress}%</span>
            <span>Current Year: {selectedYear || new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
