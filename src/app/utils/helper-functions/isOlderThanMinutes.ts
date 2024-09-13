/**
 * Check if a given ISO string is older than a specified number of minutes
 * @param isoString - The ISO string to check
 * @param minutes - The number of minutes to compare
 * @returns boolean - Returns true if the ISO string is older than the specified minutes, false otherwise
 */
export function isOlderThanMinutes(
  isoString: string,
  minutes: number
): boolean {
  const dateToCheck = new Date(isoString).getTime(); // Convert ISO string to timestamp
  const currentTime = new Date().getTime(); // Get current time as timestamp

  // Calculate the difference in milliseconds and convert to minutes
  const minutesDifference = (currentTime - dateToCheck) / (1000 * 60);

  // Check if the difference is greater than or equal to the specified minutes
  return minutesDifference >= minutes;
}
