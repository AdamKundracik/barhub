import { googleAPIKey } from './constants';

export async function fetchPlaceDetails(placeId: string) {
  const placeDetailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googleAPIKey}`;

  try {
    const response = await fetch(placeDetailUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching place details:', error);
  }
}
