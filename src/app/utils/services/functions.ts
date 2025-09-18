import { httpsCallable } from 'firebase/functions';
import {
  EmptyDataResponse,
  EmptyDataResult,
  GetAllUsersResult,
  GetUserResult,
  SetDocumentFromCollectionRequest,
} from '../types/functions-types';
import { MISSING_REQUIRED_REQUEST_PARAMS } from '../helper-functions/constants';
import { Post, User } from '@/shared';
import { functions } from '@/firebaseConfig';
import { StatusResponse } from '@/functions/src';

export const savePost = async (
  data: Partial<Post>
): Promise<EmptyDataResult> => {
  if (!data) return MISSING_REQUIRED_REQUEST_PARAMS;
  const cloudFunction = httpsCallable<
    SetDocumentFromCollectionRequest['data']['data']
  >(functions, 'savePostSecondGen');
  const { data: response } = (await cloudFunction({
    ...data,
  })) as unknown as EmptyDataResponse;
  return response;
};

export const setUser = async (data: Partial<User>): Promise<StatusResponse> => {
  if (!data) return { success: false };

  const cloudFunction = httpsCallable<{ user: Partial<User> }, StatusResponse>(
    functions,
    'setUserSecondGen'
  );

  const { data: response } = await cloudFunction({
    user: data,
  });

  return response;
};

export const getCurrentUser = async (): Promise<User | undefined> => {
  const cloudFunction = httpsCallable(functions, 'getCurrentUser');
  const response = (await cloudFunction()) as unknown as GetUserResult;
  return response.data;
};

export const getAllExistingUsers = async (): Promise<GetAllUsersResult> => {
  const cloudFunction = httpsCallable(
    functions,
    'getAllExistingUsersSecondGen'
  );
  const response = (await cloudFunction()) as unknown as GetAllUsersResult;
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

export const fetchPostById = async (postId: string) => {
  const cloudFunction = httpsCallable(functions, 'getPostByIdSecondGen');
  const response = await cloudFunction({ postId });
  return response.data;
};
