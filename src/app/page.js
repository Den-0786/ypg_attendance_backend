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
      // Only clean up storage items, don't force redirects
      if (window.location.pathname === "/") {
        localStorage.removeItem("redirectToLogin");
        sessionStorage.removeItem("redirectToLogin");
        sessionStorage.removeItem("loginPage");
      }
    }
  }, []);

  return (
    <main className="h-screen w-full flex flex-col items-center justify-between bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 relative overflow-hidden px-4">
      <svg
        width="400"
        height="600"
        viewBox="0 0 400 600"
        className="absolute left-0 top-0 z-0 pointer-events-none"
        style={{ height: "100vh" }}
      >
        <defs>
          <linearGradient id="fadeArc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
            <stop offset="80%" stopColor="#60a5fa" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M -50 80 Q 100 0 300 100"
          stroke="url(#fadeArc)"
          strokeWidth="5"
          fill="none"
        />
        <path
          d="M -50 350 Q 120 500 350 400"
          stroke="url(#fadeArc)"
          strokeWidth="5"
          fill="none"
        />
      </svg>

      <div className="flex flex-col md:flex-row items-center relative bottom-[3rem] justify-center w-full max-w-6xl gap-8 z-10 md:items-start flex-1 mt-4 md:mt-8">
        <div className="relative flex flex-col top-[6rem] items-center justify-center w-40 h-40 md:w-60 md:h-60">
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
              stroke="#3b82f6"
              strokeWidth="5"
            />
            <circle
              cx="110"
              cy="110"
              r="70"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2.5"
            />
            <defs>
              <path id="curveText" d="M20,110 a90,90 0 1,1 180,0" fill="none" />
            </defs>
            <text
              width="100%"
              style={{
                fontFamily: "sans-serif",
                fontWeight: "bold",
                letterSpacing: 2,
              }}
            >
              <textPath
                xlinkHref="#curveText"
                startOffset="50%"
                textAnchor="middle"
                fill="#3b82f6"
                fontSize="1.05rem"
                dominantBaseline="middle"
              >
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
        <div className="flex flex-col gap-2 md:gap-3 w-full max-w-md">
          {features.map((f, i) => (
            <div key={i} className="flex items-center h-14 md:h-16">
              <div className="flex-shrink-0 z-10 w-10 h-14 flex items-center justify-center -mr-2">
                <svg
                  width="44"
                  height="56"
                  viewBox="0 0 44 56"
                  className="block"
                >
                  <polygon points="44,0 14,28 44,56" fill="#2563eb" />
                  <circle cx="14" cy="28" r="12" fill="#2563eb" />
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
                <div className="flex flex-col justify-center h-full bg-white/90 rounded-lg shadow px-4 py-2 border-l-4 border-blue-400 text-sm md:text-base">
                  <div className="font-bold text-blue-700">{f.title}</div>
                  <div className="text-gray-600 text-xs md:text-sm">
                    {f.desc}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full z-10 flex flex-col relative bottom-[2rem] items-center justify-center pb-8">
        <svg
          viewBox="0 0 1440 300"
          width="100%"
          height="300"
          preserveAspectRatio="none"
          className="absolute left-0 bottom-0 w-full"
        >
          <path
            d="M0,250 Q360,180 720,240 T1440,180 V320 H0 Z"
            fill="#2563eb"
          />
          <path
            d="M0,300 Q400,220 900,280 T1440,220 V320 H0 Z"
            fill="#60a5fa"
            opacity="0.8"
          />
        </svg>
        <div className="relative z-20 flex flex-col items-center justify-center pt-8 pb-4">
          <button
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-full shadow transition-colors mb-4"
            onClick={() => router.push("/login")}
          >
            Login
          </button>
        </div>
      </div>

      <div className="absolute bottom-[4rem] left-0 right-0 text-center text-gray-100 text-xs z-20">
        &copy; {new Date().getFullYear()} Ahinsan District YPG. All rights
        Reserved.
      </div>
    </main>
  );
}
