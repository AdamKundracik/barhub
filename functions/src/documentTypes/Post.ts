import firebase from 'firebase/compat';
import { GeoPoint } from 'firebase/firestore';

export interface PostDocument {
  creationTime: string;
  geohash: string;
  location: GeoPointType;
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
