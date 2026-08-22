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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0a1628 0%, #0d2144 40%, #0f2d5c 70%, #1a3a6e 100%)'}}>
      <div className="w-full max-w-sm relative z-10">
        <div className="backdrop-blur-lg rounded-3xl p-8 shadow-2xl" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.3)'}}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
              Welcome Back
            </h1>
            <p className="text-sm font-medium" style={{color: '#c8d6e8'}}>
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
                className="w-full px-4 py-3 backdrop-blur-sm text-white rounded-xl focus:ring-2 transition-all duration-300 text-sm font-medium" style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.25)', outline: 'none'}}
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
                    autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 backdrop-blur-sm text-white rounded-xl focus:ring-2 transition-all duration-300 text-sm font-medium pr-12" style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.25)', outline: 'none'}}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200" style={{color: '#c9a84c'}}
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
                  className="w-4 h-4 rounded focus:ring-2 backdrop-blur-sm" style={{accentColor: '#c9a84c', background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(201,168,76,0.4)'}}
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
                  : "transform hover:scale-105 shadow-xl hover:shadow-2xl backdrop-blur-sm"
              }`}
              style={!isLoading ? {background: 'linear-gradient(90deg, #b8860b, #d4a843, #c9a84c)', border: '1px solid rgba(201,168,76,0.4)'} : {}}
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
