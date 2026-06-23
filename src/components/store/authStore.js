// store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      loggedIn: false,
      userRole: null,
      meetingSet: false,
      setLoggedIn: (val) => set({ loggedIn: val }),
      setUserRole: (val) => set({ userRole: val }),
      setMeetingSet: (val) => set({ meetingSet: val }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
