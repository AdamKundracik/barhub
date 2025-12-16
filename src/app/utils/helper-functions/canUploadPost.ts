/**
 * Get remaining cooldown time in seconds
 * Used as fallback when API call fails
 * 
 * @param lastUploadedPostAt - ISO string of the last uploaded post timestamp
 * @returns number - Remaining seconds in cooldown, or 0 if can upload
 */
export function getRemainingCooldownSeconds(lastUploadedPostAt: string | null | undefined): number {
  // If no previous upload, no cooldown
  if (!lastUploadedPostAt) {
    return 0;
  }

  // Parse the date string (same logic as isOlderThanMinutes)
  let dateStr = lastUploadedPostAt.includes('T')
    ? lastUploadedPostAt
    : lastUploadedPostAt.replace(' ', 'T');

  // Add 'Z' suffix to indicate UTC time
  if (
    !dateStr.endsWith('Z') &&
    !dateStr.includes('+') &&
    !dateStr.includes('-', 10)
  ) {
    dateStr += 'Z';
  }

  const lastUploadTime = new Date(dateStr).getTime();
  const currentTime = new Date().getTime();
  const fiveMinutesInMs = 5 * 60 * 1000;

  const elapsedTime = currentTime - lastUploadTime;
  const remainingTime = fiveMinutesInMs - elapsedTime;

  // Return remaining seconds (or 0 if cooldown is over)
  return Math.max(0, Math.ceil(remainingTime / 1000));
}
