import { useCallback, useState } from 'react';

type UseOptimisticResult<T> = {
  data: T; // The current data after the optimistic update
  pendingData: T | null; // The data being optimistically updated, if any
  error: Error | null; // Any error that occurred during the update
  optimisticUpdate: (newData: T) => Promise<void>; // Function to trigger the optimistic update
};

function useOptimistic<T>(
  updateFn: (newData: T) => Promise<T>, // Ensure updateFn returns the updated data
  initialData: T
): UseOptimisticResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [pendingData, setPendingData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Function to handle optimistic update
  const optimisticUpdate = useCallback(
    async (newData: T) => {
      // Set pending data optimistically
      setPendingData(newData);

      try {
        // Call the update function (e.g., API request)
        const updatedData = await updateFn(newData); // Make sure updateFn returns the updated data

        // If successful, update the data state
        setData(updatedData);
        setPendingData(null);
      } catch (err) {
        // On error, set error state and revert to previous data
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
