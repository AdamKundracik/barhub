export function trimPlaceName(placeName: string): string {
  const result = placeName?.split(/[:\-]/);
  return result ? result[0] : '';
}
