export function getDaysSince(date: string): number {
  const givenDate = new Date(date);

  if (isNaN(givenDate.getTime())) {
    throw new Error('Invalid date format');
  }

  const currentDate = new Date();

  const timeDifference = currentDate.getTime() - givenDate.getTime();

  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  return daysDifference;
}
