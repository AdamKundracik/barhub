import { LocationType } from '../types/types';
import { distanceBetween, geohashQueryBounds, Geopoint } from 'geofire-common';
import { auth, db } from '../../../../firebaseConfig';
import {
  collection,
  endAt,
  getDocs,
  orderBy,
  query,
  startAt,
} from 'firebase/firestore';
import { User } from '../../../../shared';
import { Alert } from 'react-native';

export const sendNotificationHandler = async (
  placeLocation: LocationType
): Promise<string[] | undefined> => {
  try {
    const locationArray: Geopoint = [
      placeLocation.latitude,
      placeLocation.longitude,
    ];

    console.log(locationArray);

    const bounds = geohashQueryBounds(locationArray, 8000);
    const promises = [];

    for (const b of bounds) {
      const q = query(
        collection(db, 'users'),
        orderBy('geohash'),
        startAt(b[0]),
        endAt(b[1])
      );

      promises.push(getDocs(q));
    }

    const snapshots = await Promise.all(promises);

    const matchingDocs: User[] = [];
    console.log(matchingDocs);
    for (const snap of snapshots) {
      for (const doc of snap.docs) {
        const location = doc.get('location');
        const lat = location?.latitude;
        const lng = location?.longitude;

        if (lat !== undefined && lng !== undefined) {
          const distanceInKm = distanceBetween([lat, lng], locationArray);
          const distanceInM = distanceInKm * 1000;

          if (
            Math.floor(distanceInM) <= 30 &&
            (doc.data() as User).uid !== auth.currentUser?.uid
          ) {
            matchingDocs.push(doc.data() as User);
          }
        }
      }
    }

    if (!matchingDocs || matchingDocs.length === 0) {
      Alert.alert('No nearby users found.');
      console.error('No nearby users found.');
      return;
    }
    // If I am at same place, filter my ID so notification insnt sent to me as well
    const tokens = matchingDocs
      .map(user => user.pushToken)
      .filter(token => token != auth.currentUser?.uid);
    return tokens;
  } catch (error) {
    console.error('Error in sendNotificationHandler:', error);
  }
};
