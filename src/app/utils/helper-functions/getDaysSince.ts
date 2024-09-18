export function getDaysSince(date: string): number {
  // Parse the input date
  const givenDate = new Date(date);

  // Check if the given date is valid
  if (isNaN(givenDate.getTime())) {
    throw new Error('Invalid date format');
  }

  // Get the current date
  const currentDate = new Date();

  // Calculate the time difference in milliseconds
  const timeDifference = currentDate.getTime() - givenDate.getTime();

  // Convert time difference from milliseconds to days
  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  return daysDifference;
}
