"use client";
import { useState } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(username, password);
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-600 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-600 animate-pulse opacity-20"></div>
      <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      {isLoading && (
        <div className="absolute inset-0 backdrop-blur-md bg-gradient-to-br from-sky-500/10 via-blue-600/10 to-cyan-600/10 flex items-center justify-center z-20">
          <div className="bg-white/10 rounded-xl px-6 py-4 border border-white/20 shadow-xl text-white flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
            Signing in...
          </div>
        </div>
      )}

      <div className="w-full max-w-sm relative z-10">
        <div className="backdrop-blur-lg bg-white/10 rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
              Welcome Back
            </h1>
            <p className="text-blue-100 text-sm font-medium">
              Please enter your credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-white mb-3 drop-shadow-sm"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 placeholder-blue-100/70 text-sm font-medium"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-white mb-3 drop-shadow-sm"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 placeholder-blue-100/70 text-sm font-medium pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-100 hover:text-yellow-300 transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <HiEye size={18} /> : <HiEyeOff size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 text-yellow-400 bg-white/20 border-white/30 rounded focus:ring-yellow-400 focus:ring-2 backdrop-blur-sm"
                />
                <span className="ml-2 text-sm text-white font-medium">
                  Keep me logged in
                </span>
              </label>
              <a
                href="/forgot_password"
                className="text-sm text-yellow-300 hover:text-yellow-200 transition-colors duration-200 font-medium"
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-6 rounded-xl text-white font-bold text-base transition-all duration-300 ${
                isLoading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-500 via-blue-600 to-cyan-600 hover:from-sky-600 hover:via-blue-700 hover:to-cyan-700 transform hover:scale-105 shadow-xl hover:shadow-2xl border border-white/20 backdrop-blur-sm"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
