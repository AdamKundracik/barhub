import { LocationType } from '../types/types';
import { haversineDistance } from './distanceBetweenPoints';
import { testLog } from '../services/functions';
import { User } from '../../../../shared';

export const sendNotificationHandler = async (
  placeLocation: LocationType
): Promise<string[]> => {
  const tokens: string[] = [];

  try {
    const usersResponse = await testLog();
    console.log(usersResponse.data);

    if (!usersResponse.data) {
      console.error('No users found or data is not in the expected format');
      return [];
    }

    const users: User[] = usersResponse.data.users;

    if (!Array.isArray(users)) {
      console.error('Users data is not an array');
      return [];
    }

    users?.forEach(user => {
      const distanceResp = haversineDistance(
        user?.location?.latitude,
        user?.location?.longitude,
        placeLocation?.latitude,
        placeLocation?.longitude // Correct the last parameter to placeLocation.longitude
      );

      if (distanceResp < 30) {
        tokens.push(user.pushToken);
      }
    });
  } catch (error) {
    console.error('Error in sendNotificationHandler:', error);
  }

  tokens.filter(token => token);
  return tokens;
};
