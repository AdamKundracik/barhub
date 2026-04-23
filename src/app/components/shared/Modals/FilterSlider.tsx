import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
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
  BottomSheetScrollView,
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
import { useModalsStore } from '@/src/app/utils/store/modalsStore';
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
  const bottomSheetRef = useRef<BottomSheet>(null);
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const {
    setFakeLocation,
    useFakeLocation,
    setUseFakeLocation,
    fakeLocationName,
    setFakeLocationName,
  } = useLocationStore();

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
      const name = savedPlace.fakeLocationName || savedPlace.placeName;
      setFakeLocationName(name);
    } catch (error) {
      console.error('Error loading saved place from AsyncStorage:', error);
    }
  }, []);

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

      if (useFakeLocation) {
        loadSavedPlaceFromStorage();
      }
    }
  }, [isFilterOpen, useFakeLocation, loadSavedPlaceFromStorage]);

  const handleSaveChanges = useCallback(() => {
    updateFilters({
      distance: tempDistance,
      placeTypes: tempSelectedPlaces.length === 0 ? [] : tempSelectedPlaces,
      occupancy:
        tempSelectedOccupancy.length === 0 ? [] : tempSelectedOccupancy,
    });
    bottomSheetRef.current?.close();
  }, [
    tempDistance,
    tempSelectedPlaces,
    tempSelectedOccupancy,
    updateFilters,
    // isFilterOpen removed — it was not used inside the callback,
    // causing a stale closure on every filter open/close cycle
  ]);

  const handleSelectionChange = useCallback(
    (places: PlaceType[], occupancy: OccupancyTypes[]) => {
      setTempSelectedPlaces(places);
      setTempSelectedOccupancy(occupancy);
    },
    []
  );

  async function handleFakeLocationToggle(value: boolean) {
    setUseFakeLocation(value);
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
        appearsOnIndex={0}
        // appearsOnIndex changed from 1 to 0 — with a single snap point
        // the sheet is at index 0 when open, so the backdrop must appear at 0
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      backgroundStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClose={handleClose}
      // Single snap point replaces ['100%', '90%'] — two points that are
      // 10% apart gave users an extra snap position that served no purpose
      // and made the sheet feel unstable when dragging
      snapPoints={['90%']}
      index={-1}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      handleStyle={styles.handleStyle}
    >
      {/*
        Structure: fixed header outside the scroll + BottomSheetScrollView
        for the content below it.

        The outer View wrapper with flex:1 has been removed — it was
        preventing BottomSheet from correctly managing the scroll view's
        height within the sheet.

        Plain ScrollView replaced with BottomSheetScrollView — a native
        ScrollView inside a BottomSheet creates a gesture conflict where
        swipe-to-dismiss fights the scroll gesture.
      */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('filters')}</Text>
        <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{t('save')}</Text>
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
            />
          </View>
        </View>

        <View style={styles.fakeLocationSection}>
          <View style={styles.fakeLocationHeader}>
            <Text style={styles.sectionTitle}>{t('use-travel-mode')}</Text>
            <Switch
              value={useFakeLocation}
              onValueChange={handleFakeLocationToggle}
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
                color="white"
                size={14}
                style={styles.icon}
              />
            </View>
          </Pressable>
        </View>
      </BottomSheetScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 8,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  saveButtonText: {
    color: primaryColor,
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 150,
    paddingTop: 10,
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
    fontSize: 22,
    fontWeight: '700',
  },
  fakeLocationSection: {
    marginTop: 24,
  },
  fakeLocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
