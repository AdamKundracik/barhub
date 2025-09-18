import { LocationType } from '../types/types';
import { distanceBetween, geohashQueryBounds } from 'geofire-common';
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
    if (!placeLocation.latitude || !placeLocation.longitude) {
      throw new Error('Invalid location');
    }

    const center = [placeLocation.latitude, placeLocation.longitude] as [
      number,
      number,
    ];
    const radiusInM = 800000; // 8 km

    // Compute geohash query bounds
    const bounds = geohashQueryBounds(center, radiusInM);
    const promises: Promise<any>[] = [];

    // Issue Firestore query for each geohash bound
    for (const b of bounds) {
      const q = query(
        collection(db, 'users'),
        orderBy('geohash'),
        startAt(b[0]),
        endAt(b[1])
      );
      promises.push(getDocs(q));
    }

    // Wait for all queries
    const snapshots = await Promise.all(promises);

    // Collect all users within actual distance
    const matchingUsers: User[] = [];

    for (const snap of snapshots) {
      for (const doc of snap.docs) {
        const location = doc.get('location');
        const lat = location?.latitude;
        const lng = location?.longitude;

        if (lat !== undefined && lng !== undefined) {
          const distanceInM = distanceBetween([lat, lng], center) * 1000;

          // Only include users within radius and exclude current user
          if (
            distanceInM <= radiusInM &&
            (doc.data() as User).uid !== auth.currentUser?.uid
          ) {
            matchingUsers.push(doc.data() as User);
          }
        }
      }
    }

    if (matchingUsers.length === 0) {
      Alert.alert('No nearby users found.');
      console.error('No nearby users found.');
      return;
    }

    // Return push tokens (filter out invalid)
    const tokens = matchingUsers
      .map(user => user.pushToken)
      .filter(token => token && token !== auth.currentUser?.uid);

    return tokens;
  } catch (error) {
    console.error('Error in sendNotificationHandler:', error);
  }
};
