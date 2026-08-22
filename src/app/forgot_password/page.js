'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { BASE_URL } from '../../lib/config';

export const dynamic = 'force-dynamic';

export default function ForgotPassword() {
    const [identifier, setIdentifier] = useState('');
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!identifier) {
            toast.error('Username is required');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/request-password-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username: identifier }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Reset code sent via SMS successfully!');
                setIdentifier('');
                router.push(`/reset_code?identifier=${encodeURIComponent(identifier)}`);
            } else {
                toast.error(data.error || 'Failed to send reset code');
            }
        } catch (error) {
            console.error('Error requesting password reset:', error);
            toast.error('Network error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0a1628 0%, #0d2144 40%, #0f2d5c 70%, #1a3a6e 100%)'}}>
            <div className="absolute top-[-6rem] left-[-6rem] w-96 h-96 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)'}} />
            <div className="absolute bottom-[-4rem] right-[-4rem] w-80 h-80 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(212,168,67,0.14) 0%, transparent 70%)'}} />
            <div className="w-full max-w-sm relative z-10">
                <div className="backdrop-blur-lg rounded-3xl p-8 shadow-2xl" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.3)'}}>
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                            Forgot Password
                        </h1>
                        <p className="text-sm font-medium" style={{color: '#c8d6e8'}}>
                            Enter your username to receive a reset code
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="identifier" className="block text-sm font-semibold text-white mb-3 drop-shadow-sm">
                                Username
                            </label>
                            <input
                                id="identifier"
                                type="text"
                                placeholder="Enter your username"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full px-4 py-3 backdrop-blur-sm text-white rounded-xl focus:ring-2 transition-all duration-300 text-sm font-medium"
                                style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.25)', outline: 'none'}}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 px-6 rounded-xl text-white font-bold text-base transition-all duration-300 ${
                                isLoading
                                    ? "bg-gray-600 cursor-not-allowed"
                                    : "transform hover:scale-105 shadow-xl hover:shadow-2xl backdrop-blur-sm"
                            }`}
                            style={!isLoading ? {background: 'linear-gradient(90deg, #b8860b, #d4a843, #c9a84c)', border: '1px solid rgba(201,168,76,0.4)'} : {}}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Sending...
                                </div>
                            ) : (
                                "Send Reset Code"
                            )}
                        </button>
                        <div className="text-center">
                            <Link href="/login" className="text-sm font-medium transition-colors duration-200" style={{color: '#c9a84c'}} onMouseOver={(e) => e.target.style.color = '#d4a843'} onMouseOut={(e) => e.target.style.color = '#c9a84c'}>
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
