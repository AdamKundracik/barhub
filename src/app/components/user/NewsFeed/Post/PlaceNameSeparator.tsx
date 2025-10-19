import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { separatorColor } from '@/src/app/utils/styles/colors';
import { usePlaceStore } from '@/src/app/utils/store/placesStore';

type Props = {
  placeNameLocal: string;
  placeIdLocal: string;
  placeAddressLocal?: string;
};

export const PlaceNameSeparator = (props: Props) => {
  const { setPlaceId, setPlaceName, setPlaceAddress } = usePlaceStore();

  const navigateToBar = () => {
    setPlaceName(props.placeNameLocal);
    setPlaceId(props.placeIdLocal);
    setPlaceAddress(props.placeAddressLocal || '');
  };

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <TouchableOpacity onPress={navigateToBar} style={styles.textWrapper}>
        <Text style={styles.text} numberOfLines={0}>
          {props.placeNameLocal}
        </Text>
      </TouchableOpacity>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: separatorColor,
  },
  textWrapper: {
    marginHorizontal: 15,
    flexShrink: 1,
  },
  text: {
    fontSize: 24,
    color: separatorColor,
    textAlign: 'center',
    flexShrink: 1,
  },
});

export default PlaceNameSeparator;
