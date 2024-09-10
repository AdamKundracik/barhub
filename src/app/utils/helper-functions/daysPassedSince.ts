export function daysPassedSince(dateISO: string): number {
  const givenDate = new Date(dateISO);
  const today = new Date();

  // Calculate the difference in milliseconds
  const diffInMilliseconds = today.getTime() - givenDate.getTime();

  // Convert milliseconds to days
  const daysPassed = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

  return daysPassed;
}
