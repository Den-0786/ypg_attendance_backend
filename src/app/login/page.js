/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@components/hooks/useAuth";
import { useAuthStore } from "@components/store/authStore";
import LoginForm from "@components/forms/LoginForm";
import { toast } from "react-hot-toast";
import { BASE_URL } from "../../lib/config";

const API_URL = BASE_URL;

export default function LoginPage() {
  const { handleLogin, loggedIn, userRole } = useAuth();
  const store = useAuthStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("loginPage");

      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const setLoggedIn = store.setLoggedIn;
  const setUserRole = store.setUserRole;
  const setMeetingSet = store.setMeetingSet;

  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const hasInitialized = useRef(false);

  const allowedRoles = ["admin", "user"];

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      setIsLoading(false);
    }
  }, [setLoggedIn, setUserRole, setMeetingSet]);

  const onLogin = async (username, password) => {
    setLoginLoading(true);
    try {
      const role = await handleLogin(username, password);
      if (role === "admin") {
        router.replace("/dashboard");
      } else if (role === "user") {
        router.replace("/forms");
      }
    } catch (error) {
      if (error.isLoginError) {
      } else {
        console.error("Login failed:", error);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0a1628 0%, #0d2144 40%, #0f2d5c 70%, #1a3a6e 100%)'}}>
        <div className="absolute top-[-6rem] left-[-6rem] w-96 h-96 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)'}} />
        <div className="absolute bottom-[-4rem] right-[-4rem] w-80 h-80 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(212,168,67,0.14) 0%, transparent 70%)'}} />
        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full animate-spin" style={{border: '3px solid rgba(201,168,76,0.15)', borderTopColor: '#c9a84c'}}></div>
            <div className="absolute inset-2 rounded-full animate-spin" style={{border: '2px solid rgba(212,168,67,0.1)', borderTopColor: '#d4a843', animationDirection: 'reverse', animationDuration: '0.8s'}}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full" style={{background: '#c9a84c', boxShadow: '0 0 10px #c9a84c'}}></div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold" style={{color: '#c9a84c'}}>Loading</p>
            <p className="text-xs mt-1" style={{color: 'rgba(200,214,232,0.6)'}}>Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <LoginForm onLogin={onLogin} />
      {loginLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{background: 'linear-gradient(135deg, #0a1628 0%, #0d2144 40%, #0f2d5c 70%, #1a3a6e 100%)'}}>
          <div className="absolute top-[-6rem] left-[-6rem] w-96 h-96 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)'}} />
          <div className="absolute bottom-[-4rem] right-[-4rem] w-80 h-80 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(212,168,67,0.14) 0%, transparent 70%)'}} />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full animate-spin" style={{border: '3px solid rgba(201,168,76,0.15)', borderTopColor: '#c9a84c', animationDuration: '1s'}}></div>
              <div className="absolute inset-2 rounded-full animate-spin" style={{border: '2px solid rgba(212,168,67,0.1)', borderTopColor: '#d4a843', animationDirection: 'reverse', animationDuration: '0.7s'}}></div>
              <div className="absolute inset-4 rounded-full animate-spin" style={{border: '2px solid rgba(184,134,11,0.1)', borderTopColor: '#b8860b', animationDuration: '1.4s'}}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full" style={{background: 'radial-gradient(circle, #d4a843, #b8860b)', boxShadow: '0 0 16px rgba(201,168,76,0.8)'}}></div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{color: '#c9a84c'}}>Signing you in</p>
              <p className="text-sm mt-1" style={{color: 'rgba(200,214,232,0.7)'}}>Redirecting to your dashboard...</p>
            </div>
            <div className="flex gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{background: '#c9a84c', animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{background: '#d4a843', animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{background: '#b8860b', animationDelay: '300ms'}}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
