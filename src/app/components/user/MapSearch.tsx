import MapView, {
  Circle,
  Marker,
  PROVIDER_DEFAULT,
  Region,
} from 'react-native-maps';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Place, PlacePrediction } from '../../utils/types/types';
import Layout from './Layout';
import { useEffect, useRef, useState } from 'react';
import { fetchNearbyPlaces } from '../../utils/helper-functions/fetchNearByPlaces';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserContext } from '../../providers/UserProvider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { radius } from '../../utils/helper-functions/constants';
import { mapPlaceToPlacePrediction } from '../../utils/helper-functions/mapPlaceToPlacePrediction';

const latitudeDelta = 0.025;
const longitudeDelta = 0.025;

type LayoutProps = {
  setIsSearching: (isSearching: boolean) => void;
  setIsMapShown: (isSearching: boolean) => void;
  setPlace: (place: PlacePrediction) => void;
};

export const MapSearch = (props: LayoutProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { location } = useUserContext();

  const mapRef = useRef<MapView>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>();
  const [region, setRegion] = useState<Region>({
    latitudeDelta,
    longitudeDelta,
    latitude: location?.latitude!,
    longitude: location?.longitude!,
  });
  const regionTimeout = useRef<NodeJS.Timeout | null>(null);

  function pickPlace() {
    if (selectedPlace) {
      const placePrediction = mapPlaceToPlacePrediction(selectedPlace);
      props.setPlace(placePrediction);
      props.setIsSearching(false);
      props.setIsMapShown(false);
    }
  }

  useEffect(() => {
    setLoading(true);

    async function getPlaces() {
      if (region) {
        const data = await fetchNearbyPlaces(region);
        setLoading(false);
        setPlaces(data.places);
      } else {
        setLoading(false);
        console.error('Location could not be retrieved');
      }
    }

    getPlaces();
  }, [region]);

  const onRegionChange = (region: Region) => {
    setRegion(region);
  };

  const onRegionChangeComplete = (region: Region) => {
    // Clear the previous timeout
    if (regionTimeout.current) {
      clearTimeout(regionTimeout.current);
    }

    // Set a new timeout
    regionTimeout.current = setTimeout(() => {
      onRegionChange(region);
    }, 1000); // Delay for 1sec
  };

  return (
    <Layout pageTitle={'Map'}>
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
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {!loading &&
          places?.map((place: Place, index: number) => (
            <Marker
              key={index}
              coordinate={{
                latitude: place.location.latitude,
                longitude: place.location.longitude,
              }}
              pinColor={place === selectedPlace ? 'blue' : 'red'}
              onPress={() => {
                setSelectedPlace(place);
              }}
              title={place.displayName.text}
            />
          ))}
        {!loading && (
          <Circle
            center={region}
            radius={radius}
            strokeColor={'rgb(1,82,133)'}
            fillColor={'rgba(117,141,166,0.49)'}
            strokeWidth={2}
          />
        )}
      </MapView>
      <View style={styles.markerFixed}>
        <Image
          style={styles.marker}
          source={require('../../../../assets/pin.png')}
        />
      </View>
      <TouchableOpacity
        onPress={() => props.setIsMapShown(false)}
        style={styles.closeButton}
      >
        <FontAwesomeIcon icon={Icons.X} size={32} color={'black'} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.infoContainer} onPress={pickPlace}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
          {t('select-location')}
        </Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerFixed: {
    left: '50%',
    marginLeft: -18,
    marginTop: -30,
    position: 'absolute',
    top: '50%',
    zIndex: 100,
  },
  marker: {
    height: 48,
    width: 48,
  },
  infoContainer: {
    position: 'absolute',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignSelf: 'center',
    padding: 15,
    borderRadius: 30,
    bottom: 30,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});

export default MapSearch;
