import { useMutation, useQueryClient } from 'react-query';

export function useImageManagement() {
  const queryClient = useQueryClient();

  const saveImage = useMutation(
    (imageUri: string): Promise<string> => {
      return new Promise(resolve => {
        resolve(imageUri);
      });
    },
    {
      onSuccess: data => {
        queryClient.setQueryData('capturedImage', data);
      },
    }
  );

  const deleteImage = useMutation(
    (): Promise<null> => {
      return new Promise(resolve => {
        resolve(null);
      });
    },
    {
      onSuccess: () => {
        queryClient.setQueryData('capturedImage', null);
      },
    }
  );

  return { saveImage, deleteImage };
}
