import { User } from '@/domains/auth/store/authSlice';

/**
 * Get user initials from first and last name
 * Returns first 2 letters: first letter of first name + first letter of last name
 * Falls back to first 2 letters of username/email if names are not available
 */
export function getUserInitials(user: User | null): string {
  if (!user) {
    return '??';
  }

  const firstName = user.firstName?.trim() || '';
  const lastName = user.lastName?.trim() || '';

  if (firstName && lastName) {
    return `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
  }

  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }

  if (lastName) {
    return lastName.substring(0, 2).toUpperCase();
  }

  // Fallback to username or email
  const fallback = user.username || user.email || '';
  if (fallback.length >= 2) {
    return fallback.substring(0, 2).toUpperCase();
  }

  return '??';
}

/**
 * Get user display name
 * Returns "FirstName LastName" if available, otherwise username or email
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) {
    return 'User';
  }

  const firstName = user.firstName?.trim() || '';
  const lastName = user.lastName?.trim() || '';

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  if (lastName) {
    return lastName;
  }

  return user.username || user.email || 'User';
}
