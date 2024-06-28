import { useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Layout from '../../components/user/Layout';
import { fetchNearbyPlaces } from '../../utils/helper-functions/fetchNearByPlaces';
import { Place } from '../../utils/types/types';
import { PlaceDetail } from '../../components/user/PlaceDetail';
import { radius } from '../../utils/helper-functions/constants';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../../providers/UserProvider';

export const PhotoResolver = ({ route }: any) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { location } = useUserContext();

  const mapRef = useRef<MapView>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [detailOpened, setDetailOpened] = useState(false);

  useEffect(() => {
    async function getPlaces() {
      if (location) {
        const data = await fetchNearbyPlaces(location);
        setLoading(false);
        setPlaces(data.places);
      } else {
        setLoading(false);
        console.error('Location could not be retrieved');
      }
    }

    getPlaces();
  }, []);

  const region = useMemo(() => {
    return {
      latitude: location?.latitude ?? 0,
      longitude: location?.longitude ?? 0,
      latitudeDelta: 0.003 * ((radius / 80) * 0.66),
      longitudeDelta: 0.003 * ((radius / 80) * 0.66),
    };
  }, []);

  if (loading) {
    return (
      <Layout pageTitle={'izi'}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size={32} />
        </View>
      </Layout>
    );
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
        <Circle
          center={location!}
          radius={radius}
          strokeColor={'rgb(1,82,133)'}
          fillColor={'rgba(117,141,166,0.49)'}
          strokeWidth={2}
        />
        {places?.map((place: Place, index: number) => (
          <Marker
            key={index}
            coordinate={place.location}
            focusable={true}
            onPress={() => {
              setSelectedPlace(place);
              setDetailOpened(true);
            }}
          ></Marker>
        ))}
      </MapView>
      <PlaceDetail
        isOpen={detailOpened}
        onClose={() => setDetailOpened(false)}
        place={selectedPlace}
      />

      <View style={styles.infoContainer}>
        <Text style={{ fontWeight: 'bold', fontSize: 24 }}>
          {t('select-location')}
        </Text>
      </View>

      <TouchableOpacity
        style={{ position: 'absolute', left: 20, top: 40 }}
        onPress={() => navigation.navigate('Camera')}
      >
        <FontAwesomeIcon icon={Icons.Back} color={'grey'} size={32} />
      </TouchableOpacity>
    </Layout>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignSelf: 'center',
    padding: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'grey',
  },
});

export default PhotoResolver;
