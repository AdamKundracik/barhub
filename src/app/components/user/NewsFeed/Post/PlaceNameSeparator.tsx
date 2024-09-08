import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { iconInactiveColor } from '../../../../utils/styles/colors';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../../utils/types/screen-types';
import { fetchPlaceDetails } from '../../../../utils/helper-functions/fetchPlaceDetail';
import {
  mapPlaceDetailToPlacePrediction,
  mapPlaceToPlacePrediction,
} from '../../../../utils/helper-functions/mapPlaceToPlacePrediction';

type Props = {
  placeName: string;
  placeId: string;
};

export const PlaceNameSeparator = (props: Props) => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const navigateToBar = async () => {
    const detailData = await fetchPlaceDetails(props.placeId);
    const place = mapPlaceDetailToPlacePrediction(detailData);
    navigation.navigate('Feed', {
      selectedPlace: place,
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
    marginHorizontal: 10,
  },
  text: {
    fontSize: 24,
    color: iconInactiveColor,
    textAlign: 'center',
  },
});

export default PlaceNameSeparator;
