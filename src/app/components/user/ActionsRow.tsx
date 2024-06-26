import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { Icons } from '../../utils/icons/icons';

type LayoutProps = {
  setSearching: (isSearching: boolean) => void;
};

export const ActionsRow = (props: LayoutProps) => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  function onSearchClick() {
    props.setSearching(true);
  }

  return (
    <View style={styles.row}>
      <View style={{ paddingVertical: 15 }}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Camera');
          }}
        >
          <FontAwesomeIcon
            style={styles.icon}
            icon={Icons.Camera}
            color={'white'}
            size={24}
          />
        </TouchableOpacity>
      </View>
      <View style={{ display: 'flex', flexDirection: 'row' }}>
        <TouchableOpacity onPress={onSearchClick}>
          <FontAwesomeIcon
            style={styles.icon}
            icon={Icons.Search}
            color={'white'}
            size={24}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Account')}>
          <FontAwesomeIcon
            style={styles.icon}
            icon={Icons.User}
            color={'white'}
            size={24}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    marginHorizontal: 10,
  },
});

export default ActionsRow;
