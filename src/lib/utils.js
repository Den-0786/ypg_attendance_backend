'use client'
export  function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Validates password according to specific requirements:
 * - Exactly 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export function validatePassword(password) {
  // Check exact length of 8 characters
  if (password.length !== 8) {
    return {
      isValid: false,
      error: 'Password must be exactly 8 characters long'
    };
  }

  // Check for at least 1 uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least 1 uppercase letter'
    };
  }

  // Check for at least 1 lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least 1 lowercase letter'
    };
  }

  // Check for at least 1 number
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least 1 number'
    };
  }

  // Check for at least 1 special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least 1 special character'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Gets password strength indicators for UI feedback
 */
export function getPasswordStrength(password) {
  const checks = {
    length: password.length === 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const validChecks = Object.values(checks).filter(Boolean).length;
  
  return {
    checks,
    validChecks,
    isValid: validChecks === 5 && password.length === 8
  };
}