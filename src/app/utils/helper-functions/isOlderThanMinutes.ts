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
  const dateToCheck = new Date(isoString).getTime();
  const currentTime = new Date().getTime();

  const minutesDifference = (currentTime - dateToCheck) / (1000 * 60);

  return minutesDifference >= minutes;
}
