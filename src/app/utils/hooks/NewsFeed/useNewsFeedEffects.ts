import { useEffect } from 'react';

interface UseNewsFeedEffectsProps {
  placeId: string | null;
  distance: number;
  refetch: () => Promise<any>;
}

export const useNewsFeedEffects = ({
  placeId,
  distance,
  refetch,
}: UseNewsFeedEffectsProps) => {
  useEffect(() => {
    if (placeId || distance !== undefined) {
      refetch();
    }
  }, [placeId, distance, refetch]);
};
