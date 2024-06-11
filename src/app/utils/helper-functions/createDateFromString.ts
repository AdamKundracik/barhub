export function createDateFromCustomString(dateString: string): Date {
  // Split the string into an array of [year, month, day]
  const dateParts = dateString.split('/');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // Months are 0-based in JavaScript Date
  const day = parseInt(dateParts[2], 10);

  // Create and return a Date object from the parsed values
  return new Date(year, month, day);
}
