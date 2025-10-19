import { FirebaseTimestamp } from '@/src/app/utils/types/types';

export function toDate(
  timestamp: Date | FirebaseTimestamp | null | undefined
): Date | null {
  if (!timestamp) return null;

  if (timestamp instanceof Date) return timestamp;

  if (typeof timestamp._seconds === 'number') {
    return new Date(timestamp._seconds * 1000);
  }

  return null;
}
