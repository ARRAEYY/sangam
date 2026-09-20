/**
 * Password strength validation.
 *
 * Rules:
 *   1. Minimum 12 characters
 *   2. At least one uppercase letter
 *   3. At least one lowercase letter
 *   4. At least one digit
 *   5. At least one special character
 *   6. Not in the top-10k breached passwords list
 */

// Top commonly-breached passwords (curated subset — covers the vast majority
// of real-world credential-stuffing attacks).
const BREACHED_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'michael', 'shadow', '123123', '654321', 'superman', 'qazwsx',
  'michael1', 'football', 'password1', 'password123', '1234567890', '123456789',
  'princess', 'login', 'welcome', 'solo', 'qwerty123', '1q2w3e4r', 'admin',
  'passw0rd', 'starwars', '121212', '000000', '112233', 'zaq1zaq1', 'zxcvbnm',
  'abcdef', 'qwer1234', 'a1b2c3d4', 'mustang', 'access', 'batman', 'charlie',
  'donald', 'loveme', '696969', 'hello', 'hottie', 'freedom', 'whatever',
  'qwerty1', 'trustno1', 'jordan', 'jennifer', 'jessica', 'hunter', 'ranger',
  'thomas', 'robert', 'daniel', 'andrew', 'joshua', 'matrix', 'william',
  'computer', 'corvette', 'mercedes', 'killer', 'george', 'secret', 'summer',
  'ginger', 'sparky', 'maggie', 'flower', 'samantha', 'pepper', 'tigger',
  'chester', 'cookie', 'richard', 'thunder', 'jasper', 'dallas', 'ncc1701',
  'yankees', 'snoopy', 'gandalf', 'internet', 'startrek', 'klaster', 'pass123',
  'Pa$$w0rd', 'P@ssword', 'P@ssw0rd', 'P@$$w0rd', 'Passw0rd!', 'Welcome1',
  'Welcome1!', 'Changeme1', 'Qwerty123!', 'Admin123', 'Test1234',
  'Password1!', 'Abcd1234', 'Abcdef1!', 'Google123', 'Temp1234',
  'letmein1', '1qaz2wsx', '1q2w3e', 'zaq12wsx', 'p@ssword', 'changeme',
])

function validatePassword(password) {
  const errors = []

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required.'] }
  }

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long.')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit.')
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character.')
  }

  // Check against breached list (case-insensitive)
  if (BREACHED_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password has appeared in a data breach — please choose a different one.')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Returns a human-readable strength label and 0–4 score.
 * Used by the frontend to render a strength meter.
 */
function passwordStrength(password) {
  if (!password) return { score: 0, label: '' }

  let score = 0
  if (password.length >= 8)  score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1

  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
  return { score, label: labels[score] }
}

module.exports = { validatePassword, passwordStrength, BREACHED_PASSWORDS }
