import React, { useCallback, useRef, useState } from 'react';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import MapViewCluster from 'react-native-map-clustering';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Place } from '../../../utils/types/types';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { mapSearchRadius } from '../../../utils/constants/constants';
import { mapPlaceToPlacePrediction } from '../../../utils/helper-functions/mapPlaceToPlacePrediction';
import { usePlaceStore } from '../../../utils/store/placesStore';
import { fetchNearbyPlaces } from '../../../utils/api/fetchPlacesAPI';
import { useLocationStore } from '@/src/app/utils/store/locationStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GEOFENCE_CONFIG,
  isLocationWithinPerimeter,
} from '../../../utils/helper-functions/geofencing';
import {
  postBgColor,
  primaryBgColor,
  primaryColor,
  primaryDeepColor,
  separatorColor,
} from '@/src/app/utils/styles/colors';
import FastImage from 'react-native-fast-image';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';

const LATITUDE_DELTA = 0.0035;
const LONGITUDE_DELTA = 0.0035;
const DEBOUNCE_DELAY = 100;

type LayoutProps = {
  setIsMapShown: (isSearching: boolean) => void;
};

export const MapSearch = ({ setIsMapShown }: LayoutProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { location } = useLocationStore();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { setPlaceId, setPlaceName, setPlaceAddress } = usePlaceStore();

  const mapRef = useRef<MapView>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [region, setRegion] = useState<Region>({
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
    latitude: location?.latitude ?? 0,
    longitude: location?.longitude ?? 0,
  });

  const closeMap = useCallback(() => {
    setIsMapShown(false);
  }, [setIsMapShown]);

  const pickPlace = useCallback(() => {
    if (!selectedPlace) return;

    console.log('=== PLACE CONFIRMED/SELECTED ===');
    console.log('Place Details:', JSON.stringify(selectedPlace, null, 2));
    console.log('ID:', selectedPlace.id);
    console.log('Display Name:', selectedPlace.displayName.text);
    console.log('Formatted Address:', selectedPlace.formattedAddress);
    console.log('Location:', {
      latitude: selectedPlace.location.latitude,
      longitude: selectedPlace.location.longitude,
    });
    console.log('Types:', selectedPlace.types);
    console.log('================================');

    const placePrediction = mapPlaceToPlacePrediction(selectedPlace);
    setPlaceId(placePrediction.placeId);
    setPlaceName(placePrediction.structuredFormat.mainText.text);
    setPlaceAddress(placePrediction.structuredFormat.secondaryText.text);
    closeMap();
    navigation.navigate('Feed');
  }, [
    selectedPlace,
    setPlaceId,
    setPlaceName,
    setPlaceAddress,
    closeMap,
    navigation,
  ]);

  const handleSearchSurrounding = useCallback(async () => {
    if (loading) return;

    // Check if current map region is within 30km from user's actual location
    const regionLocation = {
      latitude: region.latitude,
      longitude: region.longitude,
    };

    if (!isLocationWithinPerimeter(regionLocation, location)) {
      alert(
        t('outside-allowed-area') ||
          'You moved too far from your location. Maximum 30km allowed.'
      );
      return;
    }

    setLoading(true);
    try {
      const data = await fetchNearbyPlaces(region, mapSearchRadius);
      setPlaces(data.places || []);
      setSelectedPlace(null);
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [loading, region, location, t]);

  const onRegionChangeComplete = useCallback((newRegion: Region) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setRegion(newRegion);
      setSelectedPlace(null);
    }, DEBOUNCE_DELAY);
  }, []);

  const centerMapOnUserLocation = useCallback(() => {
    if (!location || !mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      500
    );
  }, [location]);

  return (
    <View style={styles.container}>
      <MapViewCluster
        style={styles.map}
        region={region}
        ref={mapRef}
        onRegionChangeComplete={onRegionChangeComplete}
        showsMyLocationButton={false}
        showsCompass={false}
        clusterColor={primaryColor}
        clusterTextColor={primaryBgColor}
      >
        {/* User's perimeter circle - 30km max range */}
        {location && (
          <Circle
            center={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            radius={GEOFENCE_CONFIG.maxRadiusKm * 1000} // Convert km to meters
            strokeColor="rgba(255, 165, 0, 0.5)"
            fillColor="rgba(255, 165, 0, 0.05)"
            strokeWidth={2}
          />
        )}

        {/* Search radius circle */}
        <Circle
          center={region}
          radius={mapSearchRadius}
          strokeColor={primaryColor}
          fillColor={`${primaryColor}20`}
          strokeWidth={2}
        />

        {/* Place markers */}
        {!loading &&
          places.map(place => (
            <Marker
              key={`${place.location.latitude}-${place.location.longitude}-${place.id}`}
              coordinate={{
                latitude: place.location.latitude,
                longitude: place.location.longitude,
              }}
              onPress={() => {
                console.log('=== PLACE SELECTED ===');
                console.log('Place Details:', JSON.stringify(place, null, 2));
                console.log('ID:', place.id);
                console.log('Display Name:', place.displayName.text);
                console.log('Formatted Address:', place.formattedAddress);
                console.log('Location:', {
                  latitude: place.location.latitude,
                  longitude: place.location.longitude,
                });
                console.log('Types:', place.types);
                console.log('====================');
                setSelectedPlace(place);
              }}
            >
              <View style={styles.markerContainer}>
                <FontAwesomeIcon
                  icon={Icons.Pin}
                  size={28}
                  color={selectedPlace?.id === place.id ? primaryColor : '#fff'}
                />
              </View>
            </Marker>
          ))}
      </MapViewCluster>

      {/* Center marker */}
      <View style={styles.centerMarker}>
        <FastImage
          style={styles.centerMarkerImage}
          source={require('../../../../../assets/pin.png')}
        />
        <View style={styles.centerMarkerShadow} />
      </View>

      {/* Enhanced header with place info when selected */}
      <BlurView
        intensity={80}
        tint="dark"
        style={[styles.header, { top: insets.top }]}
      >
        <TouchableOpacity onPress={closeMap} style={styles.headerButton}>
          <FontAwesomeIcon icon={Icons.X} size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          {selectedPlace ? (
            <View style={styles.placeInfo}>
              <Text style={styles.placeName} numberOfLines={1}>
                {selectedPlace.displayName.text}
              </Text>
              {selectedPlace.formattedAddress && (
                <Text style={styles.placeAddress} numberOfLines={1}>
                  {selectedPlace.formattedAddress}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.headerTitle}>{t('select-location')}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={centerMapOnUserLocation}
          style={styles.headerButton}
        >
          <FontAwesomeIcon
            icon={Icons.Location}
            size={20}
            color={primaryColor}
          />
        </TouchableOpacity>
      </BlurView>

      {/* Bottom action buttons with better styling */}
      <View
        style={[
          styles.bottomActions,
          { bottom: 30 + insets.bottom + tabBarHeight },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.searchButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSearchSurrounding}
          disabled={loading}
        >
          <View style={styles.buttonContent}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesomeIcon icon={Icons.Search} size={18} color="#fff" />
            )}
            <Text style={styles.searchButtonText}>
              {loading ? t('loading') : t('search-surrounding')}
            </Text>
          </View>
        </TouchableOpacity>

        {selectedPlace && !loading && (
          <TouchableOpacity
            style={[styles.actionButton, styles.selectButton]}
            onPress={pickPlace}
          >
            <View style={styles.buttonContent}>
              <FontAwesomeIcon
                icon={Icons.Check}
                size={18}
                color={primaryBgColor}
              />
              <Text style={styles.selectButtonText}>
                {t('select-location')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Full screen loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <BlurView
            intensity={50}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>{t('searching-places')}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Center marker
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -35,
    zIndex: 10,
    alignItems: 'center',
  },
  centerMarkerImage: {
    width: 40,
    height: 40,
  },
  centerMarkerShadow: {
    position: 'absolute',
    bottom: -5,
    width: 20,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    transform: [{ scaleX: 1.5 }],
  },

  // Place markers
  markerContainer: {
    backgroundColor: primaryBgColor,
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: primaryColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  // Enhanced header with place info
  header: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 15,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeInfo: {
    alignItems: 'center',
    width: '100%',
  },
  placeName: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  placeAddress: {
    color: separatorColor,
    fontSize: 12,
    textAlign: 'center',
  },

  // Bottom actions with consistent styling
  bottomActions: {
    position: 'absolute',
    left: 20,
    right: 20,
    gap: 12,
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  searchButton: {
    backgroundColor: postBgColor,
    borderColor: primaryDeepColor,
  },
  selectButton: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButtonText: {
    color: primaryBgColor,
    fontSize: 16,
    fontWeight: '700',
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
    gap: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MapSearch;
