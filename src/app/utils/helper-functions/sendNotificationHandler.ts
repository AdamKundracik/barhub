import { LocationType } from '../types/types';
import { distanceBetween, geohashQueryBounds, Geopoint } from 'geofire-common';
import { auth, db } from '../../../../firebaseConfig';
import {
  collection,
  query,
  orderBy,
  startAt,
  endAt,
  getDocs,
} from 'firebase/firestore';
import { User } from '../../../../shared';

export const sendNotificationHandler = async (
  placeLocation: LocationType
): Promise<string[] | undefined> => {
  try {
    // Extract latitude and longitude from Geopoint
    const locationArray: Geopoint = [
      placeLocation.latitude,
      placeLocation.longitude,
    ];

    // Get geohash query bounds for the location
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

    // Collect all the query results together into a single list
    const snapshots = await Promise.all(promises);

    const matchingDocs: User[] = [];
    for (const snap of snapshots) {
      for (const doc of snap.docs) {
        const location = doc.get('location'); // Access the location object
        const lat = location?.latitude;
        const lng = location?.longitude;

        // Ensure lat and lng exist before calculating the distance
        if (lat !== undefined && lng !== undefined) {
          // Filter out false positives due to GeoHash accuracy
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
