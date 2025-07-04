import { useQuery } from 'react-query';
import { getAllExistingUsers, getCurrentUser } from '../services/functions';

export const useUserData = (uid: string | undefined) => {
  return useQuery(
    ['userData', uid],
    async () => {
      return await getCurrentUser();
    },
    {
      enabled: !!uid,
      retry: 2,
      staleTime: 1000 * 60 * 5,
    }
  );
};

export const useAllUsers = () => {
  return useQuery('allUsers', async () => {
    const allUsers = await getAllExistingUsers();
    return allUsers?.data?.users ?? [];
  });
};
