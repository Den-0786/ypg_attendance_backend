import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { MeetingDateProvider } from "@components/MeetingDateContext";
import AutoLogoutWrapper from "../components/AutoLogoutWrapper";

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
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta
          httpEquiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
