import { Place, PlacePrediction } from '../types/types';

export const mapPlaceToPlacePrediction = (place: Place): PlacePrediction => {
  return {
    place: `places/${place.id}`,
    placeId: place.id,
    text: {
      text: place.displayName.text,
      matches: [],
    },
    structuredFormat: {
      mainText: {
        text: place.displayName.text,
        matches: [],
      },
      secondaryText: {
        text: place.formattedAddress,
      },
    },
    types: place.types,
  };
};

export const mapPlaceDetailToPlacePrediction = (
  place: any
): PlacePrediction => {
  return {
    place: `places/${place.result.place_id}`,
    placeId: place.result.place_id,
    text: {
      text: place.result.name,
      matches: [],
    },
    structuredFormat: {
      mainText: {
        text: place.result.name,
        matches: [],
      },
      secondaryText: {
        text: place.formattedAddress,
      },
    },
    types: place.types,
  };
};

const mapPlacesToPlacePredictions = (places: Place[]): PlacePrediction[] => {
  return places.map(mapPlaceToPlacePrediction);
};
