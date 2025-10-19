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

// Post types are now in @/src/app/types/postTypes.ts
// Use: import { Post, InfinityScrollPost } from '@/src/app/types/postTypes';
export { Post, InfinityScrollPost } from '@/src/app/types/postTypes';

export interface UserInfo {
  id: string;
  displayName: string;
  photoUrl: string;
  expoPushToken?: string;
  role?: 'USER' | 'MODERATOR' | 'ADMIN';
}

// Legacy type - use Post from @/common/types/postTypes instead
export interface PostUrlExtended {
  url: string;
  // ... extends Post properties
}
