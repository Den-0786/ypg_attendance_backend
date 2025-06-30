'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
    const [identifier, setIdentifier] = useState('');
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!identifier) return toast.error('Username or email is required');

        try {
            const res = await fetch(`/api/request-password-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username: identifier }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Password reset email sent successfully!');
                setIdentifier('');
                router.push(`/reset_code?identifier=${encodeURIComponent(identifier)}`);
            } else {
                toast.error(data.error || 'Failed to send reset email');
            }
        } catch (error) {
            console.error('Error requesting password reset:', error);
            toast.error('Network error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 shadow p-6 rounded max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-center">Forgot Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="text"
                placeholder="Enter your email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Code'}
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
