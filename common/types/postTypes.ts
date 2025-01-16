import firebase from 'firebase/compat';
import { GeoPoint } from 'firebase/firestore';

export interface Post {
  geohash: string;
  location: GeoPoint;
  creationTime: string;
  timestamp: number;
  userId: string;
  fileId: string;
  folderId: string;
  placeName: string;
  placeAddress: string;
  id: string;
  photoUrl: string;
  occupancy: string;
  likesCount?: number;
  commentsCount?: number;
  user?: UserInfo;
}

interface UserInfo {
  id: string;
  displayName: string;
  photoUrl: string;
}

export type InfinityScrollPost = {
  posts: Post[];
  lastVisible: string;
};
