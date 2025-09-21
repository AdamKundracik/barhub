import { useQuery } from 'react-query';
import { getCurrentUser } from '../services/functions';
import { useUserStore } from '../store/userStore';
import { auth } from '@/firebaseConfig';

export const useUserData = () => {
  const uid = auth.currentUser?.uid;
  const { setUserData } = useUserStore();

  return useQuery(
    ['userData', uid],
    async () => {
      return await getCurrentUser();
    },
    {
      enabled: !!uid,
      retry: 2,
      staleTime: 1000 * 60 * 5,
      onSuccess: data => {
        if (data) {
          console.log('data', data);
          setUserData(data); // 👈 automaticky uložíme do store
        }
      },
    }
  );
};
