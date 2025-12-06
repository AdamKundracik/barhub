import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '@/src/app/utils/styles/themeColors';
import { usePlaceStore } from '@/src/app/utils/store/placesStore';

type Props = {
  placeNameLocal: string;
  placeIdLocal: string;
  placeAddressLocal?: string;
};

export const PlaceNameSeparator = (props: Props) => {
  const { setPlaceId, setPlaceName, setPlaceAddress } = usePlaceStore();
  const colors = useThemeColors();

  const navigateToBar = () => {
    setPlaceName(props.placeNameLocal);
    setPlaceId(props.placeIdLocal);
    setPlaceAddress(props.placeAddressLocal || '');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: colors.separatorColor }]} />
      <TouchableOpacity onPress={navigateToBar} style={styles.textWrapper}>
        <Text style={[styles.text, { color: colors.separatorColor }]} numberOfLines={0}>
          {props.placeNameLocal}
        </Text>
      </TouchableOpacity>
      <View style={[styles.line, { backgroundColor: colors.separatorColor }]} />
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
    // backgroundColor is set inline to use theme colors
  },
  textWrapper: {
    marginHorizontal: 15,
    flexShrink: 1,
  },
  text: {
    fontSize: 24,
    // color is set inline to use theme colors
    textAlign: 'center',
    flexShrink: 1,
  },
});

export default PlaceNameSeparator;
