import {uploadImageAsync} from "../../utils/helper-functions/helperFunctions";
import {useEffect, useMemo, useRef, useState} from "react";
import MapView, {Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE} from 'react-native-maps';
import {ActivityIndicator, Button, Keyboard, Platform, StyleSheet} from "react-native";
import Layout from "../../components/user/Layout";
import {useAuthContext} from "../../providers/AuthProvider";


export const googleAPIKey = "AIzaSyAMoNX-aQzrjpnZ0KjYegeyhV47C8rRBVU";
export const radius = 200


export const PhotoResolver = ({route, navigation}: any) => {
    const {location, setLocation} = useAuthContext();
    const urlBar =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location?.latitude},${location?.longitude}&radius=${radius}&maxResults=2&type=bar&key=${googleAPIKey}`

    const urlCafe =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location?.latitude},${location?.longitude}&radius=${radius}&maxResults=2&&type=cafe&key=${googleAPIKey}`

    const urlRestaurant =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location?.latitude},${location?.longitude}&radius=${radius}&maxResults=2&&type=restaurant&key=${googleAPIKey}`
    // const urlBar =
    //     "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" +
    //     location?.latitude +
    //     "," +
    //     location?.longitude +
    //     "&radius=" +
    //     4000 +
    //     "&type=" +
    //     'bar' +
    //     "&key=" +
    //     googleAPIKey;

    const {image} = route.params;
    const mapRef = useRef<MapView>(null);
    const [isSaving, setIsSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [places, setPlaces] = useState<any>();
    const [nextPageToken, setNextPageToken] = useState(null);


    // useEffect(() => {
    //     const placesArray: any = []
    //
    //     fetch(urlCafe)
    //         .then(res => {
    //             return res.json();
    //         })
    //         .then(res => {
    //             for (let googlePlace of res.results) {
    //                 const place: any = {}
    //                 const myLat = googlePlace.geometry.location.lat;
    //                 const myLong = googlePlace.geometry.location.lng;
    //                 const coordinate = {
    //                     latitude: myLat,
    //                     longitude: myLong,
    //                 };
    //                 place["placeTypes"] = googlePlace.types;
    //                 place["coordinate"] = coordinate;
    //                 place["placeId"] = googlePlace.place_id;
    //                 place["placeName"] = googlePlace.name;
    //                 placesArray.push(place);
    //             }
    //         })
    //         .catch(error => {
    //             console.log(error);
    //         });
    //
    //     fetch(urlRestaurant)
    //         .then(res => {
    //             return res.json();
    //         })
    //         .then(res => {
    //             for (let googlePlace of res.results) {
    //                 const place: any = {}
    //                 const myLat = googlePlace.geometry.location.lat;
    //                 const myLong = googlePlace.geometry.location.lng;
    //                 const coordinate = {
    //                     latitude: myLat,
    //                     longitude: myLong,
    //                 };
    //                 place["placeTypes"] = googlePlace.types;
    //                 place["coordinate"] = coordinate;
    //                 place["placeId"] = googlePlace.place_id;
    //                 place["placeName"] = googlePlace.name;
    //                 placesArray.push(place);
    //             }
    //         })
    //         .catch(error => {
    //             console.log(error);
    //         });
    //
    //     fetch(urlBar)
    //         .then(res => {
    //             return res.json();
    //         })
    //         .then(res => {
    //             for (let googlePlace of res.results) {
    //                 const place: any = {}
    //                 const myLat = googlePlace.geometry.location.lat;
    //                 const myLong = googlePlace.geometry.location.lng;
    //                 const coordinate = {
    //                     latitude: myLat,
    //                     longitude: myLong,
    //                 };
    //                 place["placeTypes"] = googlePlace.types;
    //                 place["coordinate"] = coordinate;
    //                 place["placeId"] = googlePlace.place_id;
    //                 place["placeName"] = googlePlace.name;
    //                 placesArray.push(place);
    //             }
    //         })
    //         .catch(error => {
    //             console.log(error);
    //         });
    //
    //     setPlaces(placesArray)
    //     console.log(places.map((place: any) => place.placeTypes))
    //
    //     setLoading(false)
    //
    // }, []);

    const fetchNearbyPlaces = async (pageToken = null) => {

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

        if (pageToken) {
            requestBody.pageToken = pageToken;
        }

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
            // console.log(data.places)
            setPlaces(data.places);
            console.log(places)
            setNextPageToken(data.nextPageToken || null);
        } catch (error) {
            console.error('Error fetching nearby places:', error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchNearbyPlaces();
    }, []);

    const region = useMemo(() => {
        return {
            latitude: location?.latitude ?? 0,
            longitude: location?.longitude ?? 0,
            latitudeDelta: 0.05 * (2 * 0.66),
            longitudeDelta: 0.05 * (2 * 0.66),
        }

    }, []);


    async function savePicture() {
        if (image) {
            try {
                setIsSaving(true)
                await uploadImageAsync(image).then(() => {
                    setIsSaving(false)
                    // setImage(null);
                })
            } catch (error) {
                console.log(error);
            }
        }
    };

    if (loading) {
        return (
            <Layout pageTitle={'izi'}>
                <ActivityIndicator></ActivityIndicator>
            </Layout>
        )
    }

    return (
        <Layout pageTitle={'PhotoResolver'}>
            <MapView
                style={styles.map}
                region={region}
                initialRegion={region}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                ref={mapRef}
                showsUserLocation={true}
                showsMyLocationButton={true}
                onPress={Keyboard.dismiss}
                showsCompass={true}
            >
                {places?.map((place: any, index: number) =>
                    <Marker
                        key={index}
                        coordinate={place.location}
                        title={place?.displayName?.text}
                        description={place.id}
                    />
                )}

            </MapView>
            <Button title="Load More" onPress={() => fetchNearbyPlaces(nextPageToken)}/>
        </Layout>
    )
}

const styles = StyleSheet.create({
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default PhotoResolver
