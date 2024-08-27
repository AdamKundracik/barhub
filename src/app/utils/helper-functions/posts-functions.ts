import { Post } from '../../../../shared';
import { getFreshContent, getPostsByPlaceID } from '../services/functions';
import { getRandomRecentPosts } from './getRandomRecentPosts';

export const handlePlacePosts = async (placeId: string) => {
  const posts = await getPostsByPlaceID(placeId);
  if (posts.data) {
    return posts.data?.reverse();
  } else {
    return [];
  }
};

export const handleFreshContent = async () => {
  const posts = await getFreshContent();
  if (posts.data) {
    const postsWithUrls: Post[] = await Promise.all(posts.data);
    return getRandomRecentPosts(postsWithUrls.reverse());
  } else {
    return [];
  }
};
