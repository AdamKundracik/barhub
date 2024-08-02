import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { commonAppStyles } from '../../utils/styles/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlacePrediction } from '../../utils/types/types';

type LayoutProps = {
  place: string;
  setPlace: (place: PlacePrediction | null) => void;
};

export const PlaceFilterChip = (props: LayoutProps) => {
  async function removeSavedPlace() {
    await AsyncStorage.removeItem('savedPlace');
    props.setPlace(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.chipText}>
        <Text style={commonAppStyles.textPrimary}>{props.place}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteIcon}
        onPress={() => removeSavedPlace()}
      >
        <FontAwesomeIcon icon={Icons.Remove} size={12} color={'white'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
    display: 'flex',
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deleteIcon: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PlaceFilterChip;
