import { useEffect, useState } from 'react';
import { getDaysSince } from '../../helper-functions/getDaysSince';
import { useUserStore } from '@/src/app/utils/store/userStore';

export const useUserUploadData = () => {
  const { userData } = useUserStore();
  const [daysSinceLastUpload, setDaysSinceLastUpload] = useState(0);

  useEffect(() => {
    if (userData?.lastUploadedPost) {
      const days = getDaysSince(userData.lastUploadedPost);
      setDaysSinceLastUpload(days);
    }
  }, [userData?.lastUploadedPost]);

  return {
    daysSinceLastUpload,
    userData,
  };
};
