import { LocationType } from '../../src/app/utils/types/types';

export interface UserRecord {
  customClaims: { [key: string]: any };
  disabled: boolean;
  displayName: string | null;
  email: string;
  emailVerified: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  passwordHash: string | null;
  passwordSalt: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  providerData: Array<{
    email: string;
    providerId: string;
    uid: string;
  }>;
  tokensValidAfterTime: string | null;
  uid: string;
}

export interface User extends UserRecord {
  dateOfBirth: string;
  location: LocationType;
  geohash: string;
  pushToken: string;
  lastUploadedPost: string;
  premium: boolean;
  acceptTermsOfUse: boolean;
}

export type Post = {
  geohash: string;
  creationTime: string;
  timestamp: number;
  userId?: string;
  fileId: string;
  folderId: string;
  placeName: string;
  placeAddress: string;
  id: string;
  photoUrl: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  occupancy: string;
  user?: UserInfo;
};

export interface UserInfo {
  id: string;
  displayName: string;
  photoUrl: string;
}

export type InfinityScrollPost = {
  posts: Post[];
  lastVisible: string;
};

export interface PostUrlExtended extends Post {
  url: string;
}

export type CommentProps = {
  userName: string;
  commentText: string;
  creationTime: any;
  id: string;
  userId: string;
  userPhotoUrl: string;
};
