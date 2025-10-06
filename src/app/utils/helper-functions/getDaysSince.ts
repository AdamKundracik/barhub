/**
 * Calculates the number of days since a given LocalDateTime string from the database
 * @param localDateTimeString - ISO string format from backend (e.g., "2024-01-15T10:30:00")
 * @returns number of days since the given date
 */
export function getDaysSince(localDateTimeString: string | null | undefined): number {
  if (!localDateTimeString) return 0;

  try {
    // Parse the LocalDateTime string from backend
    const givenDate = new Date(localDateTimeString);
    
    // Check if the date is valid
    if (isNaN(givenDate.getTime())) {
      console.warn('[getDaysSince] Invalid date string:', localDateTimeString);
      return 0;
    }

    const now = new Date();
    const diffMs = now.getTime() - givenDate.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return days; // celé dni
  } catch (error) {
    console.error('[getDaysSince] Error parsing date:', localDateTimeString, error);
    return 0;
  }
}
