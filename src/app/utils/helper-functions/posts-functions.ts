import { InfinityScrollPost, Post } from '../../../../shared';
import { getFreshContent } from '../services/post.service';
import { GeoPointType, LocationType } from '../types/types';
import { logger } from 'firebase-functions';

export const handleFreshContent = async (
  lastVisible?: string | null,
  placeId?: string | null,
  location?: LocationType
) => {
  const geoPoint = locationTypeToGeoPointType(
    location ?? { latitude: 0, longitude: 0 }
  );
  const response = lastVisible
    ? await getFreshContent(geoPoint, lastVisible)
    : await getFreshContent(geoPoint);
  const data = response.data as InfinityScrollPost;
  if (data.posts) {
    const postsWithUrls: Post[] = await Promise.all(data.posts); // If you need to transform posts, do it here.
    if (placeId) {
      const filteredPosts = postsWithUrls.filter(
        post => post.folderId === placeId
      );
      return { posts: filteredPosts, lastVisible: data.lastVisible };
    } else {
      return { posts: postsWithUrls, lastVisible: data.lastVisible };
    }
  }
  return { posts: [], lastVisible: null };
};

const locationTypeToGeoPointType = (location: LocationType): GeoPointType => {
  return { _lat: location.latitude, _long: location.longitude };
};
