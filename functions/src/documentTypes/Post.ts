export interface PostDocument {
  creationTime: string;
  timestamp: number;
  userId: string;
  fileId: string;
  folderId: string;
  placeName: string;
  placeAddress: string;
  id: string;
  photoUrl: string;
  likesCount?: number;
  commentsCount?: number;
  occupancy: string;
}
