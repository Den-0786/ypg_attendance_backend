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
  if (!password) {
    return {
      score: 0,
      isValid: false,
      message: 'Enter a password'
    };
  }

  const checks = {
    length: password.length === 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const validChecks = Object.values(checks).filter(Boolean).length;
  const score = validChecks;
  
  let message = '';
  if (score === 0) {
    message = 'Very weak';
  } else if (score === 1) {
    message = 'Weak';
  } else if (score === 2) {
    message = 'Fair';
  } else if (score === 3) {
    message = 'Good';
  } else if (score === 4) {
    message = 'Strong';
  } else if (score === 5) {
    message = 'Very strong';
  }
  
  return {
    checks,
    validChecks,
    score,
    isValid: validChecks === 5 && password.length === 8,
    message
  };
}