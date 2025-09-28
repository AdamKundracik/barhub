import { toDate } from '@/src/app/utils/helper-functions/toDate';
import { FirebaseTimestamp } from '@/src/app/utils/types/types';

export function getDaysSince(date: FirebaseTimestamp): number {
  if (!date) return 0;

  const givenDate = toDate(date);
  if (isNaN(givenDate.getTime())) return 0;

  const now = new Date();
  const diffMs = now.getTime() - givenDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days; // celé dni
}
