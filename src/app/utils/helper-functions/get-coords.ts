import {getCurrentPositionAsync, LocationAccuracy, requestForegroundPermissionsAsync} from 'expo-location';
import {LocationType} from "../types/types";

export async function getCoords(): Promise<LocationType> {
    const {status} = await requestForegroundPermissionsAsync();

    if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
    }

    const locationData = await getCurrentPositionAsync({
        accuracy: LocationAccuracy.Balanced,
    });
    const {latitude, longitude} = locationData.coords;
    return {latitude: latitude, longitude: longitude}
}
