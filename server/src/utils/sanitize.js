export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 255;
}

export function isStrongPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 200 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
