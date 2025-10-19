import { useCallback, useState } from 'react';

type UseOptimisticResult<T> = {
  data: T;
  pendingData: T | null;
  error: Error | null;
  optimisticUpdate: (newData: T) => Promise<void>;
};

function useOptimistic<T>(
  updateFn: (newData: T) => Promise<T>,
  initialData: T
): UseOptimisticResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [pendingData, setPendingData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const optimisticUpdate = useCallback(
    async (newData: T) => {
      setPendingData(newData);

      try {
        const updatedData = await updateFn(newData);

        setData(updatedData);
        setPendingData(null);
      } catch (err) {
        console.error('Error updating data:', err);
        if (err instanceof Error) {
          setError(err);
        }
        setPendingData(null);
      }
    },
    [updateFn]
  );

  return { data, pendingData, error, optimisticUpdate };
}

export default useOptimistic;
