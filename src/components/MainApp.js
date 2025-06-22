'use client';
import AttendanceForm from '@components/AttendanceForm';
import ApologyForm from '@components/ApologyForm';

export default function MainApp({ activeTab, setActiveTab, handleLogout }) {
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
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded font-medium hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {activeTab === 'attendance' ? <AttendanceForm /> : <ApologyForm />}
        </div>
    );
}
