// /* eslint-disable react-hooks/exhaustive-deps */
// 'use client';
// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { MeetingDateProvider } from '@components/MeetingDateContext';
// import LoginForm from '@components/LoginForm';
// import MeetingDateForm from '@components/MeetingDateForm';
// import Dashboard from '@components/dashboard/page';
// import MainApp from '@components/MainApp';
// import { toast } from 'react-hot-toast';

// let inactivityTimeout;

// export default function Page() {
//   const router = useRouter();
//   const [loggedIn, setLoggedIn] = useState(false);
//   const [meetingSet, setMeetingSet] = useState(false);
//   const [userRole, setUserRole] = useState(null);
//   const [activeTab, setActiveTab] = useState('attendance');
//   const [isLoading, setIsLoading] = useState(true);

//   // 🔁 Check backend session on first load
//   useEffect(() => {
//     const checkSession = async () => {
//       try {
//         const res = await fetch('http://127.0.0.1:8000/api/session-status/', {
//           credentials: 'include',
//         });

//         if (!res.ok) {
//           toast.error(`Session check failed with status ${res.status}`);
//           setLoggedIn(false);
//           setUserRole(null);
//           setMeetingSet(false);
//           setIsLoading(false);
//           return;
//         }

//         const data = await res.json();

//         if (data.loggedIn) {
//           setLoggedIn(true);
//           setUserRole(data.role);
//           setMeetingSet(data.role === 'admin' ? true : data.meetingSet || false);
//         } else {
//           setLoggedIn(false);
//           setUserRole(null);
//           setMeetingSet(false);
//         }
//       } catch (err) {
//         console.error('Session check failed:', err);
//         toast.error('Session check failed');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     checkSession();
//   }, []);

//   // 🔐 Auto-logout after 3 mins of inactivity
//   useEffect(() => {
//     if (!loggedIn) return;

//     const handleActivity = () => {
//       clearTimeout(inactivityTimeout);
//       inactivityTimeout = setTimeout(() => {
//         toast('Logged out due to inactivity');
//         handleLogout();
//       }, 3 * 60 * 1000);
//     };

//     const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
//     events.forEach((event) => window.addEventListener(event, handleActivity));
//     handleActivity();

//     return () => {
//       events.forEach((event) => window.removeEventListener(event, handleActivity));
//       clearTimeout(inactivityTimeout);
//     };
//   }, [loggedIn]);

//   // 🔑 Backend login handler
//   const handleLogin = async (username, password) => {
//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/login/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify({ username, password }),
//       });

//       if (!res.ok) {
//         // Try to parse error response JSON
//         let errorData = {};
//         try {
//           errorData = await res.json();
//         } catch {
//           // ignore JSON parse errors here
//         }
//         toast.error(errorData.error || `Login failed with status ${res.status}`);
//         return;
//       }

//       const data = await res.json();
//       setLoggedIn(true);
//       setUserRole(data.role);
//       setMeetingSet(data.role === 'admin' ? true : false);
//       toast.success('Login successful!');
//     } catch (err) {
//       console.error('Network error during login:', err);
//       toast.error('Network error during login. Please try again.');
//     }
//   };

//   // 🚪 Logout handler
//   const handleLogout = async () => {
//     try {
//       await fetch('http://127.0.0.1:8000/api/logout/', {
//         method: 'POST',
//         credentials: 'include',
//       });
//     } catch (err) {
//       console.error('Logout failed:', err);
//     }

//     setLoggedIn(false);
//     setUserRole(null);
//     setMeetingSet(false);
//     router.push('/');
//     toast.success('Logged out successfully');
//   };

//   // 🕐 Show loading spinner while checking session
//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         Loading...
//       </div>
//     );
//   }

//   // 🔐 Show login if not logged in
//   if (!loggedIn) {
//     return <LoginForm onLogin={handleLogin} />;
//   }

//   // 🧑‍💼 Admin sees dashboard
//   if (userRole === 'admin') {
//     return <Dashboard onLogout={handleLogout} />;
//   }

//   // 👤 User without meeting date sees meeting date form
//   if (userRole === 'user' && !meetingSet) {
//     return (
//       <MeetingDateProvider>
//         <MeetingDateForm
//           onContinue={() => {
//             setMeetingSet(true);
//             toast.success('Meeting date set successfully!');
//           }}
//         />
//       </MeetingDateProvider>
//     );
//   }

//   // ✅ Logged in user with meeting set sees main app
//   return (
//     <MeetingDateProvider>
//       <MainApp
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         handleLogout={handleLogout}
//       />
//     </MeetingDateProvider>
//   );
// }

/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MeetingDateProvider } from '@components/MeetingDateContext';
import LoginForm from '@components/LoginForm';
import MeetingDateForm from '@components/MeetingDateForm';
import Dashboard from '@components/dashboard/page';
import MainApp from '@components/MainApp';
import { toast } from 'react-hot-toast';

const BASE_URL = 'https://ypg-attendance-backend-1.onrender.com';
let inactivityTimeout;

export default function Page() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [meetingSet, setMeetingSet] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('attendance');
  const [isLoading, setIsLoading] = useState(true);

  // 🔁 Check backend session on first load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/session-status/`, {
          credentials: 'include',
        });

        if (!res.ok) {
          toast.error(`Session check failed with status ${res.status}`);
          setLoggedIn(false);
          setUserRole(null);
          setMeetingSet(false);
          setIsLoading(false);
          return;
        }

        const data = await res.json();

        if (data.loggedIn) {
          setLoggedIn(true);
          setUserRole(data.role);
          setMeetingSet(data.role === 'admin' ? true : data.meetingSet || false);
        } else {
          setLoggedIn(false);
          setUserRole(null);
          setMeetingSet(false);
        }
      } catch (err) {
        console.error('Session check failed:', err);
        toast.error('Session check failed');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // 🔐 Auto-logout after 3 mins of inactivity
  useEffect(() => {
    if (!loggedIn) return;

    const handleActivity = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        toast('Logged out due to inactivity');
        handleLogout();
      }, 3 * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, handleActivity));
    handleActivity();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimeout(inactivityTimeout);
    };
  }, [loggedIn]);

  // 🔑 Backend login handler
  const handleLogin = async (username, password) => {
    try {
      const res = await fetch(`${BASE_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        let errorData = {};
        try {
          errorData = await res.json();
        } catch {}
        toast.error(errorData.error || `Login failed with status ${res.status}`);
        return;
      }

      const data = await res.json();
      setLoggedIn(true);
      setUserRole(data.role);
      setMeetingSet(data.role === 'admin' ? true : false);
      toast.success('Login successful!');
    } catch (err) {
      console.error('Network error during login:', err);
      toast.error('Network error during login. Please try again.');
    }
  };

  // 🚪 Logout handler
  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/api/logout/`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout failed:', err);
    }

    setLoggedIn(false);
    setUserRole(null);
    setMeetingSet(false);
    router.push('/');
    toast.success('Logged out successfully');
  };

  // 🕐 Show loading spinner while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // 🔐 Show login if not logged in
  if (!loggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // 🧑‍💼 Admin sees dashboard
  if (userRole === 'admin') {
    return <Dashboard onLogout={handleLogout} />;
  }

  // 👤 User without meeting date sees meeting date form
  if (userRole === 'user' && !meetingSet) {
    return (
      <MeetingDateProvider>
        <MeetingDateForm
          onContinue={() => {
            setMeetingSet(true);
            toast.success('Meeting date set successfully!');
          }}
        />
      </MeetingDateProvider>
    );
  }

  // ✅ Logged in user with meeting set sees main app
  return (
    <MeetingDateProvider>
      <MainApp
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />
    </MeetingDateProvider>
  );
}
