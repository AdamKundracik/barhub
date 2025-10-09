import { GeoPointType, LocationType } from '../types/types';
import { getFreshContent, getPostsByPlaceId } from '../services/post.service';
import { InfinityScrollPost, Post } from '@/common/types/postTypes';
import { useUserStore } from '../store/userStore';

export const handleFreshContent = async (
  radius: number,
  cursor?: string | null,
  placeId?: string | null,
  location?: LocationType
): Promise<{ posts: Post[]; lastVisible: string | null }> => {
  const geoPoint = locationTypeToGeoPointType(
    location ?? { latitude: 0, longitude: 0 }
  );

  // Get userId from store
  const userId = useUserStore.getState().getUserId();

  try {
    let response;
    if (placeId) {
      response = await getPostsByPlaceId(
        placeId,
        cursor || undefined,
        parseInt(userId ?? '') || undefined
      );
    } else {
      response = await getFreshContent(
        geoPoint,
        radius,
        cursor || undefined,
        parseInt(userId ?? '') || undefined
      );
    }

    const data = response.data as InfinityScrollPost;
    // console.log(data.posts);
    if (!data?.posts?.length) {
      return { posts: [], lastVisible: null };
    }
    return {
      posts: data.posts,
      lastVisible: data.lastVisible || null,
    };
  } catch (error) {
    return { posts: [], lastVisible: null };
  }
};

const locationTypeToGeoPointType = (location: LocationType): GeoPointType => {
  return { _lat: location.latitude, _long: location.longitude };
};
