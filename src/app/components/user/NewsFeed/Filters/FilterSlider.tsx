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

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave?: (filters: { distance: number; placeTypes: string[] }) => void;
};

const FilterSlider = (props: Props) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [filtersOpened, setFiltersOpened] = useState(props.opened);
  const [snapPoint, setSnapPoint] = useState<string[]>(['90%', '70%']);
  const [distance, setDistance] = useState(1);
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceType[]>(['bar']);

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
  }, [bottomSheetRef, props]);

  const handleSaveChanges = useCallback(() => {
    if (selectedPlaces.length === 0) {
      Alert.alert(
        t('error'),
        t('please-select-place'),
        [
          {
            text: t('ok'),
            style: 'default',
          },
        ],
        {
          cancelable: true,
        }
      );
      return;
    }

    props.onSave?.({
      distance,
      placeTypes: selectedPlaces,
    });
    console.log(selectedPlaces);
    handleCloseFilters();
  }, [distance, selectedPlaces, props.onSave, handleCloseFilters]);

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
      snapPoints={snapPoint}
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
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>
            {t('filters')}
          </Text>
        </View>
        <View style={styles.section}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text style={styles.sectionTitle}>{t('distance')}</Text>
            <Text style={styles.distanceText}>{distance} km</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumTrackTintColor={primaryColor}
            value={distance}
            minimumValue={1}
            maximumValue={30}
            onSlidingComplete={value => setDistance(Number(value.toFixed(0)))}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('places-types')}:</Text>
          <MultiSelectPlaceChips
            onSelectionChange={setSelectedPlaces}
            initialSelected={selectedPlaces}
          />
          <Text style={{ color: 'white' }}></Text>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 10,
  },
  section: {
    marginVertical: 10,
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
