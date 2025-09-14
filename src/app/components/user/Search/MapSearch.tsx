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
import { Place } from '../../../utils/types/types';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { useUserContext } from '../../../providers/UserProvider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { radius } from '../../../utils/helper-functions/constants';
import { mapPlaceToPlacePrediction } from '../../../utils/helper-functions/mapPlaceToPlacePrediction';
import { usePlaceStore } from '../../../utils/store/placesStore';
import { fetchNearbyPlaces } from '../../../utils/helper-functions/fetchPlacesAPI';

const latitudeDelta = 0.0045;
const longitudeDelta = 0.0045;

type LayoutProps = {
  setIsMapShown: (isSearching: boolean) => void;
};

export const MapSearch = (props: LayoutProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { location } = useUserContext();

  const mapRef = useRef<MapView>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>();
  const [region, setRegion] = useState<Region>({
    latitudeDelta,
    longitudeDelta,
    latitude: location?.latitude!,
    longitude: location?.longitude!,
  });

  const { setPlaceId, setPlaceName } = usePlaceStore();

  function pickPlace() {
    if (selectedPlace) {
      const placePrediction = mapPlaceToPlacePrediction(selectedPlace);
      setPlaceId(placePrediction.placeId);
      setPlaceName(placePrediction.structuredFormat.mainText.text);
      props.setIsMapShown(false);
      navigation.navigate('Feed');
    }
  }

  const handleSearchSurrounding = async () => {
    setLoading(true);
    const data = await fetchNearbyPlaces(region);
    setLoading(false);
    setPlaces(data.places);
  };

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const onRegionChangeComplete = (newRegion: Region) => {
    setSelectedPlace(null);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setRegion(newRegion);
    }, 1000);
  };

  return (
    <>
      <MapView
        style={styles.map}
        region={region}
        provider={PROVIDER_DEFAULT}
        ref={mapRef}
        showsMyLocationButton={true}
        showsCompass={true}
        onPress={() => {
          Keyboard.dismiss();
        }}
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
              onPress={() => {
                setSelectedPlace(place);
              }}
              title={place.displayName.text}
            >
              <FontAwesomeIcon icon={Icons.Pin} size={24} color={'black'} />
            </Marker>
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
          source={require('../../../../../assets/pin.png')}
        />
      </View>

      <TouchableOpacity
        onPress={() => props.setIsMapShown(false)}
        style={styles.closeButton}
      >
        <FontAwesomeIcon icon={Icons.Remove} size={28} color={'black'} />
      </TouchableOpacity>

      <View style={styles.buttonsContainer}>
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
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'column',
    gap: 12, // aby boli medzi nimi medzery (RN >=0.71 podporuje gap)
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
