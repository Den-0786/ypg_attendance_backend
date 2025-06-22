'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ResetCode() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const username = searchParams.get('email');

    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    if (!username) {
        toast.error('Missing email. Start over.');
        router.push('/forgot_password');
        return null;
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[@$!%*?&#^+=]/.test(newPassword);
    const hasMinLength = newPassword.length >= 8;
    const strengthCount = [hasUppercase, hasLowercase, hasNumber, hasSymbol, hasMinLength].filter(Boolean).length;

    const renderCheck = (condition) =>
        condition ? <FaCheckCircle className="text-green-500" /> : <FaTimesCircle className="text-red-500" />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code || !newPassword || !confirmPassword) {
        toast.error('All fields are required');
        return;
        }
        if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
        }
        if (strengthCount < 5) {
        toast.error('Password does not meet all requirements');
        return;
        }

        try {
        const res = await fetch('http://127.0.0.1:8000/api/reset-password-confirm/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, code, new_password: newPassword }),
        });

        const data = await res.json();

        if (res.ok) {
            toast.success(data.message);
            router.push('/');
        } else {
            toast.error(data.error || 'Reset failed');
        }
        } catch (err) {
        toast.error('Network error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 shadow p-6 rounded max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-center">Reset Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="text"
                placeholder="Enter reset code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white"
                required
            />

            <div className="relative">
                <input
                type={showNew ? 'text' : 'password'}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white"
                required
                />
                <button
                type="button"
                className="absolute top-1/2 right-3 transform -translate-y-1/2"
                onClick={() => setShowNew(!showNew)}
                >
                {showNew ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>

            {/* Password Strength */}
            {newPassword && (
                <>
                <div className="h-2 bg-gray-300 rounded">
                    <div
                    className={`h-2 rounded transition-all duration-300 ${
                        strengthCount < 3
                        ? 'bg-red-500 w-1/4'
                        : strengthCount === 3
                        ? 'bg-yellow-500 w-2/4'
                        : strengthCount === 4
                        ? 'bg-blue-500 w-3/4'
                        : 'bg-green-500 w-full'
                    }`}
                    />
                </div>
                <div className="text-sm bg-gray-100 dark:bg-gray-700 rounded p-3 mt-2 space-y-1">
                    <div className="flex items-center gap-2">{renderCheck(hasUppercase)} One uppercase letter</div>
                    <div className="flex items-center gap-2">{renderCheck(hasLowercase)} One lowercase letter</div>
                    <div className="flex items-center gap-2">{renderCheck(hasNumber)} One number</div>
                    <div className="flex items-center gap-2">{renderCheck(hasSymbol)} One symbol</div>
                    <div className="flex items-center gap-2">{renderCheck(hasMinLength)} At least 8 characters</div>
                </div>
                </>
            )}

            <div className="relative">
                <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white"
                required
                />
                <button
                type="button"
                className="absolute top-1/2 right-3 transform -translate-y-1/2"
                onClick={() => setShowConfirm(!showConfirm)}
                >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>

            <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
                Reset Password
            </button>
            </form>
        </div>
        </div>
    );
}
