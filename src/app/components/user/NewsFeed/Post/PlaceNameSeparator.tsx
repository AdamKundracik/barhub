import { StyleSheet, Text, View } from 'react-native';
import { commonAppStyles } from '../../../../utils/styles/styles';
import {
  iconInactiveColor,
  primaryGrey,
} from '../../../../utils/styles/colors';

type Props = {
  placeName: string;
};

export const PlaceNameSeparator = (props: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{props.placeName}</Text>
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
