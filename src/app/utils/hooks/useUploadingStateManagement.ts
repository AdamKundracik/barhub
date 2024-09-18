import { useMutation, useQueryClient } from 'react-query';

export function useUploadingStateManagement() {
  const queryClient = useQueryClient();

  const setUploadingState = useMutation(
    (uploading: boolean): Promise<boolean> => {
      return new Promise(resolve => {
        resolve(uploading);
      });
    },
    {
      onSuccess: uploading => {
        queryClient.setQueryData('imageUploading', uploading);
      },
    }
  );

  return { setUploadingState };
}
