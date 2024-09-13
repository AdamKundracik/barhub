import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { iconInactiveColor } from '../../../../utils/styles/colors';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../../utils/types/screen-types';

type Props = {
  placeName: string;
  placeId: string;
};

export const PlaceNameSeparator = (props: Props) => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const navigateToBar = async () => {
    navigation.navigate('Feed', {
      selectedPlaceId: props.placeId,
      selectedPlaceName: props.placeName,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <TouchableOpacity onPress={() => navigateToBar()}>
        <Text style={styles.text}>{props.placeName}</Text>
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
