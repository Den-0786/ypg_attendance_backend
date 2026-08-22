'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { BASE_URL } from '@lib/config';

export const dynamic = 'force-dynamic';

export default function ResetPassword({ params }) {
    const { uid, token } = use(params);
    const router = useRouter();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newPassword || newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/reset-password-confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ uid, token, new_password: newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Password reset successfully!');
                router.push('/login');
            } else {
                toast.error(data.error || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
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
                            Set New Password
                        </h1>
                        <p className="text-sm font-medium" style={{color: '#c8d6e8'}}>
                            Choose a strong new password for your account
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-semibold text-white mb-3 drop-shadow-sm">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="At least 8 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 backdrop-blur-sm text-white rounded-xl focus:ring-2 transition-all duration-300 text-sm font-medium"
                                style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.25)', outline: 'none'}}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-3 drop-shadow-sm">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 backdrop-blur-sm text-white rounded-xl focus:ring-2 transition-all duration-300 text-sm font-medium"
                                style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.25)', outline: 'none'}}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="mt-2 text-xs font-medium underline"
                                style={{color: '#c9a84c'}}
                            >
                                {showPassword ? 'Hide passwords' : 'Show passwords'}
                            </button>
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
                                    Resetting...
                                </div>
                            ) : (
                                "Reset Password"
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
