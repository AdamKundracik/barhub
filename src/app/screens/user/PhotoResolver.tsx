import {uploadImageAsync} from "../../utils/helper-functions/helperFunctions";
import {useEffect, useMemo, useRef, useState} from "react";
import MapView, {Circle, Marker, PROVIDER_DEFAULT} from 'react-native-maps';
import {ActivityIndicator, Keyboard, StyleSheet, View} from "react-native";
import Layout from "../../components/user/Layout";
import {useAuthContext} from "../../providers/AuthProvider";
import {fetchNearbyPlaces} from "../../utils/helper-functions/fetchNearByPlaces";
import {Place} from "../../utils/types/types";
import {PlaceDetail} from "../../components/user/PlaceDetail";
import {radius} from "../../utils/helper-functions/constants";


export const PhotoResolver = ({route, navigation}: any) => {
    const {location, setLocation} = useAuthContext();
    const {image} = route.params;
    const mapRef = useRef<MapView>(null);
    const [isSaving, setIsSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [places, setPlaces] = useState<Place[]>();
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
    const [detailOpened, setDetailOpened] = useState(false)

    useEffect(() => {

        async function getPlaces() {
            if (location) {
                const data = await fetchNearbyPlaces(location);
                setLoading(false)
                setPlaces(data.places)
            }
        }

        getPlaces()
    }, []);

    const region = useMemo(() => {
        return {
            latitude: location?.latitude ?? 0,
            longitude: location?.longitude ?? 0,
            latitudeDelta: 0.003 * (radius / 80 * 0.66),
            longitudeDelta: 0.003 * (radius / 80 * 0.66),
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
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <ActivityIndicator size={32}/>
                </View>
            </Layout>
        )
    }

    return (
        <Layout pageTitle={'PhotoResolver'}>
            <MapView
                style={styles.map}
                region={region}
                initialRegion={region}
                provider={PROVIDER_DEFAULT}
                ref={mapRef}
                showsUserLocation={true}
                showsMyLocationButton={true}
                onPress={Keyboard.dismiss}
                showsCompass={true}
            >
                <Circle center={location!} radius={radius} strokeColor={'rgb(1,82,133)'}
                        fillColor={'rgba(117,141,166,0.49)'}
                        strokeWidth={2}/>
                {places?.map((place: Place, index: number) =>
                    <Marker
                        key={index}
                        coordinate={place.location}
                        focusable={true}
                        onPress={() => {
                            setSelectedPlace(place);
                            setDetailOpened(true)
                        }}
                    >
                    </Marker>
                )}
            </MapView>
            <PlaceDetail isOpen={detailOpened} onClose={() => setDetailOpened(false)}
                         place={selectedPlace}/>
        </Layout>
    )
}

const styles = StyleSheet.create({
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default PhotoResolver
