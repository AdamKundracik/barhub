import { Animated, Dimensions, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { Icons } from '../../utils/icons/icons';
import { useRef, useState } from 'react';

type LayoutProps = {
  setSearching: (isSearching: boolean) => void;
};

const { height } = Dimensions.get('window');

export const ActionsRow = (props: LayoutProps) => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  function onSearchClick() {
    props.setSearching(true);
  }

  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  const showMenu = () => {
    setMenuVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 0.5,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(slideAnim, {
      toValue: height - 200,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));

    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

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

      {/* RADO */}
      {menuVisible && (
        <>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={hideMenu}>
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
          </TouchableOpacity>
          <Animated.View style={[styles.menuContainer, { transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity style={styles.menuItem} onPress={hideMenu}>
              <Text style={styles.menuText}>Item 1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={hideMenu}>
              <Text style={styles.menuText}>Item 2</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={hideMenu}>
              <Text style={styles.menuText}>Item 3</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={hideMenu}>
              <Text style={styles.menuText}>Item 4</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    paddingVertical: 20,
    alignItems: 'center',
  },
  menuItem: {
    marginVertical: 10,
  },
  menuText: {
    fontSize: 18,
  },
});

export default ActionsRow;
