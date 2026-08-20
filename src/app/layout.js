import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { MeetingDateProvider } from "@components/context/MeetingDateContext";
import AutoLogoutWrapper from "../components/auth/AutoLogoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "YPG Attendance App",
  description: "Ahinsan District YPG Attendance Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
      >
        <MeetingDateProvider>
          <AutoLogoutWrapper />
          <Toaster position="top-center" />
          {children}
        </MeetingDateProvider>
      </body>
    </html>
  );
}
