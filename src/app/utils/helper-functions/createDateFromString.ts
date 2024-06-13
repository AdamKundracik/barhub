export function createDateFromCustomString(dateString: string): Date {
  const dateParts = dateString.split('/');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // Months are 0-based in JavaScript Date
  const day = parseInt(dateParts[2], 10);

  return new Date(year, month, day);
}
