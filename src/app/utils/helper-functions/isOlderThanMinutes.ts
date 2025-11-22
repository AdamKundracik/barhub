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
  // Parse LocalDateTime string: "2025-10-07T22:29:23.517475"
  // Backend sends UTC time but without 'Z' suffix, so we need to treat it as UTC
  let dateStr = isoString.includes('T')
    ? isoString
    : isoString.replace(' ', 'T');

  // Add 'Z' suffix to indicate UTC time
  if (
    !dateStr.endsWith('Z') &&
    !dateStr.includes('+') &&
    !dateStr.includes('-', 10)
  ) {
    dateStr += 'Z';
  }

  const dateToCheck = new Date(dateStr).getTime();
  const currentTime = new Date().getTime();

  const minutesDifference = (currentTime - dateToCheck) / (1000 * 60);

  return minutesDifference >= minutes;
}
