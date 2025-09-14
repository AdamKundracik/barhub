import { useEffect, useState } from 'react';
import { getDaysSince } from '../../helper-functions/getDaysSince';
import { useUserContext } from '../../../providers/UserProvider';

export const useUserUploadData = () => {
  const { userData } = useUserContext();
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
