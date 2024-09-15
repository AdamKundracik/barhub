import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { iconInactiveColor } from '../../../../utils/styles/colors';
import { PlaceState, usePlaceStore } from '../../../../utils/store/placesStore';

type Props = {
  placeNameLocal: string;
  placeIdLocal: string;
};

export const PlaceNameSeparator = (props: Props) => {
  const { setPlaceId, setPlaceName } = usePlaceStore();

  const navigateToBar = async () => {
    setPlaceName(props.placeNameLocal);
    setPlaceId(props.placeIdLocal);
  };

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <TouchableOpacity onPress={() => navigateToBar()}>
        <Text style={styles.text}>{props.placeNameLocal}</Text>
      </TouchableOpacity>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  line: {
    borderBottomColor: iconInactiveColor,
    borderBottomWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 24,
    color: iconInactiveColor,
    textAlign: 'center',
    marginHorizontal: 15,
  },
});

export default PlaceNameSeparator;
