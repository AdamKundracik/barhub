import { InfinityScrollPost, Post } from '../../../../shared';
import { GeoPointType, LocationType } from '../types/types';
import { getFreshContent, getPostsByPlaceId } from '../services/post.service';

export const handleFreshContent = async (
  radius: number,
  lastVisible?: string | null,
  placeId?: string | null,
  location?: LocationType
): Promise<{ posts: Post[]; lastVisible: string | null }> => {
  const geoPoint = locationTypeToGeoPointType(
    location ?? { latitude: 0, longitude: 0 }
  );

  try {
    let response;
    if (placeId) {
      response = lastVisible
        ? await getPostsByPlaceId(placeId, lastVisible)
        : await getPostsByPlaceId(placeId);
    } else {
      response = lastVisible
        ? await getFreshContent(geoPoint, radius, lastVisible)
        : await getFreshContent(geoPoint, radius);
    }

    const data = response.data as InfinityScrollPost;
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
