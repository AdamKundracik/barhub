import { InfinityScrollPost, Post } from '../../../../shared';
import { getFreshContent, getPostsByPlaceId } from './post.service';
import { GeoPointType, LocationType, PlaceType } from '../types/types';

export const handleFreshContent = async (
  radius: number,
  lastVisible?: string | null,
  placeId?: string | null,
  location?: LocationType,
  selectedPlaceTypes?: PlaceType[]
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

    // If no place types are selected, return all posts
    if (!selectedPlaceTypes?.length) {
      return {
        posts: data.posts,
        lastVisible: data.lastVisible || null,
      };
    }

    // Filter posts based on selected place types
    const filteredPosts = data.posts.filter(post => {
      const postTypes = post.placeTypes || [];
      return selectedPlaceTypes.some(selectedType =>
        postTypes.includes(selectedType)
      );
    });

    return {
      posts: filteredPosts,
      lastVisible:
        filteredPosts.length > 0
          ? filteredPosts[filteredPosts.length - 1].id
          : null,
    };
  } catch (error) {
    return { posts: [], lastVisible: null };
  }
};

const locationTypeToGeoPointType = (location: LocationType): GeoPointType => {
  return { _lat: location.latitude, _long: location.longitude };
};
