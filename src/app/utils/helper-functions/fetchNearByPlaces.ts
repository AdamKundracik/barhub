import { LocationType } from '../types/types';
import { googleAPIKey, radius } from './constants';
import { getLocales } from 'expo-localization';

export const fetchNearbyPlaces = async (location: LocationType) => {
  const locales = getLocales();

  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  const requestBody = {
    includedTypes: ['bar', 'cafe', 'bakery', 'night_club', 'restaurant'],
    maxResultCount: 20,
    languageCode: locales[0].languageCode,
    locationRestriction: {
      circle: {
        center: {
          latitude: location?.latitude,
          longitude: location?.longitude,
        },
        radius: radius,
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleAPIKey,
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.id,places.types,places.location',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching nearby places:', error);
  }
};
