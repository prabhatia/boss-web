/**
 * Shared password rule for every place a user sets/changes a password:
 * email sign-up completion, adding a password to an OAuth account, and
 * the Edit Profile password field.
 *
 * Returns an error message, or null if the password satisfies the policy.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 12) {
    return 'Password must be at least 12 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;'/]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
}
