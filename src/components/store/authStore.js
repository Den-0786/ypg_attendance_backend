// store/authStore.js
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    loggedIn: false,
    userRole: null,
    meetingSet: false,
    setLoggedIn: (val) => set({ loggedIn: val }),
    setUserRole: (val) => set({ userRole: val }),
    setMeetingSet: (val) => set({ meetingSet: val }),
}));
