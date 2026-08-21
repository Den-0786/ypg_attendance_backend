'use client';
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CustomAreaChart = ({ data, seriesConfig, title, darkMode = true }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className={`p-3 rounded-lg shadow-xl border min-w-[180px] max-h-[400px] overflow-y-auto ${darkMode ? 'bg-gray-900 border-amber-500/50 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
        <p className={`text-xs font-semibold mb-2 border-b pb-2 ${darkMode ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-300'}`}>
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => {
            const config = seriesConfig.find(s => s.dataKey === entry.dataKey);
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={`text-[10px] ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{config?.label || entry.dataKey}</span>
                </div>
                <div className="text-right">
                  <div className={`text-[11px] font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{entry.value}</div>
                  {config?.showChange && entry.payload[`${entry.dataKey}Change`] && (
                    <div
                      className={`text-[9px] ${
                        entry.payload[`${entry.dataKey}Change`] >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {entry.payload[`${entry.dataKey}Change`] >= 0 ? '+$' : '-$'}
                      {Math.abs(entry.payload[`${entry.dataKey}Change`]).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-xl p-4 md:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {title && (
        <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-amber-400' : 'text-gray-900'}`}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {seriesConfig.map((series, index) => (
              <linearGradient
                key={series.dataKey}
                id={`gradient-${series.dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={series.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={series.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={darkMode ? '#f59e0b' : '#e5e7eb'}
            strokeWidth={1}
          />

          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
            tickMargin={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
            tickMargin={10}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: darkMode ? '#f59e0b' : '#e5e7eb', strokeWidth: 1, strokeDasharray: '5 5' }}
          />

          <Legend
            wrapperStyle={{ paddingBottom: '10px' }}
            formatter={(value, entry) => (
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {value}
              </span>
            )}
          />

          {seriesConfig.map((series) => (
            <Area
              key={series.dataKey}
              type="monotone"
              dataKey={series.dataKey}
              stroke={series.color}
              strokeWidth={2}
              fill={`url(#gradient-${series.dataKey})`}
              dot={{ fill: series.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomAreaChart;