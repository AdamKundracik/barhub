import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import {
  OccupancyTypes,
  PlaceType,
} from '@/src/app/utils/types/Feed/PostTypes';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '@/src/app/utils/types/screen-types';
import { useFiltersStore } from '@/src/app/utils/store/filtersStorage';
import { useLocationStore } from '@/src/app/utils/store/locationStore';
import { primaryColor } from '@/src/app/utils/styles/colors';
import Slider from '@react-native-community/slider';
import MultiSelectPlaceChips from '@/src/app/components/user/NewsFeed/Filters/MultiSelectPlaceChips';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import { useNewsFeedData } from '@/src/app/utils/hooks/NewsFeed/usePostData';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { PremiumHelpers } from '@/src/app/config/premiumConfig';
import { useModalsStore } from '@/src/app/utils/store/modalsStore';
import { useUserRole } from '@/src/app/hooks/useUserRole';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PLACE_TYPES: PlaceType[] = [
  'bar',
  'cafe',
  'bakery',
  'casino',
  'night_club',
  'restaurant',
];

export const OCCUPANCY_TYPES: OccupancyTypes[] = [
  'FULL',
  'ALMOST_FULL',
  'SPARSELY_OCCUPIED',
  'EMPTY',
];

const FilterSlider = () => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const {
    setFakeLocation,
    fakeLocation,
    useFakeLocation,
    setUseFakeLocation,
    fakeLocationName,
    setFakeLocationName,
  } = useLocationStore();

  const { isPremium } = useUserStore();
  const { hasAdminAccess } = useUserRole();

  const { isRefetching } = useNewsFeedData(); // inside FilterSlider

  const {
    distance: storeDistance,
    selectedPlaces: storeSelectedPlaces,
    selectedOccupancy: storeSelectedOccupancy,
    showHighlightedPosts: storeShowHighlightedPosts,
    updateFilters,
    setShowHighlightedPosts,
  } = useFiltersStore();

  const { isFilterOpen, closeFilter } = useModalsStore();

  const handleClose = useCallback(() => {
    closeFilter();
  }, [closeFilter]);

  const [tempDistance, setTempDistance] = useState(storeDistance);
  const [tempSelectedPlaces, setTempSelectedPlaces] = useState<PlaceType[]>(
    storeSelectedPlaces.length > 0 ? storeSelectedPlaces : PLACE_TYPES
  );
  const [tempSelectedOccupancy, setTempSelectedOccupancy] = useState<
    OccupancyTypes[]
  >(
    storeSelectedOccupancy.length > 0 ? storeSelectedOccupancy : OCCUPANCY_TYPES
  );

  const loadSavedPlaceFromStorage = useCallback(async () => {
    try {
      const savedPlaceJson = await AsyncStorage.getItem('fakeLocationPlace');
      if (!savedPlaceJson) return;
      const savedPlace = JSON.parse(savedPlaceJson);
      setFakeLocation({
        latitude: savedPlace.latitude,
        longitude: savedPlace.longitude,
      });

      // Support both old placeName and new fakeLocationName for compatibility
      const name = savedPlace.fakeLocationName || savedPlace.placeName;
      setFakeLocationName(name);
    } catch (error) {
      console.error('Error loading saved place from AsyncStorage:', error);
    }
  }, []);

  // otvorenie a zatvorenie podľa store
  useEffect(() => {
    if (isFilterOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isFilterOpen]);

  useEffect(() => {
    if (isFilterOpen) {
      setTempDistance(storeDistance);
      setTempSelectedPlaces(storeSelectedPlaces);
      setTempSelectedOccupancy(storeSelectedOccupancy);

      // Load saved place from AsyncStorage when filter opens and travel mode is enabled
      if (useFakeLocation) {
        loadSavedPlaceFromStorage();
      }
    }
  }, [isFilterOpen, useFakeLocation, loadSavedPlaceFromStorage]);

  const handleSaveChanges = useCallback(() => {
    const finalPlaces =
      tempSelectedPlaces.length === 0 ? [] : tempSelectedPlaces;

    const finalOccupancy =
      tempSelectedOccupancy.length === 0 ? [] : tempSelectedOccupancy;

    updateFilters({
      distance: tempDistance,
      placeTypes: finalPlaces,
      occupancy: finalOccupancy,
    });
    bottomSheetRef?.current?.close();
  }, [
    tempDistance,
    tempSelectedPlaces,
    updateFilters,
    tempSelectedOccupancy,
    isFilterOpen,
  ]);

  const handleSelectionChange = useCallback(
    (places: PlaceType[], occupancy: OccupancyTypes[]) => {
      setTempSelectedPlaces(places);
      setTempSelectedOccupancy(occupancy);
    },
    []
  );

  async function handleFakeLocationToggle(value: boolean) {
    // Check if fake location should be gated behind premium
    if (
      PremiumHelpers.shouldGateFakeLocation() &&
      !isPremium() &&
      !hasAdminAccess
    ) {
      navigation.navigate('Subscription');
      return;
    }

    // Allow toggle for all users (when premium is disabled) or premium/admin users
    setUseFakeLocation(value);

    // If enabling travel mode, try to load saved place from AsyncStorage
    if (value) {
      await loadSavedPlaceFromStorage();
    }
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.8}
        disappearsOnIndex={-1}
        appearsOnIndex={1}
      />
    ),
    []
  );

  return (
    <BottomSheet
      backgroundStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClose={handleClose}
      ref={bottomSheetRef}
      snapPoints={['100%', '90%']}
      index={-1}
      backdropComponent={renderBackdrop}
      handleHeight={50}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      handleStyle={styles.handleStyle}
    >
      <View style={styles.container}>
        {/* Save button in top right corner */}
        <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{t('save')}</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Text style={styles.title}>{t('filters')}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.distanceHeader}>
              <Text style={styles.sectionTitle}>{t('distance')}</Text>
              <Text style={styles.sectionTitle}>{tempDistance} km</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumTrackTintColor={primaryColor}
              value={tempDistance}
              minimumValue={1}
              maximumValue={30}
              onValueChange={value => setTempDistance(Number(value.toFixed(0)))}
            />
          </View>

          <View style={styles.section}>
            <MultiSelectPlaceChips
              onSelectionChange={handleSelectionChange}
              initialSelected={tempSelectedPlaces}
              initialOccupancy={tempSelectedOccupancy}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.fakeLocationHeader}>
              <Text style={styles.sectionTitle}>
                {t('show-highlighted-posts') || 'Show highlighted posts'}
              </Text>
              <Switch
                value={storeShowHighlightedPosts}
                onValueChange={setShowHighlightedPosts}
                disabled={isRefetching}
              />
            </View>
          </View>

          <View style={styles.fakeLocationSection}>
            <View style={styles.fakeLocationHeader}>
              <Text style={styles.sectionTitle}>{t('use-travel-mode')}</Text>
              <Switch
                value={useFakeLocation}
                onValueChange={handleFakeLocationToggle}
                disabled={isRefetching}
              />
            </View>

            <Pressable
              disabled={!useFakeLocation}
              onPress={() => navigation.navigate('SelectFakeLocation')}
              style={[
                styles.fakeLocationButton,
                {
                  backgroundColor: useFakeLocation ? '#222' : '#444',
                  opacity: useFakeLocation ? 1 : 0.5,
                },
              ]}
            >
              <View style={styles.fakeLocationButtonContent}>
                <Text
                  style={styles.fakeLocationButtonText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {useFakeLocation
                    ? fakeLocationName || t('select-city')
                    : t('Selected-location')}
                </Text>
                <FontAwesomeIcon
                  icon={Icons.ChevronRight}
                  color={'white'}
                  size={14}
                  style={styles.icon}
                />
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: '#444',
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  handleStyle: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  saveButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: primaryColor,
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 150,
    paddingTop: 50, // Space for save button
  },
  section: {
    marginVertical: 10,
  },
  distanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: 'white',
  },
  slider: {
    paddingVertical: 10,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  fakeLocationSection: {
    marginTop: 24,
  },
  fakeLocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fakeLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  fakeLocationButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  fakeLocationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fakeLocationButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  icon: {
    alignSelf: 'center',
  },
});

export default FilterSlider;
