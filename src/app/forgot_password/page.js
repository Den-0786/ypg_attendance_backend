'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
    const [identifier, setIdentifier] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!identifier) return toast.error('Username or email is required');

        try {
        const res = await fetch('http://127.0.0.1:8000/api/request-password-reset/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: identifier }), 
        });

        const data = await res.json();

        if (res.ok) {
            toast.success(data.message);
            router.push(`/reset_code?identifier=${encodeURIComponent(identifier)}`);
        } else {
            toast.error(data.error || 'Something went wrong');
        }
        } catch (err) {
        toast.error('Network error');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 shadow p-6 rounded max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-center">Forgot Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4 ml-16 items-center">
            <input
                type="text"
                placeholder="Enter your email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-2 border rounded dark:bg-gray-700 dark:text-white"
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Send Reset Code
            </button>
            </form>
        </div>
        </div>
    );
}
