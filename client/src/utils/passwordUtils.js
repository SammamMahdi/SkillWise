// Password strength validation using zxcvbn
// Note: In a real implementation, you would install zxcvbn: npm install zxcvbn
// For now, we'll create a simplified version

export const validatePasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      feedback: 'Password is required',
      isValid: false,
    };
  }

  // Check minimum length
  if (password.length < 12) {
    return {
      score: 0,
      feedback: 'Password must be at least 12 characters long',
      isValid: false,
    };
  }

  // Check for required character types
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[@$!%*?&]/.test(password);

  const missingRequirements = [];
  if (!hasUpperCase) missingRequirements.push('uppercase letter');
  if (!hasLowerCase) missingRequirements.push('lowercase letter');
  if (!hasNumbers) missingRequirements.push('number');
  if (!hasSpecialChars) missingRequirements.push('special character');

  if (missingRequirements.length > 0) {
    return {
      score: 0,
      feedback: `Password must contain at least one ${missingRequirements.join(', ')}`,
      isValid: false,
    };
  }

  // Calculate strength score (0-4)
  let score = 0;
  let feedback = '';

  // Length bonus
  if (password.length >= 16) score += 2;
  else if (password.length >= 14) score += 1;

  // Character variety bonus
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 12) score += 1;
  else if (uniqueChars >= 8) score += 0.5;

  // Complexity bonus
  if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars) {
    score += 1;
  }

  // Common patterns penalty
  const commonPatterns = [
    'password', '123456', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'hello'
  ];
  
  const lowerPassword = password.toLowerCase();
  if (commonPatterns.some(pattern => lowerPassword.includes(pattern))) {
    score = Math.max(0, score - 1);
  }

  // Sequential characters penalty
  const sequentialPatterns = ['abc', 'def', 'ghi', 'jkl', 'mno', 'pqr', 'stu', 'vwx', 'yz'];
  if (sequentialPatterns.some(pattern => lowerPassword.includes(pattern))) {
    score = Math.max(0, score - 0.5);
  }

  // Clamp score to 0-4
  score = Math.min(4, Math.max(0, Math.round(score)));

  // Generate feedback based on score
  switch (score) {
    case 0:
      feedback = 'Very weak password';
      break;
    case 1:
      feedback = 'Weak password';
      break;
    case 2:
      feedback = 'Fair password';
      break;
    case 3:
      feedback = 'Good password';
      break;
    case 4:
      feedback = 'Strong password';
      break;
    default:
      feedback = 'Unknown strength';
  }

  return {
    score,
    feedback,
    isValid: score >= 2, // Require at least "Fair" strength
    details: {
      length: password.length,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChars,
      uniqueChars,
    },
  };
};

export const getPasswordStrengthColor = (score) => {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-500';
    case 2:
      return 'text-yellow-500';
    case 3:
      return 'text-blue-500';
    case 4:
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

export const getPasswordStrengthWidth = (score) => {
  return `${(score / 4) * 100}%`;
};

export const getPasswordStrengthBgColor = (score) => {
  switch (score) {
    case 0:
    case 1:
      return 'bg-red-500';
    case 2:
      return 'bg-yellow-500';
    case 3:
      return 'bg-blue-500';
    case 4:
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};

// Password requirements checklist
export const getPasswordRequirements = (password) => {
  if (!password) {
    return {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    };
  }

  return {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };
};

// Check if passwords match
export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

// Generate a secure random password
export const generateSecurePassword = (length = 16) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
  let password = '';
  
  // Ensure at least one of each required character type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // number
  password += '@$!%*?&'[Math.floor(Math.random() * 7)]; // special
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}; 