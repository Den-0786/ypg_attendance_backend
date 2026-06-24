"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import AutoLogout from "./AutoLogout";
import { BASE_URL } from "../../lib/config";

const API_URL = BASE_URL;

export default function AutoLogoutWrapper() {
  const router = useRouter();
  const store = useAuthStore();
  const loggedIn = store.loggedIn;
  const setLoggedIn = store.setLoggedIn;
  const setUserRole = store.setUserRole;

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      if (typeof setLoggedIn === "function") {
        setLoggedIn(false);
      }
      if (typeof setUserRole === "function") {
        setUserRole(null);
      }
      router.replace("/");
    }
  };

  return <AutoLogout loggedIn={loggedIn} onLogout={handleLogout} />;
}
