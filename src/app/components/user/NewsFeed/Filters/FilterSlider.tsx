import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetFooter,
  BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { primaryColor } from '../../../../utils/styles/colors';
import Slider from '@react-native-community/slider';
import MultiSelectPlaceChips from './MultiSelectPlaceChips';
import Button from '../../../shared/Button';
import { PlaceType } from '../../../../utils/types/types';
import { useFiltersStore } from '../../../../utils/store/filtersStorage';

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave?: (filters: { distance: number; placeTypes: string[] }) => void;
};

const FilterSlider = (props: Props) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const {
    distance: storeDistance,
    selectedPlaces: storeSelectedPlaces,
    updateFilters,
  } = useFiltersStore();
  const [filtersOpened, setFiltersOpened] = useState(props.opened);
  const [tempDistance, setTempDistance] = useState(storeDistance);
  const [tempSelectedPlaces, setTempSelectedPlaces] =
    useState<PlaceType[]>(storeSelectedPlaces);

  useEffect(() => {
    if (props.opened) {
      setTempDistance(storeDistance);
      setTempSelectedPlaces(storeSelectedPlaces);
    }
  }, [props.opened, storeDistance, storeSelectedPlaces]);

  useEffect(() => {
    setFiltersOpened(props.opened);
  }, [props.opened]);

  if (bottomSheetRef.current) {
    if (filtersOpened) {
      bottomSheetRef.current.expand();
    } else {
      bottomSheetRef.current.close();
    }
  }

  const handleCloseFilters = useCallback(() => {
    bottomSheetRef.current?.close();
    setFiltersOpened(false);
    props.onClose();
  }, [props]);

  const handleSaveChanges = useCallback(() => {
    if (tempSelectedPlaces.length === 0) {
      Alert.alert(
        t('error'),
        t('please-select-place'),
        [{ text: t('ok'), style: 'default' }],
        { cancelable: true }
      );
      return;
    }

    updateFilters({
      distance: tempDistance,
      placeTypes: tempSelectedPlaces,
    });

    props.onSave?.({
      distance: tempDistance,
      placeTypes: tempSelectedPlaces,
    });

    handleCloseFilters();
  }, [
    tempDistance,
    tempSelectedPlaces,
    updateFilters,
    props.onSave,
    handleCloseFilters,
    t,
  ]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={20}>
        <View style={styles.footerContainer}>
          <Button
            color={primaryColor}
            text={t('save-changes')}
            clickFuntion={handleSaveChanges}
          />
        </View>
      </BottomSheetFooter>
    ),
    [handleSaveChanges]
  );

  return (
    <BottomSheet
      backgroundStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClose={handleCloseFilters}
      ref={bottomSheetRef}
      snapPoints={['90%', '70%']}
      index={-1}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      handleHeight={60}
      enablePanDownToClose
      handleIndicatorStyle={{ backgroundColor: 'white', width: '10%' }}
      handleStyle={{ padding: 10 }}
    >
      <View style={styles.content}>
        <View>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>
            {t('filters')}
          </Text>
        </View>
        <View style={styles.section}>
          <View style={styles.distanceHeader}>
            <Text style={styles.sectionTitle}>{t('distance')}</Text>
            <Text style={styles.distanceText}>{tempDistance} km</Text>
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
          <Text style={styles.sectionTitle}>{t('places-types')}:</Text>
          <MultiSelectPlaceChips
            onSelectionChange={setTempSelectedPlaces}
            initialSelected={tempSelectedPlaces}
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  section: {
    marginVertical: 10,
  },
  distanceHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: 'white',
    marginBottom: 10,
  },
  slider: {
    paddingVertical: 30,
  },
  distanceText: {
    color: 'white',
  },
  footerContainer: {
    display: 'flex',
    alignSelf: 'center',
    padding: 12,
    margin: 12,
  },
});
export default FilterSlider;
