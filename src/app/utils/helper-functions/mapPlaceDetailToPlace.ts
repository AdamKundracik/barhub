import { Place, PlaceDetail } from '../types/types';

// Function to map PlaceDetail to Place, with DisplayName
export function mapPlaceDetailToPlace(placeDetail: PlaceDetail): Place {
  return {
    displayName: {
      languageCode: 'en', // Assuming a default language code (adjust as needed)
      text: placeDetail.name, // Mapping the `name` to the `text` field of `DisplayName`
    },
    formattedAddress: placeDetail.formatted_address, // Mapping `formatted_address` to `formattedAddress`
    id: placeDetail.place_id, // Mapping `place_id` to `id`
    location: {
      latitude: placeDetail.geometry.location.lat,
      longitude: placeDetail.geometry.location.lng,
    }, // Mapping `geometry.location` to `location`
    types: placeDetail.types, // Mapping `types` array
  };
}
