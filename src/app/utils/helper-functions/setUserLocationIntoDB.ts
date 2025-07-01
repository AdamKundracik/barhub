import { LocationType } from '../types/types';
import { geohashForLocation } from 'geofire-common';
import { setUser } from '../services/functions';

export const setUserIntoDB = async (location: LocationType) => {
  const hash = geohashForLocation([location.latitude, location.longitude]);
  await setUser({ location: location, geohash: hash });
};
