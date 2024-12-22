import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../firebaseConfig';
import {
  EmptyDataResponse,
  EmptyDataResult,
  GetAllPostsResult,
  GetAllUsersResult,
  GetFreshnessContentResult,
  GetUserResult,
  SetDocumentFromCollectionRequest,
} from '../helper-functions/functions-types';
import { MISSING_REQUIRED_REQUEST_PARAMS } from '../helper-functions/constants';
import { User } from '../../../../shared';
import { Post, User } from '../../../../shared';
import { LocationType } from '../types/types';
import { GeoPoint } from 'firebase/firestore';
import {
  AddedCommentResponse,
  PostCommentsResponse,
} from '../../../../common/types/commentTypes';

export const savePost = async (
  data: Partial<Post>
): Promise<EmptyDataResult> => {
  if (!data) return MISSING_REQUIRED_REQUEST_PARAMS;
  const cloudFunction = httpsCallable<
    SetDocumentFromCollectionRequest['data']['data']
  >(functions, 'savePost');
  const { data: response } = (await cloudFunction({
    ...data,
  })) as unknown as EmptyDataResponse;
  return response;
};

export const setUser = async (
  data: Partial<User>
): Promise<EmptyDataResult> => {
  if (!data) return MISSING_REQUIRED_REQUEST_PARAMS;
  const cloudFunction = httpsCallable<
    SetDocumentFromCollectionRequest['data']['data']
  >(functions, 'setUser');
  const { data: response } = (await cloudFunction({
    ...data,
  })) as unknown as EmptyDataResponse;
  return response;
};

export const getCurrentUser = async (): Promise<User | undefined> => {
  const cloudFunction = httpsCallable(functions, 'getCurrentUser');
  const response = (await cloudFunction()) as unknown as GetUserResult;
  return response.data;
};

export const getAllExistingUsers = async (): Promise<GetAllUsersResult> => {
  const cloudFunction = httpsCallable(functions, 'getAllExistingUsers');
  const response = (await cloudFunction()) as unknown as GetAllUsersResult;
  return response;
};

export const testLog = async (): Promise<GetAllUsersResult> => {
  const cloudFunction = httpsCallable(functions, 'testLog');
  const response = (await cloudFunction()) as unknown as GetAllUsersResult;
  return response;
};

export const getPosts = async (): Promise<GetAllPostsResult> => {
  const cloudFunction = httpsCallable(functions, 'getPosts');
  const response = (await cloudFunction()) as unknown as GetAllPostsResult;
  return response;
};

export const getPostsByPlaceID = async (
  placeId: string,
  lastVisible?: string
): Promise<GetFreshnessContentResult> => {
  const cloudFunction = httpsCallable(functions, 'getPostsByPlaceId');
  const response = (await cloudFunction({
    pageSize: 5,
    lastVisible: lastVisible,
    placeId,
  })) as unknown as GetFreshnessContentResult;
  return response;
};

export const toggleLike = async (
  postId: string,
  userId: string
): Promise<any> => {
  const cloudFunction = httpsCallable(functions, 'toggleLike');
  const response = await cloudFunction({
    postId,
    userId,
  });
  return response;
};

export const addCommentToPost = async (
  postId: string,
  userId: string,
  userName: string,
  userPhotoUrl: string,
  commentText: string
) => {
  const cloudFunction = httpsCallable(functions, 'addComment');
  const response = await cloudFunction({
    postId,
    userId,
    userName,
    userPhotoUrl,
    commentText,
export const checkLikeStatus = async (
  postId: string,
  userId: string
): Promise<any> => {
  const cloudFunction = httpsCallable(functions, 'getLikeStatus');
  const response = await cloudFunction({
    postId,
    userId,
  });
  return response;
};

// Function to fetch comments for a post
export const fetchCommentsForPost = async (postId: string) => {
  const cloudFunction = httpsCallable(functions, 'getComments');
  const response = await cloudFunction({ postId });
  return response?.data?.comments;
};

export const fetchPostById = async (postId: string) => {
  const cloudFunction = httpsCallable(functions, 'getPostById');
  const response = await cloudFunction({ postId });
  return response.data;
};
