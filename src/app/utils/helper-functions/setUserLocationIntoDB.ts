import { LocationType } from '../types/types';
import { geohashForLocation } from 'geofire-common';
import { setUser } from '../services/functions';

export const setUserIntoDB = async (
  location: LocationType,
  isUsingFakeLocatio: boolean
) => {
  const hash = geohashForLocation([location.latitude, location.longitude]);
  if (isUsingFakeLocatio) {
    await setUser({ fakeLocation: location, geohash: hash });
  } else {
    await setUser({ location: location, geohash: hash });
  }
};
