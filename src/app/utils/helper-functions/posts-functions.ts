import { InfinityScrollPost, Post } from '../../../../shared';
import { getFreshContent } from '../services/post.service';

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
