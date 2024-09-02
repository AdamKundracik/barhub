import { InfinityScrollPost, Post } from '../../../../shared';
import { getFreshContent, getPostsByPlaceID } from '../services/functions';

export const handlePlacePosts = async (placeId: string) => {
  const posts = await getPostsByPlaceID(placeId);
  if (posts.data) {
    return posts.data?.reverse();
  } else {
    return [];
  }
};

export const handleFreshContent = async (lastVisible?: string | null) => {
  let response;
  if (lastVisible) {
    response = await getFreshContent(lastVisible);
  } else {
    response = await getFreshContent();
  }
  const data = response.data as InfinityScrollPost;
  if (data.posts) {
    const postsWithUrls: Post[] = await Promise.all(data.posts);
    return {
      posts: postsWithUrls,
      lastVisible: data.lastVisible,
    } as InfinityScrollPost;
  } else {
    return {} as InfinityScrollPost;
  }
};
