'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import PasswordInput from '@components/PasswordInput';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function ResetCode() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);

    useEffect(() => {
        const identifier = searchParams.get('identifier');
        if (!identifier) {
            toast.error('Missing email. Start over.');
            router.push('/forgot_password');
            return;
        }
        setUsername(identifier);
        setIsLoading(false);
    }, [searchParams, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="bg-white dark:bg-gray-800 shadow p-6 rounded max-w-md w-full">
                    <div className="text-center">Loading...</div>
                </div>
            </div>
        );
    }

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
        if (!isNewPasswordValid) {
        toast.error('Password does not meet requirements');
        return;
        }

        try {
        setIsSubmitting(true);
        const res = await fetch(`/api/reset-password-confirm`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
            username,
            code,
            new_password: newPassword,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            toast.success('Password reset successfully!');
            router.push('/login');
        } else {
            toast.error(data.error || 'Failed to reset password');
        }
        } catch (error) {
        console.error('Error resetting password:', error);
        toast.error('Network error occurred');
        } finally {
        setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-800 shadow p-6 rounded max-w-md w-full">
                <h2 className="text-xl font-bold mb-4 text-center">Reset Password</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Enter reset code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    
                    <PasswordInput
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder="Enter new password"
                        label="New Password"
                        required={true}
                        showStrength={true}
                        maxLength={8}
                        onValidationChange={setIsNewPasswordValid}
                    />
                    
                    <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900 p-2 rounded">
                        <strong>Password Requirements:</strong> Exactly 8 characters with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value.slice(0, 8))}
                                placeholder="Confirm new password"
                                maxLength={8}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                {showConfirm ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                Passwords do not match
                            </p>
                        )}
                        {confirmPassword && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
                                {confirmPassword.length}/8 characters
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors" 
                        disabled={isSubmitting || !isNewPasswordValid || newPassword !== confirmPassword}
                    >
                        {isSubmitting ? 'Resetting...' : 'Reset Password'}
                    </button>
                    <div className="text-center">
                        <Link href="/" className="text-blue-600 hover:underline text-sm">
                            Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
