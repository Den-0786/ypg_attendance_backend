import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function PINModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Enter Security PIN",
  message = "Please enter the 4-digit PIN to continue",
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPin("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/pin/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (res.ok && data.is_valid) {
        onSuccess(pin);
        // Do not call onClose() here; let parent handle modal state after redirect
      } else {
        setError(data.error || "Invalid PIN");
      }
    } catch (err) {
      console.error("PIN verification error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    // Only allow numbers
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-2xl max-w-[280px] md:max-w-[280px] w-full mx-2 border border-blue-200 dark:border-blue-700 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg font-bold focus:outline-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-base font-bold mb-1 text-center text-blue-700 dark:text-blue-300 tracking-wide">
          {title}
        </h2>
        <p className="text-gray-500 dark:text-gray-300 mb-3 text-center text-xs">
          {message}
        </p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              onKeyPress={handleKeyPress}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-lg tracking-widest placeholder-gray-400"
              placeholder="••••"
              maxLength={4}
              autoFocus
              disabled={loading}
              style={{ letterSpacing: "0.2em" }}
            />
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-2 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 text-xs font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50 text-xs font-medium"
              disabled={loading || pin.length !== 4}
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-blue-500 rounded-full animate-spin"></span>
                  <span>Verifying...</span>
                </span>
              ) : (
                "Verify"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
