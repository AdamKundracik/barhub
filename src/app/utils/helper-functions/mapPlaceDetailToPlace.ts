import { Place, PlaceDetail } from '../types/types';

export function mapPlaceDetailToPlace(placeDetail: PlaceDetail): Place {
  return {
    displayName: {
      languageCode: 'en',
      text: placeDetail.name,
    },
    formattedAddress: placeDetail.formatted_address,
    id: placeDetail.place_id,
    location: {
      latitude: placeDetail.geometry.location.lat,
      longitude: placeDetail.geometry.location.lng,
    },
    types: placeDetail.types,
  };
}
