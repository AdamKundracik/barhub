import { Post, PostUrlExtended } from '../../../../shared';
import { getFreshContent, getPostsByPlaceID } from '../services/functions';
import { listFiles, listNewsFeedFiles } from './helperFunctions';

export const handlePlacePosts = async (placeId: string) => {
  const posts = await getPostsByPlaceID(placeId);
  const postObject = await listFiles(placeId);

  if (postObject?.fileNames && posts.data) {
    const postsWithUrls: PostUrlExtended[] = posts.data
      .map(post => mapPostToUrl(post, postObject))
      .filter((post): post is PostUrlExtended => post !== undefined);

    return postsWithUrls;
  }
};

const mapPostToUrl = (
  post: Post,
  postObject: { urls: string[]; fileNames: string[] }
): PostUrlExtended | undefined => {
  const fileIndex = postObject.fileNames.indexOf(post.fileId);
  if (fileIndex !== -1) {
    const url = postObject.urls[fileIndex] || '';
    return { ...post, url } as PostUrlExtended;
  }
  return undefined;
};

export const handleFreshContent = async () => {
  const posts = await getFreshContent();

  if (posts.data) {
    const postPromises = posts.data.map(post => mapNewsFeedPostToUrl(post));
    const postsWithUrls: PostUrlExtended[] = await Promise.all(postPromises);
    return postsWithUrls;
  } else {
    return [];
  }
};

const mapNewsFeedPostToUrl = async (post: Post): Promise<PostUrlExtended> => {
  const url = await listNewsFeedFiles(post.folderId + '/' + post.fileId);
  return { ...post, url } as PostUrlExtended;
};
