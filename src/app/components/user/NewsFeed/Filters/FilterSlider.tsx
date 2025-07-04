import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { primaryColor } from '../../../../utils/styles/colors';
import Slider from '@react-native-community/slider';
import MultiSelectPlaceChips from './MultiSelectPlaceChips';
import Button from '../../../shared/Button';
import { OccupancyTypes, PlaceType } from '../../../../utils/types/types';
import { useFiltersStore } from '../../../../utils/store/filtersStorage';
import { useLocationStore } from '../../../../utils/store/locationStore';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../../utils/types/screen-types';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../../utils/icons/icons';

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave?: (filters: {
    distance: number;
    placeTypes: string[];
    occupancyTypes: string[];
  }) => void;
};

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

const FilterSlider = (props: Props) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const {
    useFakeLocation,
    setUseFakeLocation,
    fakeLocation,
    fakeLocationName,
  } = useLocationStore();
  const {
    distance: storeDistance,
    selectedPlaces: storeSelectedPlaces,
    selectedOccupancy: storeSelectedOccupancy,
    updateFilters,
  } = useFiltersStore();

  const [tempDistance, setTempDistance] = useState(storeDistance);
  const [tempSelectedPlaces, setTempSelectedPlaces] = useState<PlaceType[]>(
    storeSelectedPlaces.length > 0 ? storeSelectedPlaces : PLACE_TYPES
  );
  const [tempSelectedOccupancy, setTempSelectedOccupancy] = useState<
    OccupancyTypes[]
  >(
    storeSelectedOccupancy.length > 0 ? storeSelectedOccupancy : OCCUPANCY_TYPES
  );
  const [_, setFakeLocationVal] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [fakeLocationNameVal, setFakeLocationNameVal] = useState('');

  useEffect(() => {
    setFakeLocationVal(fakeLocation);
    setFakeLocationNameVal(fakeLocationName);
  }, [fakeLocation, fakeLocationName, useFakeLocation]);

  useEffect(() => {
    if (props.opened) {
      setTempDistance(storeDistance);
      setTempSelectedPlaces(
        storeSelectedPlaces.length > 0 ? storeSelectedPlaces : PLACE_TYPES
      );
      setTempSelectedOccupancy(
        storeSelectedOccupancy.length > 0
          ? storeSelectedOccupancy
          : OCCUPANCY_TYPES
      );
    }
  }, [props.opened]);

  const handleSaveChanges = useCallback(() => {
    const finalPlaces =
      tempSelectedPlaces.length === 0 ? [...PLACE_TYPES] : tempSelectedPlaces;

    const finalOccupancy =
      tempSelectedOccupancy.length === 0
        ? [...OCCUPANCY_TYPES]
        : tempSelectedOccupancy;

    updateFilters({
      distance: tempDistance,
      placeTypes: finalPlaces,
      occupancy: finalOccupancy,
    });

    props.onSave?.({
      distance: tempDistance,
      placeTypes: finalPlaces,
      occupancyTypes: finalOccupancy,
    });
    bottomSheetRef?.current?.close();
    props.onClose();
  }, [
    tempDistance,
    tempSelectedPlaces,
    updateFilters,
    tempSelectedOccupancy,
    props.onSave,
    props.onClose,
  ]);

  const handleSelectionChange = useCallback(
    (places: PlaceType[], occupancy: OccupancyTypes[]) => {
      setTempSelectedPlaces(places);
      setTempSelectedOccupancy(occupancy);
    },
    []
  );

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

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter
        {...props}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        bottomInset={20}
      >
        <View style={styles.footerContainer}>
          <Button
            color={primaryColor}
            text={t('save-changes')}
            clickFuntion={handleSaveChanges}
          />
        </View>
      </BottomSheetFooter>
    ),
    [handleSaveChanges, t]
  );

  return (
    <BottomSheet
      backgroundStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClose={props.onClose}
      ref={bottomSheetRef}
      snapPoints={['90%', '70%']}
      index={props.opened ? 1 : -1}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      handleHeight={60}
      enablePanDownToClose
      handleIndicatorStyle={{
        backgroundColor: 'white',
        width: '10%',
        margin: 5,
      }}
      handleStyle={{ padding: 10 }}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInset={{ bottom: 100 }}
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
        <View style={styles.fakeLocationSection}>
          <View style={styles.fakeLocationHeader}>
            <Text style={styles.sectionTitle}>
              {t('use-different-location')}
            </Text>
            <Switch
              value={useFakeLocation}
              onValueChange={setUseFakeLocation}
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
                  ? fakeLocationNameVal || t('select-city')
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
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 15,
    paddingBottom: 50,
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
  footerContainer: {
    padding: 12,
    margin: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
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
