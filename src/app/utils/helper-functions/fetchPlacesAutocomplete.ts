import { googleAPIKey } from './constants';
import { AutocompleteResponse, LocationType } from '../types/types';
import { getLocales } from 'expo-localization';

export const fetchPlaceAutocomplete = async (
  query: string,
  location: LocationType | undefined,
  sessionToken: string
) => {
  const locales = getLocales();

  const url = 'https://places.googleapis.com/v1/places:autocomplete';
  const requestBody = {
    input: query,
    sessionToken: sessionToken,
    includedPrimaryTypes: [
      'bar',
      'cafe',
      'bakery',
      'night_club',
      'restaurant',
      'bowling_alley',
    ],
    languageCode: locales[0].languageCode,
    locationRestriction: {
      circle: {
        center: {
          latitude: location?.latitude,
          longitude: location?.longitude,
        },
        radius: 7500,
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleAPIKey,
      },
      body: JSON.stringify(requestBody),
    });

    const data: AutocompleteResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching place autocomplete:', error);
  }
};
