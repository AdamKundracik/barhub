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
  dateOfBirth: Date;
  location: LocationType;
  pushToken: string;
  lastUploadedPost: Date;
}

export type Post = {
  creationTime: Date;
  timestamp: number;
  user_id: string;
  fileId: string;
  folderId: string;
  name: string;
  placeName: string;
  placeAddress: string;
  uid: string;
  id: string;
};

export interface PostUrlExtended extends Post {
  url: string;
}
