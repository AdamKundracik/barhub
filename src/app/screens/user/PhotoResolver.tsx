import {uploadImageAsync} from "../../utils/helper-functions/helperFunctions";
import {useEffect, useMemo, useRef, useState} from "react";
import MapView, {Callout, Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE} from 'react-native-maps';
import {ActivityIndicator, Keyboard, Platform, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import Layout from "../../components/user/Layout";
import {useAuthContext} from "../../providers/AuthProvider";
import {fetchNearbyPlaces} from "../../utils/helper-functions/fetchNearByPlaces";
import {truncate} from "../../utils/helper-functions/truncate";
import {commonAppStyles, formStyles} from "../../utils/styles/styles";

export const googleAPIKey = "AIzaSyAMoNX-aQzrjpnZ0KjYegeyhV47C8rRBVU";
export const radius = 70


export const PhotoResolver = ({route, navigation}: any) => {
    const {location, setLocation} = useAuthContext();
    const {image} = route.params;
    const mapRef = useRef<MapView>(null);
    const [isSaving, setIsSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [places, setPlaces] = useState<any>();
    const [nextPageToken, setNextPageToken] = useState(null);


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
                        focusable={true}
                    >
                        <Callout>
                            <View style={{padding: 10}}>
                                <Text>{place.displayName.text}</Text>
                                <Text>{truncate(place.formattedAddress, 40)}</Text>
                                <Text>{place.id}</Text>
                                <TouchableOpacity style={formStyles.buttonSecondary}>
                                    <Text style={commonAppStyles.textPrimary}>Choose</Text>
                                </TouchableOpacity>
                            </View>
                        </Callout>
                    </Marker>
                )}

            </MapView>
        </Layout>
    )
}

const styles = StyleSheet.create({
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default PhotoResolver
