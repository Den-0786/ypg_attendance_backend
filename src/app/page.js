// ✅ TODO: After login is stable and project grows:

// 1. Move this logic to _app.js or layout.tsx for global auth protection.
// 2. Add route guards or middleware to redirect unauthenticated users.
// 3. Replace Zustand with Redux if you need more complex state handling.
// */

'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@components/hooks/useAuth';
import { useAuthStore } from '@components/store/authStore';
import LoginForm from '@components/LoginForm';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-blue-300 to-green-200 dark:from-gray-900 dark:via-blue-900 dark:to-green-900">
      <div className="max-w-lg w-full px-6 py-12 bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl flex flex-col items-center">
        <div className="mb-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center mb-2 shadow-lg">
            <Image src="/ypg.jpeg" alt="YPG Logo" width={80} height={80} className="object-cover w-full h-full" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-800 dark:text-blue-200 mb-2 text-center">Welcome to Ahinsan District YPG markify</h1>
          <p className="text-gray-700 dark:text-gray-300 text-center text-lg max-w-xs">A modern platform for tracking, managing, and analyzing attendance and apologies for local congregations and district executives.</p>
        </div>
        <button
          className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-full shadow transition-colors"
          onClick={() => router.push('/login')}
        >
          Login
        </button>
        <div className="mt-6 text-center text-blue-700 dark:text-blue-200 text-base max-w-xs">
          <div className="font-bold">YPG ... Service all the way</div>
          <div className="italic mt-1">YOU ... Practice Godliness ....</div>
        </div>
      </div>
      <div className="mt-10 text-center text-gray-500 dark:text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} YPG Attendance App. All rights reserved.
      </div>
    </div>
  );
}

// Add spinner CSS if not present
// .loader { border-style: solid; border-radius: 50%; border-width: 8px; border-top-width: 8px; animation: spin 1s linear infinite; }
// @keyframes spin { 100% { transform: rotate(360deg); } }
