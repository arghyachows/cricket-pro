import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate age from birth date
 * @param {string|Date} birthDate - Birth date string or Date object
 * @param {Date} referenceDate - Reference date for calculation (defaults to today)
 * @returns {number|null} Age in years or null if invalid date
 */
export function calculateAge(birthDate, referenceDate = new Date()) {
  if (!birthDate) return null;

  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;

    let age = referenceDate.getFullYear() - birth.getFullYear();
    const monthDiff = referenceDate.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
}

/**
 * Format age for display
 * @param {number|null} age - Age in years
 * @returns {string} Formatted age string
 */
export function formatAge(age) {
  if (age === null || age === undefined) return '-';
  return age.toString();
}

/**
 * Generate realistic player birth dates for cricket players
 * @param {number} minAge - Minimum age (default: 18)
 * @param {number} maxAge - Maximum age (default: 45)
 * @returns {string} ISO date string
 */
export function generatePlayerBirthDate(minAge = 18, maxAge = 45) {
  const today = new Date();
  const minBirthYear = today.getFullYear() - maxAge;
  const maxBirthYear = today.getFullYear() - minAge;

  const birthYear = Math.floor(Math.random() * (maxBirthYear - minBirthYear + 1)) + minBirthYear;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1; // Avoid invalid dates

  const birthDate = new Date(birthYear, birthMonth, birthDay);
  return birthDate.toISOString().split('T')[0];
}
