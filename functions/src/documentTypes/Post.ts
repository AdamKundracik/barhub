import * as admin from 'firebase-admin';

export interface PostDocument {
  creationTime: admin.firestore.Timestamp;
  geohash: string;
  location: GeoPointType;
  placeTypes: string[];
  timestamp: number;
  userId: string;
  fileId: string;
  folderId: string;
  placeName: string;
  placeAddress: string;
  id: string;
  photoUrl: string;
  occupancy: string;
}

export type GeoPointType = {
  _lat: number;
  _long: number;
};
