import { Timestamp } from 'firebase/firestore';
import { FirebaseTimestamp } from '@/src/app/utils/types/types';

export function toDate(
  timestamp: Date | FirebaseTimestamp | null | undefined
): Date {
  if (!timestamp) return new Date(); // fallback: aktuálny čas
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();

  if (typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000);
  }

  if (typeof timestamp._seconds === 'number') {
    return new Date(timestamp._seconds * 1000);
  }

  return new Date();
}
