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
import { Post, User } from '../../../../shared';

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

export const getCurrentUser = async (
  userId: string
): Promise<GetUserResult> => {
  if (!userId) return MISSING_REQUIRED_REQUEST_PARAMS;
  const cloudFunction = httpsCallable(functions, 'getCurrentUser');
  const response = (await cloudFunction(userId)) as unknown as GetUserResult;
  return response;
};

export const getAllUsers = async (): Promise<GetAllUsersResult> => {
  const cloudFunction = httpsCallable(functions, 'getAllUsers');
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

export const getFreshContent = async (): Promise<GetFreshnessContentResult> => {
  const cloudFunction = httpsCallable(functions, 'getFreshContent');
  const response =
    (await cloudFunction()) as unknown as GetFreshnessContentResult;
  return response;
};
