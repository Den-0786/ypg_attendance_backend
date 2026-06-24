"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const features = [
  {
    title: "Easy Attendance",
    desc: "Quickly log and track attendance for all meetings.",
  },
  {
    title: "Apology Management",
    desc: "Submit and review apologies with ease.",
  },
  {
    title: "Visual Reports",
    desc: "Instantly see attendance trends and summaries.",
  },
  {
    title: "Task Reminders",
    desc: "Stay updated on upcoming meetings and tasks.",
  },
  { title: "Secure Access", desc: "Safe, role-based login for all users." },
];

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/") {
        localStorage.removeItem("redirectToLogin");
        sessionStorage.removeItem("redirectToLogin");
        sessionStorage.removeItem("loginPage");
      }
    }
  }, []);

  return (
    <main className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden px-4 py-0" style={{background: 'linear-gradient(135deg, #0a1628 0%, #0d2144 40%, #0f2d5c 70%, #1a3a6e 100%)'}}>
      {/* Gold shimmer orbs */}
      <div className="absolute top-[-6rem] left-[-6rem] w-96 h-96 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)'}} />
      <div className="absolute bottom-[-4rem] right-[-4rem] w-80 h-80 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(212,168,67,0.14) 0%, transparent 70%)'}} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none" style={{background: 'radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%)'}} />

      {/* Background wave design */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 800"
        className="absolute inset-0 z-0 pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#d4a843" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#b8860b" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <path
          d="M0,600 Q360,500 720,650 T1440,550 V800 H0 Z"
          fill="url(#bgGradient)"
        />
        <path
          d="M0,700 Q400,600 900,750 T1440,650 V800 H0 Z"
          fill="#c9a84c"
          opacity="0.07"
        />
      </svg>

      {/* Content */}
      <div className="flex flex-col relative bottom-[4rem] lg:top-[8rem] md:flex-row items-center justify-center w-full max-w-6xl gap-6 z-10 md:items-start flex-1 ">
        {/* Logo Circle */}
        <div className="relative flex flex-col items-center justify-center w-36 h-36 md:w-52 md:h-52">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 220 220"
            className="absolute z-0"
          >
            <circle
              cx="110"
              cy="110"
              r="100"
              fill="none"
              stroke="#c9a84c"
              strokeWidth="5"
            />
            <circle
              cx="110"
              cy="110"
              r="70"
              fill="none"
              stroke="#d4a843"
              strokeWidth="2.5"
            />
            <defs>
              <path
                id="curveTop"
                d="M15,110 a95,95 0 1,1 190,0"
                fill="none" />
              <path
                id="curveBottom"
                d="M15,110 a95,95 0 0,0 190,0"
                fill="none" />
            </defs>
            <text style={{fontFamily: 'sans-serif', fontWeight: 'bold'}}>
              <textPath
                xlinkHref="#curveTop"
                startOffset="50%"
                textAnchor="middle"
                fill="#c9a84c"
                fontSize="0.72rem"
              >
                Ahinsan District YPG
              </textPath>
            </text>
            <text style={{fontFamily: 'sans-serif', fontWeight: 'bold'}}>
              <textPath
                xlinkHref="#curveBottom"
                startOffset="50%"
                textAnchor="middle"
                fill="#d4a843"
                fontSize="0.72rem"
                dy="-6"
              >
                Attendance WebApp
              </textPath>
            </text>
          </svg>

          <div className="absolute z-1 w-16 h-16 md:w-18 md:h-18 rounded-full bg-white flex items-center justify-center shadow-2xl border-4" style={{borderColor: '#c9a84c'}}>
            <Image
              src="/ypg.jpeg"
              alt="YPG Logo"
              width={80}
              height={80}
              className="object-cover w-12 h-12 md:w-14 md:h-14 rounded-full"
            />
          </div>
        </div>

        {/* Features List */}
        <div className="flex flex-col gap-1 md:gap-2 w-full max-w-md -mt-14 md:-mt-12">
          {features.map((f, i) => (
            <div key={i} className="flex items-center h-12 md:h-14">
              <div className="flex-shrink-0 z-10 w-10 h-14 flex items-center justify-center -mr-2">
                <svg
                  width="44"
                  height="56"
                  viewBox="0 0 44 56"
                  className="block"
                >
                  <polygon points="44,0 14,28 44,56" fill="#c9a84c" />
                  <circle cx="14" cy="28" r="12" fill="#c9a84c" />
                  <text
                    x="14"
                    y="34"
                    textAnchor="middle"
                    fontSize="1.3rem"
                    fill="#fff"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {i + 1}
                  </text>
                </svg>
              </div>

              <div className="flex-1 relative">
                <div className="flex flex-col justify-center h-full rounded-lg shadow px-3 py-1 border-l-4 text-xs md:text-sm" style={{background: 'rgba(255,255,255,0.07)', borderColor: '#c9a84c'}}>
                  <div className="font-bold text-xs" style={{color: '#f0c040'}}>{f.title}</div>
                  <div className="text-xs" style={{color: '#c8d6e8'}}>{f.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simple login button */}
      <div className="relative bottom-[9rem] lg:bottom-[4rem] z-20 flex flex-row items-center justify-center gap-4 pb-0 ">
        <a
          href="https://ypg-website.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{color: '#c9a84c'}}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Main Website
        </a>
        <button
          className="px-8 py-2 text-white text-base font-semibold rounded-full shadow-lg transition-colors" style={{background: 'linear-gradient(90deg, #b8860b, #d4a843, #c9a84c)'}}
          onClick={() => router.push("/login")}
        >
          Login
        </button>
      </div>
    </main>
  );
}
