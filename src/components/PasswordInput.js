'use client';
import { useState, useEffect } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { validatePassword, getPasswordStrength } from '../lib/utils';

export default function PasswordInput({
  value,
  onChange,
  placeholder = "Enter password",
  label = "Password",
  required = false,
  showStrength = true,
  maxLength = 8,
  className = "",
  error = null,
  onValidationChange = null
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState({ isValid: false, error: null });
  const [strength, setStrength] = useState({ checks: {}, validChecks: 0, isValid: false });

  useEffect(() => {
    if (value) {
      const validationResult = validatePassword(value);
      const strengthResult = getPasswordStrength(value);
      
      setValidation(validationResult);
      setStrength(strengthResult);
      
      if (onValidationChange) {
        onValidationChange(validationResult.isValid);
      }
    } else {
      setValidation({ isValid: false, error: null });
      setStrength({ checks: {}, validChecks: 0, isValid: false });
      
      if (onValidationChange) {
        onValidationChange(false);
      }
    }
  }, [value, onValidationChange]);

  const handleChange = (e) => {
    const newValue = e.target.value.slice(0, maxLength);
    onChange(newValue);
  };

  const renderStrengthIndicator = () => {
    if (!showStrength || !value) return null;

    const checkItems = [
      { key: 'length', label: '8 characters', icon: '🔢' },
      { key: 'uppercase', label: 'Uppercase', icon: '🔠' },
      { key: 'lowercase', label: 'Lowercase', icon: '🔡' },
      { key: 'number', label: 'Number', icon: '123' },
      { key: 'special', label: 'Special', icon: '!@#' }
    ];

    return (
      <div className="mt-2 space-y-1">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Password requirements:
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {checkItems.map(({ key, label, icon }) => (
            <div
              key={key}
              className={`flex items-center space-x-1 ${
                strength.checks[key]
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <span className="text-xs">{icon}</span>
              <span>{label}</span>
              {strength.checks[key] && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          ))}
        </div>
        {value && value.length > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Strength:</span>
              <span>{strength.validChecks}/5</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  strength.validChecks <= 2
                    ? 'bg-red-500'
                    : strength.validChecks <= 3
                    ? 'bg-yellow-500'
                    : strength.validChecks <= 4
                    ? 'bg-blue-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${(strength.validChecks / 5) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
            validation.error || error
              ? 'border-red-500 dark:border-red-400'
              : validation.isValid
              ? 'border-green-500 dark:border-green-400'
              : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white ${className}`}
        />
        <button
          type="button"
          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
        </button>
      </div>
      
      {/* Character count */}
      {value && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {value.length}/{maxLength} characters
        </div>
      )}
      
      {/* Error message */}
      {(validation.error || error) && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {validation.error || error}
        </p>
      )}
      
      {/* Success message */}
      {validation.isValid && !validation.error && !error && (
        <p className="text-sm text-green-600 dark:text-green-400">
          ✓ Password meets all requirements
        </p>
      )}
      
      {/* Strength indicator */}
      {renderStrengthIndicator()}
    </div>
  );
} 