import { InfinityScrollPost, Post } from '../../../../shared';
import { getFreshContent, getPostsByPlaceID } from '../services/functions';

export const handlePlacePosts = async (
  placeId: string,
  lastVisible?: string
) => {
  const response = lastVisible
    ? await getPostsByPlaceID(placeId, lastVisible)
    : await getPostsByPlaceID(placeId);
  const data = response.data as InfinityScrollPost;

  if (data.posts) {
    const postsWithUrls: Post[] = await Promise.all(data.posts); // If you need to transform posts, do it here.
    return { posts: postsWithUrls, lastVisible: data.lastVisible };
  }
  return { posts: [], lastVisible: null };
};

export const handleFreshContent = async (
  lastVisible?: string | null,
  placeId?: string | null
) => {
  const response = lastVisible
    ? await getFreshContent(lastVisible)
    : await getFreshContent();
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
