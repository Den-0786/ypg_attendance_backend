'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { BASE_URL } from '../../lib/config';

export const dynamic = 'force-dynamic';

function ResetCodeContent() {
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

    useEffect(() => {
        const identifier = searchParams.get('identifier');
        if (!identifier) {
            toast.error('Missing username. Start over.');
            router.push('/forgot_password');
            return;
        }
        setUsername(identifier);
        setIsLoading(false);
    }, [searchParams, router]);

    const passwordRequirements = [
        { label: 'At least 8 characters', test: (p) => p.length >= 8 },
        { label: 'At least 1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
        { label: 'At least 1 lowercase letter', test: (p) => /[a-z]/.test(p) },
        { label: 'At least 1 number', test: (p) => /[0-9]/.test(p) },
        { label: 'At least 1 special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];

    const isNewPasswordValid = passwordRequirements.every((req) => req.test(newPassword));

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
            const res = await fetch(`${BASE_URL}/api/reset-password-confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, code, new_password: newPassword }),
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0a1628 0%, #0d2144 40%, #0f2d5c 70%, #1a3a6e 100%)'}}>
                <div className="relative z-10 flex flex-col items-center gap-5">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full animate-spin" style={{border: '3px solid rgba(201,168,76,0.15)', borderTopColor: '#c9a84c'}}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full" style={{background: '#c9a84c', boxShadow: '0 0 10px #c9a84c'}}></div>
                        </div>
                    </div>
                    <p className="text-sm font-semibold" style={{color: '#c9a84c'}}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0a1628 0%, #0d2144 40%, #0f2d5c 70%, #1a3a6e 100%)'}}>
            <div className="absolute top-[-6rem] left-[-6rem] w-96 h-96 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)'}} />
            <div className="absolute bottom-[-4rem] right-[-4rem] w-80 h-80 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(212,168,67,0.14) 0%, transparent 70%)'}} />
            <div className="w-full max-w-sm relative z-10">
                <div className="backdrop-blur-lg rounded-3xl p-8 shadow-2xl" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.3)'}}>
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                            Reset Password
                        </h1>
                        <p className="text-sm font-medium" style={{color: '#c8d6e8'}}>
                            Enter the code and your new password
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-white mb-3 drop-shadow-sm">
                                Reset Code
                            </label>
                            <input
                                type="text"
                                placeholder="Enter reset code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full px-4 py-3 backdrop-blur-sm text-white rounded-xl focus:ring-2 transition-all duration-300 text-sm font-medium"
                                style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.25)', outline: 'none'}}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-white mb-3 drop-shadow-sm">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full px-4 py-3 backdrop-blur-sm text-white rounded-xl focus:ring-2 transition-all duration-300 text-sm font-medium pr-12"
                                    style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.25)', outline: 'none'}}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200"
                                    style={{color: '#c9a84c'}}
                                    onClick={() => setShowNew(!showNew)}
                                >
                                    {showNew ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {newPassword && (
                                <div className="mt-2 space-y-1">
                                    {passwordRequirements.map((req) => (
                                        <div key={req.label} className="flex items-center gap-2 text-xs">
                                            {req.test(newPassword) ? (
                                                <FaCheckCircle className="text-green-400" />
                                            ) : (
                                                <FaTimesCircle className="text-gray-500" />
                                            )}
                                            <span className={req.test(newPassword) ? 'text-green-400' : 'text-gray-400'}>
                                                {req.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-white mb-3 drop-shadow-sm">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full px-4 py-3 backdrop-blur-sm text-white rounded-xl focus:ring-2 transition-all duration-300 text-sm font-medium pr-12"
                                    style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.25)', outline: 'none'}}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200"
                                    style={{color: '#c9a84c'}}
                                    onClick={() => setShowConfirm(!showConfirm)}
                                >
                                    {showConfirm ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-xs mt-2" style={{color: '#ff6b6b'}}>Passwords do not match</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !isNewPasswordValid || newPassword !== confirmPassword}
                            className={`w-full py-3 px-6 rounded-xl text-white font-bold text-base transition-all duration-300 ${
                                isSubmitting || !isNewPasswordValid || newPassword !== confirmPassword
                                    ? "bg-gray-600 cursor-not-allowed"
                                    : "transform hover:scale-105 shadow-xl hover:shadow-2xl backdrop-blur-sm"
                            }`}
                            style={!(isSubmitting || !isNewPasswordValid || newPassword !== confirmPassword) ? {background: 'linear-gradient(90deg, #b8860b, #d4a843, #c9a84c)', border: '1px solid rgba(201,168,76,0.4)'} : {}}
                        >
                            {isSubmitting ? (
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

export default function ResetCode() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0a1628 0%, #0d2144 40%, #0f2d5c 70%, #1a3a6e 100%)'}}>
                <div className="relative z-10 flex flex-col items-center gap-5">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full animate-spin" style={{border: '3px solid rgba(201,168,76,0.15)', borderTopColor: '#c9a84c'}}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full" style={{background: '#c9a84c', boxShadow: '0 0 10px #c9a84c'}}></div>
                        </div>
                    </div>
                    <p className="text-sm font-semibold" style={{color: '#c9a84c'}}>Loading...</p>
                </div>
            </div>
        }>
            <ResetCodeContent />
        </Suspense>
    );
}
