export interface Post {
  geohash: string;
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
}
