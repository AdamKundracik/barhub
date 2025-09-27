import { toDate } from '@/src/app/utils/helper-functions/toDate';

export const canUploadPhoto = (
  lastUploadedPost?: Date | { seconds: number; nanoseconds?: number }
): boolean => {
  if (!lastUploadedPost) return true;

  const lastDate = toDate(lastUploadedPost);
  if (isNaN(lastDate.getTime())) return true;

  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  return diffMs >= FIVE_MINUTES_MS;
};
