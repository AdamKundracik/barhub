import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../firebaseConfig';
import { useTranslation } from 'react-i18next';

type MenuProps = {
  setOpenMenu: (isOpen: boolean) => void;
  isOpen: boolean;
};

export enum MenuItemType {
  ACCOUNT = 'ACCOUNT',
  INFO = 'INFO',
  HELP = 'HELP',
  SUBSCRIPTION = 'SUBSCRIPTION',
  LOGOUT = 'LOGOUT',
}

const { height } = Dimensions.get('window');

export const RollupMenu = (props: MenuProps) => {
  const { setOpenMenu, isOpen } = props;
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();

  const menuItems = [
    {
      type: MenuItemType.ACCOUNT,
      title: t('account'), // Translate the title
      icon: Icons.Gear,
      function: () => navigation.navigate('Account'),
    },
    {
      type: MenuItemType.INFO,
      title: t('info'), // Translate the title
      icon: Icons.Info,
      function: () => navigation.navigate('Info'), // Original function
    },
    {
      type: MenuItemType.HELP,
      title: t('help'), // Translate the title
      icon: Icons.Help,
      function: () => navigation.navigate('Help'), // Original function
    },
    {
      type: MenuItemType.SUBSCRIPTION,
      title: t('subscription'), // Translate the title
      icon: Icons.Coins,
      function: () => navigation.navigate('Subscription'), // Original function
    },
    {
      type: MenuItemType.LOGOUT,
      title: t('logout'), // Translate the title
      icon: Icons.LogOut,
      function: () => handleSignOut(), // Original function
    },
  ];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const menuItemAnimations = useRef(
    menuItems.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (isOpen) {
      showMenu();
    } else {
      hideMenu();
    }
  }, [isOpen]);

  const showMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0.8,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate each menu item
    menuItemAnimations.forEach((itemAnim, index) => {
      Animated.timing(itemAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 100, // Staggered delay for each item
        useNativeDriver: true,
      }).start();
    });
  };

  const hideMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.timing(slideAnim, {
      toValue: height,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setOpenMenu(false);
      menuItemAnimations.forEach(itemAnim => {
        itemAnim.setValue(0);
      });
    });
  };

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        Alert.alert(t('Signed out'), t('You have been signed out'), [
          { text: 'Ok' },
        ]);
      })
      .catch(error => {
        console.error(error);
      });
  };

  // Define your menu items as an array

  function handleOutsideClick() {
    if (isOpen) {
      hideMenu();
    }
  }

  return (
    <>
      {isOpen && (
        <TouchableWithoutFeedback onPress={handleOutsideClick}>
          <View style={StyleSheet.absoluteFillObject}>
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
          </View>
        </TouchableWithoutFeedback>
      )}

      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={{ justifyContent: 'center' }}>
          {menuItems.map((item, index) => (
            <Animated.View
              key={index}
              style={{
                opacity: menuItemAnimations[index],
                transform: [
                  {
                    translateY: menuItemAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={item.function} // Call the function associated with the item
              >
                <FontAwesomeIcon
                  style={styles.icon}
                  icon={item.icon}
                  color={
                    item.type === MenuItemType.SUBSCRIPTION
                      ? '#FBBC05'
                      : 'white'
                  }
                  size={20}
                />
                <Text
                  style={[
                    styles.menuText,
                    {
                      color:
                        item.type === MenuItemType.SUBSCRIPTION
                          ? '#FBBC05'
                          : 'white',
                    },
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <View style={styles.bottomTab}>
          <TouchableOpacity onPress={hideMenu}>
            <FontAwesomeIcon icon={Icons.Remove} size={28} color={'white'} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  bottomTab: {
    flexDirection: 'row',
    paddingVertical: 30,
  },
  menuContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    bottom: 0,
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    zIndex: 10000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    width: '100%',
  },
  icon: {
    marginRight: 20,
  },
  menuText: {
    fontSize: 18,
    color: 'white',
  },
});

export default RollupMenu;
