import { useMutation, useQueryClient } from 'react-query';
import { User } from '../../../../shared';

export function useUserManagement() {
  const queryClient = useQueryClient();

  const setUserToStore = useMutation(
    (user: User): Promise<User> => {
      return new Promise(resolve => {
        resolve(user);
      });
    },
    {
      onSuccess: user => {
        queryClient.setQueryData('user', user);
      },
    }
  );

  return { setUserToStore };
}
