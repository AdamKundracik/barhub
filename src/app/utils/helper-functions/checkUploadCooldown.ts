export const canUploadPhoto = (lastUploadedPost: Date | null): boolean => {
  if (!lastUploadedPost) return true;

  const now = Date.now();
  const diffMs = now - new Date(lastUploadedPost).getTime();
  const fiveMinutes = 5 * 60 * 1000;

  return diffMs >= fiveMinutes;
};
