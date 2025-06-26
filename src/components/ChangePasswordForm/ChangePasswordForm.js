'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match");
        return;
        }

        if (!isStrongPassword()) {
        toast.error("Password doesn't meet strength requirements");
        return;
        }

        try {
        const res = await fetch(`/api/change-password`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
            })
        });

        const data = await res.json();
        if (res.ok) {
            toast.success(data.message || "Password changed successfully");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            toast.error(data.error || "Failed to change password");
        }
        } catch (error) {
        console.error('Error changing password:', error);
        toast.error('Network error occurred');
        } finally {
        setIsLoading(false);
        }
    };

    // 🔐 Password strength checks
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[@$!%*?&#^+=]/.test(newPassword);
    const hasMinLength = newPassword.length >= 8;

    const strengthCount = [hasUppercase, hasLowercase, hasNumber, hasSymbol, hasMinLength].filter(Boolean).length;
    const isStrongPassword = () => strengthCount === 5;

    const renderCheck = (condition) =>
        condition ? <FaCheckCircle className="text-green-500" /> : <FaTimesCircle className="text-red-500" />;

    return (
        <form
        onSubmit={handleChange}
        className="max-w-md mx-auto bg-white p-6 rounded shadow-md dark:bg-gray-800 dark:text-white space-y-4"
        >
        <h2 className="text-xl font-bold">Change Password</h2>

        <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700"
            required
        />

        <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700"
            required
        />

        {/* ✅ Strength Indicator */}
        {newPassword && (
            <>
            {/* 🔵 Progress Bar */}
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

            {/* ✅ Checklist */}
            <div className="text-sm bg-gray-100 dark:bg-gray-700 rounded p-3 mt-2 space-y-1">
                <div className="flex items-center gap-2">{renderCheck(hasUppercase)} At least one uppercase letter</div>
                <div className="flex items-center gap-2">{renderCheck(hasLowercase)} At least one lowercase letter</div>
                <div className="flex items-center gap-2">{renderCheck(hasNumber)} At least one number</div>
                <div className="flex items-center gap-2">{renderCheck(hasSymbol)} At least one symbol (e.g. @, #, $)</div>
                <div className="flex items-center gap-2">{renderCheck(hasMinLength)} Minimum 8 characters</div>
            </div>
            </>
        )}

        <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700"
            required
        />

        <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
            Change Password
        </button>
        </form>
    );
}
