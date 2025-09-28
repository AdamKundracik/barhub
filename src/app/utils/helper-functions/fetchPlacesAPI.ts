import { getLocales } from 'expo-localization';
import { AutocompleteResponse, LocationType } from '../types/types';

export async function fetchPlaceDetails(placeId: string) {
  const placeDetailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}`;

  try {
    const response = await fetch(placeDetailUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching place details:', error);
  }
}

export const fetchNearbyPlaces = async (
  location: LocationType,
  radius: number
) => {
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
        'X-Goog-Api-Key': process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.id,places.types,places.location',
      },
      body: JSON.stringify(requestBody),
    });

    return await response.json();
  } catch (error) {
    console.error('Error fetching nearby places:', error);
  }
};

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
    includedPrimaryTypes: ['bar', 'cafe', 'bakery', 'night_club', 'restaurant'],
    languageCode: locales[0].languageCode,
    locationRestriction: {
      circle: {
        center: {
          latitude: location?.latitude,
          longitude: location?.longitude,
        },
        radius: 8000,
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const data: AutocompleteResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching place autocomplete:', error);
  }
};
