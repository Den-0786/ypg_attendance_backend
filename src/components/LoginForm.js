'use client';
import { useState } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { FaFacebook, FaTiktok, FaInstagram } from 'react-icons/fa';

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(username, password);
    } catch (err) {
      // Error handling is done in the onLogin function
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500">
    
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-4 lg:pr-8 order-2 lg:order-1">
        <div className="w-full max-w-sm">
          <div className="bg-gray-900 rounded-2xl p-6 sm:p-6 shadow-2xl">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-2xl font-bold text-white mb-2">Welcome back</h1>
              <p className="text-gray-300 text-sm">Please enter the credentials set by admin</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <HiEye size={16} /> : <HiEyeOff size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="w-4 h-4 text-pink-600 bg-gray-800 border-gray-700 rounded focus:ring-pink-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-300">Keep me logged in</span>
                </label>
                <a
                  href="/forgot_password"
                  className="text-sm text-pink-400 hover:text-pink-300 transition-colors"
                >
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded-lg text-white font-semibold text-base transition-all duration-200 ${
                  isLoading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 transform hover:scale-105 shadow-lg'
                }`}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>


            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">Follow us on</span>
                </div>
              </div>

              <div className="mt-4 flex justify-center space-x-3">
                <button className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                  <FaFacebook size={14} />
                </button>
                <button className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                  <FaTiktok size={14} />
                </button>
                <button className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                  <FaInstagram size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-4 lg:pl-8 order-1 lg:order-2">
        <div className="relative max-w-sm w-full">
          
          <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden mb-20">
            
            <div className="absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-transparent to-gray-800 transform rotate-45 translate-x-5 -translate-y-5 sm:translate-x-6 sm:-translate-y-6"></div>
            
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Empowering Youth Ministry</h2>
            
            <div className="text-3xl sm:text-4xl text-gray-600 mb-4">"</div>
            
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4">
              "From Emmanuel to Liberty congregations, we're all connected through this system. It's not just attendance tracking - it's community building and growth monitoring."
            </p>
            
            <div className="mb-6">
              <p className="text-white font-semibold text-sm">Ahinsan District YPG</p>
              <p className="text-gray-400 text-xs">We Practice Godliness!</p>
            </div>
            <div className="flex space-x-2 mb-8">
              <button className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-xs">
                ←
              </button>
              <button className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-xs">
                →
              </button>
            </div>
            <div className="absolute bottom-3 right-3 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20"></div>
          </div>
          <div className="absolute -bottom-4 -right-2 sm:bottom-4 bg-white rounded-xl p-3 sm:p-4 shadow-xl max-w-xs">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">Connecting all Congregational Guilders</h3>
            <p className="text-gray-600 text-xs mb-3">
              "With our digital transformation in attendance management, all guilders are now unified under one Canopy."
            </p>
            <div className="flex space-x-1">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">Y</div>
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">P</div>
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
