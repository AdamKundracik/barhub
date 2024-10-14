import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { primaryColor, primaryTextColor } from '../../../utils/styles/colors';
import Svg, { Path } from 'react-native-svg';
import { PlaceState, usePlaceStore } from '../../../utils/store/placesStore';

type LayoutProps = {
  place: string;
};

export const PlaceFilterChip = (props: LayoutProps) => {
  const { setPlaceId, setPlaceName } = usePlaceStore();

  async function removeSavedPlace() {
    setPlaceId(null);
    setPlaceName(null);
  }

  return (
    <>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <View style={{ alignSelf: 'center', paddingHorizontal: 15 }}>
          <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path
              d="M0.572161 14.3082C0.465239 14.4151 0.376362 14.5567 0.340956 14.6991L0.00353333 15.8898C-0.014518 15.9606 0.0389428 16.0141 0.110455 15.9967L1.30117 15.6766C1.44351 15.6412 1.58584 15.5523 1.69206 15.4454L5.54885 11.5886L4.39354 10.4333L0.572161 14.3082ZM3.96736 5.35035C3.89654 5.27953 3.80767 5.24343 3.71881 5.24343C3.62994 5.24343 3.54107 5.27884 3.47026 5.35035L2.04833 6.77228C1.906 6.91461 1.906 7.12776 2.04833 7.2701L8.73173 13.9708C8.80255 14.0416 8.89142 14.0777 8.98028 14.0777C9.06915 14.0777 9.15802 14.0423 9.22884 13.9708L10.6508 12.5488C10.7931 12.4065 10.7931 12.1934 10.6508 12.051L3.96736 5.35035ZM5.33582 5.97245L10.0278 10.6645L13.2625 6.38054L9.61954 2.73684L5.33582 5.97245ZM15.8933 4.39014L11.5921 0.106922C11.5213 0.0361028 11.4324 0 11.3436 0C11.2547 0 11.1658 0.0354096 11.095 0.106922L9.67308 1.54691C9.53075 1.68924 9.53075 1.9024 9.67308 2.04473L13.9742 6.3459C14.045 6.41672 14.1339 6.45282 14.2228 6.45282C14.3116 6.45282 14.4005 6.41741 14.4713 6.3459L15.8933 4.92396C16.0356 4.76358 16.0356 4.53247 15.8933 4.39014Z"
              fill="#10D9B9"
            />
          </Svg>
        </View>
        <TouchableOpacity
          style={styles.container}
          onPress={() => removeSavedPlace()}
        >
          <View style={styles.chipText}>
            <Text style={{ color: primaryTextColor }}>{props.place}</Text>
          </View>
          <View style={styles.deleteIcon}>
            <FontAwesomeIcon icon={Icons.Remove} size={10} color={'white'} />
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 30,
    borderWidth: 2,
    borderColor: primaryColor,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '90%', // Optionally limit the maximum width of the chip
  },
  deleteIcon: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 1, // Allows the text to shrink but still allows wrapping
  },
  text: {
    color: primaryTextColor,
    flexWrap: 'wrap', // Allow text to wrap
    // If you want to allow multiple lines, remove numberOfLines={1} from the Text component
  },
});

export default PlaceFilterChip;
