import MapView, { Circle, Marker, Region } from 'react-native-maps';
import MapViewCluster from 'react-native-map-clustering';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Place } from '../../../utils/types/types';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { radius } from '../../../utils/helper-functions/constants';
import { mapPlaceToPlacePrediction } from '../../../utils/helper-functions/mapPlaceToPlacePrediction';
import { usePlaceStore } from '../../../utils/store/placesStore';
import { fetchNearbyPlaces } from '../../../utils/helper-functions/fetchPlacesAPI';
import { useLocationStore } from '@/src/app/utils/store/locationStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { primaryColor } from '@/src/app/utils/styles/colors';

const latitudeDelta = 0.0045;
const longitudeDelta = 0.0045;

type LayoutProps = {
  setIsMapShown: (isSearching: boolean) => void;
};

export const MapSearch = (props: LayoutProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { location } = useLocationStore();
  const insets = useSafeAreaInsets();

  const mapRef = useRef<MapView>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>();
  const [region, setRegion] = useState<Region>({
    latitudeDelta,
    longitudeDelta,
    latitude: location?.latitude ?? 0,
    longitude: location?.longitude ?? 0,
  });

  const { setPlaceId, setPlaceName } = usePlaceStore();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  function pickPlace() {
    if (!selectedPlace) return;
    const placePrediction = mapPlaceToPlacePrediction(selectedPlace);
    setPlaceId(placePrediction.placeId);
    setPlaceName(placePrediction.structuredFormat.mainText.text);
    props.setIsMapShown(false);
    navigation.navigate('Feed');
  }

  const handleSearchSurrounding = async () => {
    setLoading(true);
    const data = await fetchNearbyPlaces(region);
    setLoading(false);
    setPlaces(data.places);
  };

  const onRegionChangeComplete = (newRegion: Region) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    // Debounce pre plynule posúvanie regionu
    debounceTimeout.current = setTimeout(() => {
      setRegion(newRegion); // region = stred mapy
      setSelectedPlace(null);
    }, 100);
  };

  return (
    <>
      <MapViewCluster
        style={styles.map}
        region={region}
        ref={mapRef}
        onRegionChangeComplete={onRegionChangeComplete}
        showsMyLocationButton
        showsCompass
        clusterColor="#10D9B9"
        clusterTextColor="#000"
      >
        {/* Circle vždy pre stred mapy */}
        <Circle
          center={region}
          radius={radius}
          strokeColor="rgb(1,82,133)"
          fillColor="rgba(117,141,166,0.2)"
          strokeWidth={2}
        />

        {!loading &&
          places?.map(place => (
            <Marker
              key={`${place.location.latitude}-${place.location.longitude}-${place.id}`}
              coordinate={{
                latitude: place.location.latitude,
                longitude: place.location.longitude,
              }}
              onPress={() => setSelectedPlace(place)}
              title={place.displayName.text}
            >
              <FontAwesomeIcon
                icon={Icons.Pin}
                size={32}
                color={selectedPlace?.id === place.id ? primaryColor : 'black'}
              />
            </Marker>
          ))}
      </MapViewCluster>

      <View style={styles.markerFixed}>
        <Image
          style={styles.marker}
          source={require('../../../../../assets/pin.png')}
        />
      </View>

      {/* Close button */}
      <TouchableOpacity
        onPress={() => props.setIsMapShown(false)}
        style={[styles.closeButton, { top: 20 + insets.top }]}
      >
        <FontAwesomeIcon icon={Icons.Remove} size={28} color="black" />
      </TouchableOpacity>

      {/* Bottom buttons */}
      <View style={[styles.buttonsContainer, { bottom: 30 + insets.bottom }]}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchSurrounding}
        >
          <Text style={styles.buttonText}>{t('search-surrounding')}</Text>
        </TouchableOpacity>

        {selectedPlace && (
          <TouchableOpacity style={styles.selectButton} onPress={pickPlace}>
            <Text style={styles.buttonText}>{t('select-location')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </>
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonsContainer: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'column',
    gap: 12,
  },
  searchButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  selectButton: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MapSearch;
