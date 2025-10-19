import { useEffect, useRef } from 'react';

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
  // Track previous values to avoid unnecessary refetch
  const prevPlaceIdRef = useRef<string | null>(placeId);
  const prevDistanceRef = useRef<number>(distance);

  useEffect(() => {
    // Only refetch if placeId or distance actually changed
    const placeIdChanged = prevPlaceIdRef.current !== placeId;
    const distanceChanged = prevDistanceRef.current !== distance;

    if (placeIdChanged || distanceChanged) {
      refetch();
      
      // Update refs with new values
      prevPlaceIdRef.current = placeId;
      prevDistanceRef.current = distance;
    }
  }, [placeId, distance]); // Remove refetch from dependencies to prevent infinite loops
};
