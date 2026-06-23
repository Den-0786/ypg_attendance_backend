/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A855F7', '#F97316', '#10B981'];

export default function MeetingTypePieChart() {
    const [data, setData] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [congregation, setCongregation] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

    const fetchData = async () => {
        try {
            const params = new URLSearchParams({
                year: year,
                congregation: congregation
            });
            
            const res = await fetch(`${API_URL}/api/attendance-by-meeting-title?${params}`);
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            setData(data);
        } catch (error) {
            console.error('Error fetching chart data:', error);
            toast.error('Failed to fetch chart data');
        }
    };

    useEffect(() => {
        fetchData();
    }, [year, congregation]);

    return (
        <div className="bg-gray-800 rounded-xl shadow p-6 my-8 border border-amber-500/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-amber-400">Meeting Type Distribution</h2>
            <div className="flex gap-2">
            <input
                type="number"
                min="2020"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="border px-2 py-1 rounded text-sm bg-gray-700 text-white border-gray-600 focus:border-amber-500"
                placeholder="Year"
            />
            <input
                type="text"
                value={congregation}
                onChange={(e) => setCongregation(e.target.value)}
                className="border px-2 py-1 rounded text-sm bg-gray-700 text-white border-gray-600 focus:border-amber-500"
                placeholder="Filter by congregation"
            />
            </div>
        </div>

        {data.length === 0 ? (
            <p className="text-center text-gray-500">No data available.</p>
        ) : (
            <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                data={data}
                dataKey="count"
                nameKey="meeting_title"
                outerRadius={100}
                label
                >
                {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                </Pie>
                <Tooltip 
                contentStyle={{ 
                  background: 'rgba(31, 41, 55, 0.98)', 
                  color: '#fff',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(8px)',
                  padding: '8px 12px',
                  fontSize: '12px'
                }} 
                animationDuration={200}
                isAnimationActive={true}
              />
                <Legend />
            </PieChart>
            </ResponsiveContainer>
        )}
        </div>
    );
}
