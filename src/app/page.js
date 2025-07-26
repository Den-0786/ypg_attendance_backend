'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

const features = [
  { title: 'Easy Attendance', desc: 'Quickly log and track attendance for all meetings.' },
  { title: 'Apology Management', desc: 'Submit and review apologies with ease.' },
  { title: 'Visual Reports', desc: 'Instantly see attendance trends and summaries.' },
  { title: 'Task Reminders', desc: 'Stay updated on upcoming meetings and tasks.' },
  { title: 'Secure Access', desc: 'Safe, role-based login for all users.' },
];

export default function Page() {
  const router = useRouter();
  
  // Clear any cached redirects on home page load
  useEffect(() => {
    // Clear any cached login redirects
    if (typeof window !== 'undefined') {
      // Force browser to not cache this page
      window.history.replaceState(null, '', window.location.pathname);
      
      // Clear any localStorage that might be causing redirects
      const currentPath = window.location.pathname;
      if (currentPath === '/') {
        // We're on home page, clear any cached login state
        localStorage.removeItem('redirectToLogin');
        sessionStorage.removeItem('redirectToLogin');
        sessionStorage.removeItem('loginPage');
        
        // Force browser to remember this as the home page
        if (window.history.state !== null) {
          window.history.replaceState({ page: 'home' }, '', '/');
        }
        
        // If somehow we're redirected to login, force back to home
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
  }, []);
  
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-end bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 relative overflow-hidden px-4 pb-20 md:py-4">
      
    
      <svg width="400" height="600" viewBox="0 0 400 600" className="absolute left-0 top-0 z-0 pointer-events-none" style={{height:'100vh', minHeight:'600px'}}>
        <defs>
          <linearGradient id="fadeArc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
            <stop offset="80%" stopColor="#60a5fa" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M -50 80 Q 100 0 300 100" stroke="url(#fadeArc)" strokeWidth="5" fill="none" />
        <path d="M -50 350 Q 120 500 350 400" stroke="url(#fadeArc)" strokeWidth="5" fill="none" />
      </svg>

      
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl gap-8 z-10 md:items-start min-h-[400px] mb-10 md:mb-0">
    
        <div className="relative flex flex-col items-center justify-center w-40 h-40 md:w-60 md:h-60 -mt-8 md:mt-0 md:ml-8">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 220 220"
            className="absolute z-0"
          >
            <circle cx="110" cy="110" r="100" fill="none" stroke="#3b82f6" strokeWidth="5" />
            <circle cx="110" cy="110" r="70" fill="none" stroke="#60a5fa" strokeWidth="2.5" /> 
            <defs>
              <path id="curveText" d="M20,110 a90,90 0 1,1 180,0" fill="none" />
            </defs>
            <text width="100%" style={{ fontFamily: 'sans-serif', fontWeight: 'bold', letterSpacing: 2 }}>
              <textPath xlinkHref="#curveText" startOffset="50%" textAnchor="middle" fill="#3b82f6" fontSize="1.05rem" dominantBaseline="middle">
                Ahinsan District YPG Markify
              </textPath>
            </text>
          </svg>

          <div className="absolute z-1 w-20 h-20 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center shadow-2xl border-4 border-blue-300">
            <Image 
              src="/ypg.jpeg" 
              alt="YPG Logo" 
              width={80} 
              height={80} 
              className="object-cover w-16 h-16 md:w-16 md:h-16 rounded-full"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 md:gap-3 w-full max-w-md -mt-[6.5rem] md:mt[4rem] md:ml-8">
          {features.map((f, i) => (
            <div key={i} className="flex items-center h-14 md:h-16">
              <div className="flex-shrink-0 z-10 w-10 h-14 flex items-center justify-center -mr-2">
                <svg width="44" height="56" viewBox="0 0 44 56" className="block">
                  <polygon points="44,0 14,28 44,56" fill="#2563eb" />
                  <circle cx="14" cy="28" r="12" fill="#2563eb" />
                  <text x="14" y="34" textAnchor="middle" fontSize="1.3rem" fill="#fff" fontWeight="bold" fontFamily="sans-serif">{i+1}</text>
                </svg>
              </div>
            
              <div className="flex-1 relative">
                <div className="flex flex-col justify-center h-full bg-white/90 rounded-lg shadow px-4 py-2 border-l-4 border-blue-400 text-sm md:text-base">
                  <div className="font-bold text-blue-700">{f.title}</div>
                  <div className="text-gray-600 text-xs md:text-sm">{f.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute left-0 right-0 bottom-0 w-full z-10 flex flex-col items-center justify-end" style={{height:'320px'}}>
        <svg viewBox="0 0 1440 320" width="100%" height="320" preserveAspectRatio="none" className="absolute left-0 bottom-0 w-full h-full">
          <path d="M0,210 Q360,140 720,200 T1440,140 V320 H0 Z" fill="#2563eb" />
          <path d="M0,260 Q400,180 900,240 T1440,180 V320 H0 Z" fill="#60a5fa" opacity="0.8" />
        </svg>
        <div className="relative z-20 flex flex-col items-center justify-center" style={{marginTop:'80px', marginBottom:'30px'}}>
          <button
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-full shadow transition-colors mb-2"
            onClick={() => router.push('/login')}
          >
            Login
          </button>
          <div className="text-blue-100 text-sm max-w-xs text-center">
            <div className="font-bold">YPG ... Service all the way</div>
            <div className="italic mt-1">YOU ... Practice Godliness ....</div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-2 left-0 right-0 text-center text-gray-900 text-xs z-20">
        &copy; {new Date().getFullYear()} Ahinsan District YPG. All rights reserved.
      </div>
    </main>
  );
}