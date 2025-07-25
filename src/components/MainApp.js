'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AttendanceForm from '@components/AttendanceForm';
import ApologyForm from '@components/ApologyForm';
import PINModal from '@components/PINModal';

export default function MainApp({ activeTab, setActiveTab, handleLogout, meetingInfo, showManageMeeting = false, onManageMeeting }) {
    const router = useRouter();
    const [showPINModal, setShowPINModal] = useState(false);

    const handleGoToDashboard = () => {
        setShowPINModal(true);
    };

    const handlePINSuccess = () => {
        // PIN verification successful, navigate to dashboard
        router.replace('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-100 pt-24 sm:pt-20"> 
            <header className="fixed top-0 left-0 right-0 bg-gray-200 z-10 shadow">
                <div className="container mx-auto grid grid-cols-2 sm:flex sm:flex-row flex-wrap justify-center items-center gap-2 py-3 px-2">
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`w-full sm:w-auto px-2 py-1 rounded font-medium transition text-sm sm:text-sm md:text-base
                            ${activeTab === 'attendance'
                                ? 'bg-green-600 text-white'
                                : 'bg-green-300 text-black hover:bg-green-500 hover:text-white'}
                        `}
                    >
                        Attendance
                    </button>
                    <button
                        onClick={() => setActiveTab('apology')}
                        className={`w-full sm:w-auto px-2 py-1 rounded font-medium transition text-sm sm:text-sm md:text-base
                            ${activeTab === 'apology'
                                ? 'bg-amber-500 text-white'
                                : 'bg-amber-300 text-black hover:bg-amber-400 hover:text-white'}
                        `}
                    >
                        Apology
                    </button>
                    <button
                        onClick={handleGoToDashboard}
                        className="w-full sm:w-auto bg-blue-600 text-white px-2 py-1 rounded font-medium hover:bg-blue-700 transition text-sm sm:text-sm md:text-base"
                    >
                        Go to Dashboard
                    </button>
                    {showManageMeeting && (
                        <button
                            onClick={onManageMeeting}
                            className="w-full sm:w-auto bg-yellow-500 text-white px-2 py-1 rounded font-medium hover:bg-yellow-600 transition text-sm sm:text-sm md:text-base"
                        >
                            Manage Meeting
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto bg-red-500 text-white px-2 py-1 rounded font-medium hover:bg-red-600 transition text-sm sm:text-sm md:text-base"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="flex flex-col items-center justify-center w-full px-2 mt-6 sm:mt-10">
                <div className="w-full max-w-lg bg-white rounded shadow p-4 sm:p-6 md:p-8">
                    {activeTab === 'attendance' ? <AttendanceForm meetingInfo={meetingInfo} /> : <ApologyForm meetingInfo={meetingInfo} />}
                </div>
            </main>

            {/* PIN Modal for Dashboard Access */}
            <PINModal
                isOpen={showPINModal}
                onClose={() => setShowPINModal(false)}
                onSuccess={handlePINSuccess}
                title="Enter PIN to Access Dashboard"
                message="Please enter the 4-digit PIN to access the dashboard"
            />
        </div>
    );
}
