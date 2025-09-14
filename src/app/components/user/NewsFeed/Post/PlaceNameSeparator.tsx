import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { iconInactiveColor } from '../../../../utils/styles/colors';
import { usePlaceStore } from '../../../../utils/store/placesStore';

type Props = {
  placeNameLocal: string;
  placeIdLocal: string;
};

export const PlaceNameSeparator = (props: Props) => {
  const { setPlaceId, setPlaceName } = usePlaceStore();

  const navigateToBar = () => {
    setPlaceName(props.placeNameLocal);
    setPlaceId(props.placeIdLocal);
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
    padding: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: iconInactiveColor,
  },
  textWrapper: {
    marginHorizontal: 15,
    flexShrink: 1,
  },
  text: {
    fontSize: 24,
    color: iconInactiveColor,
    textAlign: 'center',
    flexShrink: 1,
  },
});

export default PlaceNameSeparator;
