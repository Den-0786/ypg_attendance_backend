/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@components/hooks/useAuth";
import { useAuthStore } from "@components/store/authStore";
import LoginForm from "@components/LoginForm";
import { toast } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-600 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-600 animate-pulse opacity-20"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 backdrop-blur-lg bg-white/10 rounded-3xl px-6 py-4 shadow-2xl border border-white/20 flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
          <span className="text-white font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <LoginForm onLogin={onLogin} />
      {loginLoading && (
        <div className="absolute inset-0 z-50 bg-gradient-to-br from-sky-500/10 via-blue-600/10 to-cyan-600/10 backdrop-blur-md" />
      )}
    </div>
  );
}
