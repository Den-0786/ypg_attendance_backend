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
        window.location.href = '/dashboard';
    };

    return (
        <div className="min-h-screen bg-gray-100 pt-20"> 
            <header className="fixed top-0 left-0 right-0 bg-gray-200 z-10 shadow">
                <div className="flex justify-center items-center space-x-4 py-4">
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-4 py-2 rounded font-medium transition ${
                            activeTab === 'attendance'
                                ? 'bg-green-600 text-white'
                                : 'bg-green-300 text-black hover:bg-green-500 hover:text-white'
                        }`}
                    >
                        Attendance
                    </button>
                    <button
                        onClick={() => setActiveTab('apology')}
                        className={`px-4 py-2 rounded font-medium transition ${
                            activeTab === 'apology'
                                ? 'bg-amber-500 text-white'
                                : 'bg-amber-300 text-black hover:bg-amber-400 hover:text-white'
                        }`}
                    >
                        Apology
                    </button>
                    <button
                        onClick={handleGoToDashboard}
                        className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
                    >
                        Go to Dashboard
                    </button>
                    {showManageMeeting && (
                        <button
                            onClick={onManageMeeting}
                            className="bg-yellow-500 text-white px-4 py-2 rounded font-medium hover:bg-yellow-600 transition"
                        >
                            Manage Meeting
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded font-medium hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {activeTab === 'attendance' ? <AttendanceForm meetingInfo={meetingInfo} /> : <ApologyForm meetingInfo={meetingInfo} />}

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
