'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import PasswordInput from '../PasswordInput';

export default function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);

    const handleChange = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match");
        return;
        }

        if (!isNewPasswordValid) {
        toast.error("Password doesn't meet requirements");
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

    return (
        <form
        onSubmit={handleChange}
        className="max-w-md mx-auto bg-white p-6 rounded shadow-md dark:bg-gray-800 dark:text-white space-y-4"
        >
        <h2 className="text-xl font-bold">Change Password</h2>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
            </label>
            <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white text-sm"
                required
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
            </label>
            <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password"
                label=""
                required={true}
                showStrength={true}
                maxLength={8}
                onValidationChange={setIsNewPasswordValid}
            />
        </div>
        
        <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900 p-2 rounded">
            <strong>Password Requirements:</strong> Exactly 8 characters with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
            </label>
            <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.slice(0, 8))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white text-sm"
                required
            />
        </div>

        {confirmPassword && newPassword !== confirmPassword && (
            <div className="text-red-500 text-sm">
                Passwords do not match
            </div>
        )}

        <button
            type="submit"
            disabled={isLoading || !isNewPasswordValid || newPassword !== confirmPassword}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            {isLoading ? 'Changing...' : 'Change Password'}
        </button>
        </form>
    );
}
