import { googleAPIKey } from './constants';

export async function fetchPlacePhotos(
  photoReference: string,
  width: number,
  height: number
) {
  const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${width}&maxheight=${height}&photo_reference=${photoReference}&key=${googleAPIKey}`;

  try {
    const response = await fetch(photoUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.url;
  } catch (error) {
    console.error('Error fetching place photo:', error);
  }
}
