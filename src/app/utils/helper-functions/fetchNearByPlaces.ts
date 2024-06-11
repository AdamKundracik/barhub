import {LocationType} from "../types/types";
import {googleAPIKey, radius} from "./constants";

export const fetchNearbyPlaces = async (location: LocationType) => {

    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const requestBody = {
        includedTypes: ["restaurant", "bar", "cafe"],
        maxResultCount: 20,
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
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.id,places.types,places.location',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        return data
    } catch (error) {
        console.error('Error fetching nearby places:', error);
    }
};
