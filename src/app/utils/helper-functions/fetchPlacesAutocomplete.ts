import { googleAPIKey } from './constants';
import { LocationType } from '../types/types';

export const fetchPlaceAutocomplete = async (
  input: string,
  location: LocationType
) => {
  const url = 'https://places.googleapis.com/v1/places:autocomplete';
  const requestBody = {
    input: input,
    locationRestriction: {
      circle: {
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        radius: 5000.0,
      },
    },
  };

  console.log(JSON.stringify(requestBody));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleAPIKey,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching place autocomplete:', error);
  }
};
