import { InfinityScrollPost, Post } from '../../../../shared';
import { getFreshContent, getPostsByPlaceId } from '../services/post.service';
import { GeoPointType, LocationType } from '../types/types';
import { logger } from 'firebase-functions';

export const handleFreshContent = async (
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
        ? await getFreshContent(geoPoint, lastVisible)
        : await getFreshContent(geoPoint);
    }

    // Ensure response exists and has posts
    const data = response.data as InfinityScrollPost;
    if (!data?.posts?.length) {
      return { posts: [], lastVisible: null };
    }

    // Process and return posts
    const postsWithUrls = await Promise.all(data.posts);
    return {
      posts: postsWithUrls,
      lastVisible: data.lastVisible || null,
    };
  } catch (error) {
    console.error('Error in handleFreshContent:', error);
    return { posts: [], lastVisible: null };
  }
};

const locationTypeToGeoPointType = (location: LocationType): GeoPointType => {
  return { _lat: location.latitude, _long: location.longitude };
};
