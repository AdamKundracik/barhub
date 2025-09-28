import { Timestamp } from 'firebase/firestore';
import { FirebaseTimestamp, LocationType } from '@/src/app/utils/types/types';

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
  pushToken: string[] | null;
  lastUploadedPost: FirebaseTimestamp;
  premium: boolean;
  acceptTermsOfUse: boolean;
  isUsingFakeLocation: boolean;
  fakeLocation: LocationType;
  fakeLocationName: string;
  searchHistory?: SearchHistoryItem[];
}

export interface SearchHistoryItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

export type Post = {
  geohash: string;
  location: {
    _lat: number;
    _long: number;
  };
  placeTypes: string[];
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
  creationTime: Timestamp;
  user?: UserInfo;
};

export interface UserInfo {
  id: string;
  displayName: string;
  photoUrl: string;
  expoPushToken?: string;
}

export type InfinityScrollPost = {
  posts: Post[];
  lastVisible: string;
};

export interface PostUrlExtended extends Post {
  url: string;
}
